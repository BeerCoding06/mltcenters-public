/**
 * 3D English Runner — in-process API (uses same OpenAI/Groq as /api/assess).
 */
import { Router } from 'express';
import { randomUUID } from 'crypto';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BANK_CANDIDATES = [
  path.join(__dirname, 'data/fallback_questions.json'),
  path.join(__dirname, '../runner-3d/backend/app/data/fallback_questions.json'),
];
const BANK_PATH = BANK_CANDIDATES.find((p) => existsSync(p));
if (!BANK_PATH) {
  throw new Error(`Question bank not found. Tried: ${BANK_CANDIDATES.join(', ')}`);
}

const QUESTION_BANK = JSON.parse(readFileSync(BANK_PATH, 'utf-8'));

const TOPICS = [
  'daily life',
  'food and cooking',
  'school and study',
  'animals',
  'sports',
  'travel',
  'weather',
  'family',
  'jobs',
  'hobbies',
  'technology',
  'nature',
  'shopping',
  'health',
  'music and movies',
  'city life',
  'feelings',
  'clothes',
  'time and dates',
  'transport',
];

const QUESTION_STYLES = [
  'vocabulary — choose the correct meaning',
  'grammar — fill in the blank',
  'conversation — pick the best reply',
  'reading — short situational question',
  'prepositions or articles',
  'past tense or present tense',
  'comparatives and superlatives',
  'countable vs uncountable nouns',
];

const QUESTION_PROMPT = `You create fresh, unique English multiple-choice questions for a 3D runner learning game.

Return ONLY valid JSON (no markdown):
{"question":"...","options":["A","B","C"],"correct_index":0,"explanation":"..."}

Rules:
- Exactly 3 distinct options, correct_index is 0, 1, or 2
- Match the requested difficulty (beginner A1-A2, elementary A2, intermediate B1)
- Match the topic and question style given
- Never repeat or paraphrase questions from the avoid list
- Be creative — new scenarios, words, and sentences every time
- Keep questions short and clear for mobile players`;

const EVALUATE_PROMPT_TH = `ประเมินผลการเล่นเกมวิ่งตอบคำถามภาษาอังกฤษของผู้เล่น
ตอบเป็นภาษาไทยทั้งหมด Return ONLY valid JSON (no markdown):
{"overall":0-100,"vocabulary":0-100,"grammar":0-100,"reaction":0-100,"level":"Beginner|Elementary|Intermediate","strengths":["..."],"improvements":["..."],"summary":"ย่อหน้าสรุปภาษาไทยที่ให้กำลังใจ 2-3 ประโยค"}

กฎ:
- strengths และ improvements อย่างละ 1-2 ข้อ เป็นภาษาไทย
- summary อธิบายผลงาน คะแนน และแนะนำอย่างเป็นมิตร`;

const LEVEL_TH = {
  beginner: 'เริ่มต้น',
  elementary: 'พื้นฐาน',
  intermediate: 'ปานกลาง',
  Beginner: 'เริ่มต้น',
  Elementary: 'พื้นฐาน',
  Intermediate: 'ปานกลาง',
};

function thaiEvaluationFallback(state, acc) {
  const level = LEVEL_TH[state.difficulty] || state.difficulty;
  let summary;
  if (acc >= 80) {
    summary = `ยอดเยี่ยมมาก! คุณได้ ${state.score} คะแนน ความแม่นยำ ${acc}% แสดงว่าพื้นฐานภาษาอังกฤษแข็งแรง ลองเพิ่มความเร็วในการตอบในครั้งถัดไป`;
  } else if (acc >= 50) {
    summary = `ทำได้ดี! คุณได้ ${state.score} คะแนน ความแม่นยำ ${acc}% ฝึกคำศัพท์และไวยากรณ์เพิ่มอีกนิด แล้วคุณจะวิ่งได้ไกลขึ้น`;
  } else {
    summary = `สู้ต่อไป! คุณได้ ${state.score} คะแนน ความแม่นยำ ${acc}% ลองทบทวนคำศัพท์พื้นฐานและเล่นอีกครั้งเพื่อพัฒนาทักษะ`;
  }
  return {
    overall: acc,
    vocabulary: Math.min(100, acc + 5),
    grammar: acc,
    reaction: Math.min(100, state.streak * 15),
    level,
    strengths: ['ตั้งใจเล่นจนจบการแข่งขัน และพยายามตอบคำถามต่อเนื่อง'],
    improvements: ['ฝึกคำศัพท์และไวยากรณ์ภาษาอังกฤษทุกวันสัก 10 นาที'],
    summary,
  };
}

async function evaluatePerformance(openai, model, state) {
  const acc = state.questions_answered
    ? Math.round((state.correct_count / state.questions_answered) * 100)
    : 0;
  const stats = {
    score: state.score,
    questions_answered: state.questions_answered,
    correct_count: state.correct_count,
    accuracy: acc,
    streak: state.streak,
    difficulty: state.difficulty,
    distance: state.distance,
  };

  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: EVALUATE_PROMPT_TH },
          { role: 'user', content: JSON.stringify(stats) },
        ],
        max_tokens: 500,
        temperature: 0.4,
      });
      const raw = completion.choices[0]?.message?.content?.trim() || '';
      const json = raw.match(/\{[\s\S]*\}/);
      const data = JSON.parse(json ? json[0] : raw);
      return {
        overall: Number(data.overall) || acc,
        vocabulary: Number(data.vocabulary) || acc,
        grammar: Number(data.grammar) || acc,
        reaction: Number(data.reaction) || Math.min(100, state.streak * 15),
        level: LEVEL_TH[data.level] || data.level || LEVEL_TH[state.difficulty],
        strengths: Array.isArray(data.strengths) ? data.strengths : [],
        improvements: Array.isArray(data.improvements) ? data.improvements : [],
        summary: String(data.summary || thaiEvaluationFallback(state, acc).summary),
      };
    } catch (err) {
      console.warn('AI evaluation fallback:', err.message);
    }
  }

  return thaiEvaluationFallback(state, acc);
}

const sessions = new Map();
const meta = new Map();

function defaultState(id) {
  return {
    session_id: id,
    score: 0,
    hp: 100,
    speed: 8,
    streak: 0,
    questions_answered: 0,
    correct_count: 0,
    difficulty: 'beginner',
    current_question: null,
    last_explanation: '',
    last_correct: null,
    game_over: false,
    distance: 0,
  };
}

function pickTopic() {
  return TOPICS[Math.floor(Math.random() * TOPICS.length)];
}

function pickStyle() {
  return QUESTION_STYLES[Math.floor(Math.random() * QUESTION_STYLES.length)];
}

function shuffleQueue(n = 12) {
  const bank = [...QUESTION_BANK].sort(() => Math.random() - 0.5);
  return bank.slice(0, n).map((q) => ({ id: randomUUID().replace(/-/g, ''), ...q }));
}

function nextFromBank(asked) {
  let pool = QUESTION_BANK.filter((q) => !asked.has(q.question));
  if (!pool.length) {
    asked.clear();
    pool = [...QUESTION_BANK];
  }
  const q = pool[Math.floor(Math.random() * pool.length)];
  asked.add(q.question);
  return { id: randomUUID().replace(/-/g, ''), ...q };
}

function toPublic(state) {
  const q = state.current_question;
  return {
    ...state,
    speed: Math.round(state.speed * 100) / 100,
    distance: Math.round(state.distance * 10) / 10,
    current_question: q
      ? { id: q.id, question: q.question, options: q.options, difficulty: state.difficulty }
      : null,
  };
}

function adaptiveDifficulty(state) {
  const acc = state.correct_count / Math.max(state.questions_answered, 1);
  if (state.streak >= 5 && acc >= 0.8) return 'intermediate';
  if (state.streak >= 3 && acc >= 0.6) return 'elementary';
  return 'beginner';
}

function parseQuestionJson(raw) {
  const json = raw.match(/\{[\s\S]*\}/);
  const data = JSON.parse(json ? json[0] : raw);
  const options = (data.options || []).slice(0, 3).map(String);
  while (options.length < 3) options.push('—');
  return {
    id: randomUUID().replace(/-/g, ''),
    question: String(data.question || '').trim(),
    options,
    correct_index: Math.min(2, Math.max(0, Number(data.correct_index) || 0)),
    explanation: String(data.explanation || 'Good job!').trim(),
  };
}

async function generateQuestion(openai, model, difficulty, topic, style, avoid, asked) {
  if (openai) {
    try {
      const completion = await openai.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: QUESTION_PROMPT },
          {
            role: 'user',
            content: [
              `Difficulty: ${difficulty}`,
              `Topic: ${topic}`,
              `Style: ${style}`,
              avoid ? `Do NOT repeat these questions:\n${avoid}` : '',
              'Generate a completely NEW unique question.',
            ]
              .filter(Boolean)
              .join('\n'),
          },
        ],
        max_tokens: 400,
        temperature: 0.95,
      });
      const raw = completion.choices[0]?.message?.content?.trim() || '';
      const q = parseQuestionJson(raw);
      if (q.question && q.options.every(Boolean)) return q;
    } catch (err) {
      console.warn('AI question fallback:', err.message);
    }
  }
  return nextFromBank(asked);
}

function startPrefetch(openai, model, sessionId, count = 8) {
  if (!openai) return;
  const m = meta.get(sessionId);
  if (!m || m.prefetching) return;

  m.prefetching = true;
  (async () => {
    try {
      for (let i = 0; i < count; i += 1) {
        if (!sessions.has(sessionId)) break;
        const sessionMeta = meta.get(sessionId);
        if (!sessionMeta || sessionMeta.queue.length >= 15) break;

        const state = sessions.get(sessionId);
        const difficulty = state?.difficulty || 'beginner';
        const avoid = sessionMeta.recent.slice(-12).map((q) => `- ${q}`).join('\n');
        const q = await generateQuestion(
          openai,
          model,
          difficulty,
          pickTopic(),
          pickStyle(),
          avoid,
          sessionMeta.asked
        );

        if (!q?.question || sessionMeta.asked.has(q.question)) continue;
        sessionMeta.queue.push(q);
        sessionMeta.asked.add(q.question);
      }
    } finally {
      const sessionMeta = meta.get(sessionId);
      if (sessionMeta) sessionMeta.prefetching = false;
    }
  })();
}

function refillBankQueue(sessionId, min = 6) {
  const m = meta.get(sessionId);
  if (!m || m.queue.length >= min) return;
  for (const q of shuffleQueue(min - m.queue.length)) {
    if (!m.asked.has(q.question)) {
      m.queue.push(q);
      m.asked.add(q.question);
    }
  }
}

export function createRunnerRouter(openai, model) {
  const router = Router();
  const aiEnabled = Boolean(openai);

  router.post('/game/new', (req, res) => {
    const id = randomUUID().replace(/-/g, '');
    const state = defaultState(id);
    sessions.set(id, state);
    meta.set(id, { queue: [], asked: new Set(), recent: [], prefetching: false });

    if (aiEnabled) {
      startPrefetch(openai, model, id, 10);
    } else {
      refillBankQueue(id, 20);
    }

    res.json({ session_id: id, game_state: toPublic(state) });
  });

  router.post('/generate-question', async (req, res) => {
    const { session_id } = req.body || {};
    const state = sessions.get(session_id);
    if (!state) return res.status(404).json({ detail: 'Session not found' });
    if (state.game_over) return res.json({ session_id, game_state: toPublic(state) });

    const m = meta.get(session_id) || { queue: [], asked: new Set(), recent: [], prefetching: false };
    const avoid = m.recent.slice(-12).map((q) => `- ${q}`).join('\n');
    const topic = pickTopic();
    const style = pickStyle();

    if (aiEnabled) {
      if (m.queue.length) {
        state.current_question = m.queue.shift();
      } else {
        state.current_question = await generateQuestion(
          openai,
          model,
          state.difficulty,
          topic,
          style,
          avoid,
          m.asked
        );
      }
      if (m.queue.length < 6) startPrefetch(openai, model, session_id, 8);
    } else if (m.queue.length) {
      state.current_question = m.queue.shift();
      if (m.queue.length < 6) refillBankQueue(session_id, 12);
    } else {
      state.current_question = nextFromBank(m.asked);
    }

    if (state.current_question) {
      m.recent.push(state.current_question.question);
      m.asked.add(state.current_question.question);
    }
    meta.set(session_id, m);
    res.json({ session_id, game_state: toPublic(state) });
  });

  router.post('/check-answer', (req, res) => {
    const { session_id, question_id, selected_index } = req.body || {};
    const state = sessions.get(session_id);
    if (!state?.current_question) return res.status(400).json({ detail: 'No active question' });
    if (state.current_question.id !== question_id) {
      return res.json({ correct: false, animation: 'lose', game_state: toPublic(state) });
    }
    const q = state.current_question;
    const correct = selected_index === q.correct_index;
    state.questions_answered += 1;
    state.last_correct = correct;
    if (correct) {
      state.correct_count += 1;
      state.streak += 1;
      state.score += 100 + 25 * Math.min(state.streak - 1, 5);
      state.speed = Math.min(22, state.speed + 2);
      state.last_explanation = q.explanation;
      state.difficulty = adaptiveDifficulty(state);
    } else {
      state.streak = 0;
      state.hp = Math.max(0, state.hp - 15);
      state.speed = Math.max(3, state.speed - 3);
      state.last_explanation = `คำตอบที่ถูก: ${q.options[q.correct_index]}. ${q.explanation}`;
      if (state.hp <= 0) state.game_over = true;
    }
    state.current_question = null;
    res.json({ correct, animation: correct ? 'jump' : 'lose', game_state: toPublic(state) });
  });

  router.post('/evaluate-performance', async (req, res) => {
    const { session_id } = req.body || {};
    const state = sessions.get(session_id);
    if (!state) return res.status(404).json({ detail: 'Session not found' });
    const acc = state.questions_answered
      ? Math.round((state.correct_count / state.questions_answered) * 100)
      : 0;
    const evaluation = await evaluatePerformance(openai, model, state);
    res.json({
      session_id,
      stats: {
        score: state.score,
        questions_answered: state.questions_answered,
        correct_count: state.correct_count,
        accuracy: acc,
        streak: state.streak,
        difficulty: state.difficulty,
        distance: state.distance,
      },
      evaluation,
    });
  });

  router.get('/game-state/:session_id', (req, res) => {
    const state = sessions.get(req.params.session_id);
    if (!state) return res.status(404).json({ detail: 'Session not found' });
    res.json(toPublic(state));
  });

  router.post('/game/reset/:session_id', (req, res) => {
    const state = sessions.get(req.params.session_id);
    if (!state) return res.status(404).json({ detail: 'Session not found' });
    Object.assign(state, defaultState(state.session_id));
    meta.set(req.params.session_id, { queue: [], asked: new Set(), recent: [], prefetching: false });
    if (aiEnabled) {
      startPrefetch(openai, model, req.params.session_id, 10);
    } else {
      refillBankQueue(req.params.session_id, 20);
    }
    res.json(toPublic(state));
  });

  return router;
}

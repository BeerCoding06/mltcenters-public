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
console.log(`Runner: ${QUESTION_BANK.length} preschool questions loaded (bank only, no AI)`);

const EVALUATE_PROMPT_TH = `ประเมินผลการเล่นเกมวิ่งตอบคำถามภาษาอังกฤษของผู้เล่น
ตอบเป็นภาษาไทยทั้งหมด Return ONLY valid JSON (no markdown):
{"overall":0-100,"vocabulary":0-100,"grammar":0-100,"reaction":0-100,"level":"Beginner|Elementary|Intermediate","strengths":["..."],"improvements":["..."],"summary":"ย่อหน้าสรุปภาษาไทยที่ให้กำลังใจ 2-3 ประโยค"}

กฎ:
- strengths และ improvements อย่างละ 1-2 ข้อ เป็นภาษาไทย
- summary อธิบายผลงาน คะแนน และแนะนำอย่างเป็นมิตร`;

const LEVEL_TH = {
  preschool: 'เด็ก 1-10 ขวบ',
  beginner: 'เด็ก 1-10 ขวบ',
  elementary: 'พื้นฐาน',
  intermediate: 'ปานกลาง',
  Beginner: 'เด็ก 1-10 ขวบ',
  Preschool: 'เด็ก 1-10 ขวบ',
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
    difficulty: 'preschool',
    current_question: null,
    last_explanation: '',
    last_correct: null,
    game_over: false,
    distance: 0,
  };
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** สลับตำแหน่ง A/B/C ทุกครั้งที่ดึงคำถาม */
function shuffleOptions(question) {
  const correct = question.options[question.correct_index];
  const options = shuffleArray(question.options);
  return {
    ...question,
    options,
    correct_index: options.indexOf(correct),
  };
}

function buildRandomBatch(asked, count) {
  let pool = QUESTION_BANK.filter((q) => !asked.has(q.question));
  if (pool.length < count) {
    asked.clear();
    pool = [...QUESTION_BANK];
  }
  const picked = shuffleArray(pool).slice(0, Math.min(count, pool.length));
  return picked.map((q) => {
    asked.add(q.question);
    return shuffleOptions({ id: randomUUID().replace(/-/g, ''), ...q });
  });
}

function takeRandomFromQueue(queue) {
  if (!queue.length) return null;
  const idx = Math.floor(Math.random() * queue.length);
  return queue.splice(idx, 1)[0];
}

function nextFromBank(asked) {
  const [q] = buildRandomBatch(asked, 1);
  return q;
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
  return 'preschool';
}

function refillBankQueue(sessionId, min = 6) {
  const m = meta.get(sessionId);
  if (!m || m.queue.length >= min) return;
  const batch = buildRandomBatch(m.asked, min - m.queue.length);
  m.queue.push(...shuffleArray(batch));
}

export function createRunnerRouter(openai, model) {
  const router = Router();
  const aiEvaluateEnabled = Boolean(openai);

  router.post('/game/new', (req, res) => {
    const id = randomUUID().replace(/-/g, '');
    const state = defaultState(id);
    sessions.set(id, state);
    meta.set(id, { queue: [], asked: new Set(), recent: [], prefetching: false });
    refillBankQueue(id, 30);

    res.json({ session_id: id, game_state: toPublic(state) });
  });

  router.post('/generate-question', async (req, res) => {
    const { session_id } = req.body || {};
    const state = sessions.get(session_id);
    if (!state) return res.status(404).json({ detail: 'Session not found' });
    if (state.game_over) return res.json({ session_id, game_state: toPublic(state) });

    const m = meta.get(session_id) || { queue: [], asked: new Set(), recent: [], prefetching: false };

    if (m.queue.length) {
      state.current_question = takeRandomFromQueue(m.queue);
    } else {
      state.current_question = nextFromBank(m.asked);
    }
    if (m.queue.length < 20) refillBankQueue(session_id, 30);

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
    const correct =
      selected_index === -1 ? false : selected_index === q.correct_index;
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
    const evaluation = await evaluatePerformance(aiEvaluateEnabled ? openai : null, model, state);
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
    refillBankQueue(req.params.session_id, 30);
    res.json(toPublic(state));
  });

  return router;
}

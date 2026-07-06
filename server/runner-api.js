/**
 * 3D English Runner — in-process API (uses same OpenAI/Groq as /api/assess).
 * Mounted at /runner-api
 */
import { Router } from 'express';
import { randomUUID } from 'crypto';

const QUESTION_PROMPT = `Create one beginner English multiple-choice question.
Return ONLY JSON:
{"question":"...","options":["A","B","C"],"correct_index":0,"explanation":"..."}
Rules: exactly 3 options, correct_index 0-2, simple English.`;

const FALLBACK = [
  {
    question: 'What is the opposite of "hot"?',
    options: ['cold', 'warm', 'big'],
    correct_index: 0,
    explanation: '"Cold" is the opposite of "hot".',
  },
  {
    question: 'Which animal says "meow"?',
    options: ['dog', 'cat', 'cow'],
    correct_index: 1,
    explanation: 'Cats say "meow".',
  },
];

const sessions = new Map();

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

function toPublic(state) {
  const q = state.current_question;
  return {
    ...state,
    speed: Math.round(state.speed * 100) / 100,
    distance: Math.round(state.distance * 10) / 10,
    current_question: q
      ? {
          id: q.id,
          question: q.question,
          options: q.options,
          difficulty: state.difficulty,
        }
      : null,
  };
}

async function generateQuestion(openai, model, difficulty) {
  if (!openai) {
    const fb = FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
    return { id: randomUUID().replace(/-/g, ''), ...fb };
  }
  try {
    const completion = await openai.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: QUESTION_PROMPT },
        { role: 'user', content: `Difficulty: ${difficulty}` },
      ],
      max_tokens: 400,
      temperature: 0.8,
    });
    const raw = completion.choices[0]?.message?.content?.trim() || '';
    const json = raw.match(/\{[\s\S]*\}/);
    const data = JSON.parse(json ? json[0] : raw);
    return {
      id: randomUUID().replace(/-/g, ''),
      question: data.question,
      options: (data.options || []).slice(0, 3),
      correct_index: Math.min(2, Math.max(0, Number(data.correct_index) || 0)),
      explanation: data.explanation || 'Good job!',
    };
  } catch {
    const fb = FALLBACK[Math.floor(Math.random() * FALLBACK.length)];
    return { id: randomUUID().replace(/-/g, ''), ...fb };
  }
}

export function createRunnerRouter(openai, model) {
  const router = Router();

  router.post('/game/new', (_req, res) => {
    const id = randomUUID().replace(/-/g, '');
    const state = defaultState(id);
    sessions.set(id, state);
    res.json({ session_id: id, game_state: toPublic(state) });
  });

  router.post('/generate-question', async (req, res) => {
    const { session_id } = req.body || {};
    const state = sessions.get(session_id);
    if (!state) return res.status(404).json({ detail: 'Session not found' });
    if (state.game_over) return res.json({ session_id, game_state: toPublic(state) });
    state.current_question = await generateQuestion(openai, model, state.difficulty);
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
    } else {
      state.streak = 0;
      state.hp = Math.max(0, state.hp - 25);
      state.speed = Math.max(3, state.speed - 3);
      state.last_explanation = `Correct: ${q.options[q.correct_index]}. ${q.explanation}`;
      if (state.hp <= 0) state.game_over = true;
    }
    state.current_question = null;
    res.json({
      correct,
      animation: correct ? 'jump' : 'lose',
      game_state: toPublic(state),
    });
  });

  router.post('/evaluate-performance', (req, res) => {
    const { session_id } = req.body || {};
    const state = sessions.get(session_id);
    if (!state) return res.status(404).json({ detail: 'Session not found' });
    const acc = state.questions_answered
      ? Math.round((state.correct_count / state.questions_answered) * 100)
      : 0;
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
      evaluation: {
        overall: acc,
        vocabulary: Math.min(100, acc + 5),
        grammar: acc,
        reaction: Math.min(100, state.streak * 15),
        level: state.difficulty.charAt(0).toUpperCase() + state.difficulty.slice(1),
        strengths: ['You kept running and learning!'],
        improvements: ['Practice English vocabulary daily.'],
        summary: `Great race! You scored ${state.score} with ${acc}% accuracy.`,
      },
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
    res.json(toPublic(state));
  });

  return router;
}

import {
  computeMemoryScore,
  masteryFromScore,
  nextReviewAfterAnswer,
} from './memory.js';
import {
  buildSentencesPrompt,
  buildTemplateSentences,
  parseSentencesResponse,
} from './ai-sentences.js';

const DEFAULT_NEW_WORDS_PER_DAY = 15;
const MAX_REVIEW_IN_LEARN = 20;
const COACH_TIP_TH =
  'ทบทวนคำที่จำไม่แม่นวันละนิด จะช่วยให้ Memory Score ขึ้นเร็วขึ้น';

function newWordsPerDay() {
  const n = Number(process.env.VOCAB_NEW_WORDS_PER_DAY);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_NEW_WORDS_PER_DAY;
}

function utcDateKey(ms = Date.now()) {
  return new Date(ms).toISOString().slice(0, 10);
}

function yesterdayUtc(todayKey) {
  const d = new Date(`${todayKey}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function startOfUtcDayMs(ms = Date.now()) {
  const key = utcDateKey(ms);
  return Date.parse(`${key}T00:00:00.000Z`);
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalizeAnswer(s) {
  return String(s ?? '')
    .trim()
    .toLowerCase();
}

function gradeAnswer(word, quizType, userAnswer, expected) {
  const ans = normalizeAnswer(userAnswer);
  if (quizType === 'mcq') {
    const exp = normalizeAnswer(expected);
    if (exp && ans === exp) return true;
    return ans === normalizeAnswer(word.word) || ans === normalizeAnswer(word.meaning_th);
  }
  // type | fill
  return ans === normalizeAnswer(word.word);
}

const QUIZ_TYPES = ['mcq', 'type', 'fill'];

function buildTypeItem(word) {
  return {
    wordId: word.id,
    quizType: 'type',
    expected: word.word,
    promptMode: 'meaning_to_word',
    prompt: {
      word: word.word,
      ipa: word.ipa,
      meaning_th: word.meaning_th,
      example_en: word.example_en,
      example_th: word.example_th,
    },
  };
}

function buildFillItem(word) {
  const exampleEn = word.example_en || `This is ${word.word}.`;
  const re = new RegExp(`\\b${word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
  const blanked = exampleEn.replace(re, '______');
  return {
    wordId: word.id,
    quizType: 'fill',
    expected: word.word,
    promptMode: 'fill_blank',
    prompt: {
      word: word.word,
      ipa: word.ipa,
      meaning_th: word.meaning_th,
      example_en: blanked,
      example_th: word.example_th,
    },
  };
}

function buildSessionItem(word, levelWords, index) {
  const quizType = QUIZ_TYPES[index % QUIZ_TYPES.length];
  if (quizType === 'type') return buildTypeItem(word);
  if (quizType === 'fill') return buildFillItem(word);
  return buildMcqItem(word, levelWords);
}

function buildMcqItem(word, levelWords) {
  const promptMode = Math.random() < 0.5 ? 'word_to_meaning' : 'meaning_to_word';
  const others = levelWords.filter((w) => w.id !== word.id);
  const distractors = shuffle(others).slice(0, 3);

  if (promptMode === 'word_to_meaning') {
    const expected = word.meaning_th;
    const options = shuffle([expected, ...distractors.map((w) => w.meaning_th)]);
    return {
      wordId: word.id,
      quizType: 'mcq',
      expected,
      promptMode,
      prompt: {
        word: word.word,
        ipa: word.ipa,
        meaning_th: null,
        example_en: word.example_en,
        example_th: word.example_th,
      },
      options,
    };
  }

  const expected = word.word;
  const options = shuffle([expected, ...distractors.map((w) => w.word)]);
  return {
    wordId: word.id,
    quizType: 'mcq',
    expected,
    promptMode,
    prompt: {
      word: word.word,
      ipa: word.ipa,
      meaning_th: word.meaning_th,
      example_en: word.example_en,
      example_th: word.example_th,
    },
    options,
  };
}

function applyStreak(profile) {
  const today = utcDateKey();
  const last = profile.last_active_date;
  let streakDays = profile.streak_days || 0;

  if (last === today) {
    return { streak_days: streakDays, last_active_date: today };
  }
  if (last && last === yesterdayUtc(today)) {
    streakDays += 1;
  } else if (!last) {
    streakDays = 0;
  } else {
    streakDays = 0;
  }
  return { streak_days: streakDays, last_active_date: today };
}

function mapSentenceWordIds(parsedSentences, knownWords) {
  const byWord = new Map(knownWords.map((w) => [w.word.toLowerCase(), w.id]));
  return parsedSentences.slice(0, 5).map((s) => {
    const wordIds = [];
    for (const word of s.words || []) {
      const id = byWord.get(String(word).toLowerCase());
      if (id) wordIds.push(id);
    }
    if (wordIds.length === 0) {
      for (const w of knownWords) {
        if (s.en.toLowerCase().includes(w.word.toLowerCase())) {
          wordIds.push(w.id);
        }
      }
    }
    return {
      en: s.en,
      th: s.th,
      wordIds: [...new Set(wordIds)],
    };
  });
}

export function createVocabService({ model, openai = null, modelName = 'gpt-4o-mini' }) {
  async function ensureProfile(visitorId, { goal, levelId } = {}) {
    let profile = await model.getProfileByVisitorId(visitorId);
    if (!profile) {
      profile = await model.createProfile({
        visitorId,
        goal: goal || 'general',
        levelId: levelId || 'starter',
      });
      return profile;
    }
    const patch = {};
    if (goal) patch.goal = goal;
    if (levelId) patch.current_level_id = levelId;
    if (Object.keys(patch).length) {
      profile = await model.updateProfile(profile.id, patch);
    }
    return profile;
  }

  async function pickLearnWords(profile, limit) {
    const levelId = profile.current_level_id || 'starter';
    const words = await model.listWordsByLevel(levelId);
    const stats = await model.listWordStats(profile.id);
    const byWord = new Map(stats.map((s) => [s.wordId, s]));
    const fresh = words.filter((w) => {
      const st = byWord.get(w.id);
      return !st || st.status === 'new';
    });
    return fresh.slice(0, limit);
  }

  async function loadKnownWords(profile) {
    const stats = await model.listWordStats(profile.id);
    const known = [];
    for (const s of stats) {
      if (
        (s.memoryScore ?? 0) >= 40 ||
        ['learning', 'reviewing', 'mastered'].includes(s.status)
      ) {
        const w = await model.getWord(s.wordId);
        if (w) known.push(w);
      }
    }
    if (known.length === 0) {
      const levelId = profile.current_level_id || 'starter';
      return (await model.listWordsByLevel(levelId)).slice(0, 20);
    }
    return known;
  }

  async function pickDueWords(profile, limit) {
    const due = await model.listDueReviews(profile.id, Date.now(), limit);
    const words = [];
    for (const row of due) {
      const w = await model.getWord(row.word_id);
      if (w) words.push(w);
    }
    // Also include stats with nextReviewAt due but missing schedule row
    if (words.length < limit) {
      const stats = await model.listWordStats(profile.id);
      const have = new Set(words.map((w) => w.id));
      const now = Date.now();
      const extra = stats
        .filter(
          (s) =>
            !have.has(s.wordId) &&
            s.nextReviewAt != null &&
            s.nextReviewAt <= now &&
            s.status !== 'new'
        )
        .slice(0, limit - words.length);
      for (const s of extra) {
        const w = await model.getWord(s.wordId);
        if (w) words.push(w);
      }
    }
    return words.slice(0, limit);
  }

  async function getDashboard(profileId) {
    const profile = await model.getProfileById(profileId);
    if (!profile) throw new Error('Profile not found');

    const stats = await model.listWordStats(profileId);
    const wordsLearned = stats.filter((s) =>
      ['learning', 'reviewing', 'mastered'].includes(s.status)
    ).length;

    const since7d = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = await model.listQuizResults(profileId, since7d);
    const correct = recent.filter((r) => r.is_correct).length;
    const accuracy7d = recent.length ? Math.round((correct / recent.length) * 100) : 0;

    const withWords = [];
    for (const s of stats) {
      const w = await model.getWord(s.wordId);
      if (!w) continue;
      withWords.push({
        id: w.id,
        word: w.word,
        meaning_th: w.meaning_th,
        memoryScore: s.memoryScore ?? 0,
      });
    }
    const sorted = [...withWords].sort((a, b) => a.memoryScore - b.memoryScore);
    const weakWords = sorted.slice(0, 5);
    const strongWords = [...sorted].reverse().slice(0, 5);

    const quota = newWordsPerDay();
    const dayStart = startOfUtcDayMs();
    const usedNewToday = await model.countNewWordsLearnedSince(profileId, dayStart);
    const freshAvailable = (await pickLearnWords(profile, 10_000)).length;
    const learnRemaining = Math.max(0, Math.min(quota - usedNewToday, freshAvailable));

    const reviewDue = (await model.listDueReviews(profileId, Date.now(), 50)).length;
    const knownWords = await loadKnownWords(profile);
    const sentencesReady = knownWords.length > 0;

    return {
      profileId: profile.id,
      goal: profile.goal,
      levelId: profile.current_level_id,
      xp: profile.xp || 0,
      streakDays: profile.streak_days || 0,
      wordsLearned,
      accuracy7d,
      weakWords,
      strongWords,
      today: {
        learnRemaining,
        reviewDue,
        sentencesReady,
      },
      coachTip: COACH_TIP_TH,
    };
  }

  async function startSession(profileId, mode) {
    const profile = await model.getProfileById(profileId);
    if (!profile) throw new Error('Profile not found');

    const levelId = profile.current_level_id || 'starter';
    const levelWords = await model.listWordsByLevel(levelId);
    const quota = newWordsPerDay();

    let selected = [];
    if (mode === 'learn' || mode === 'quiz') {
      const dayStart = startOfUtcDayMs();
      const usedToday = await model.countNewWordsLearnedSince(profileId, dayStart);
      const remainingQuota = Math.max(0, quota - usedToday);
      const learnWords = await pickLearnWords(profile, remainingQuota);
      const dueWords = await pickDueWords(profile, MAX_REVIEW_IN_LEARN);
      const dueIds = new Set(dueWords.map((w) => w.id));
      selected = [...learnWords.filter((w) => !dueIds.has(w.id)), ...dueWords];
      if (selected.length === 0 && remainingQuota > 0) {
        selected = levelWords.slice(0, Math.min(remainingQuota, levelWords.length));
      }
    } else if (mode === 'review') {
      selected = await pickDueWords(profile, 50);
      if (selected.length === 0) {
        const stats = await model.listWordStats(profileId);
        for (const s of stats.slice(0, 10)) {
          const w = await model.getWord(s.wordId);
          if (w) selected.push(w);
        }
      }
    } else {
      selected = (await pickLearnWords(profile, quota)).slice(0, quota);
    }

    const items = selected.map((w, i) => buildSessionItem(w, levelWords, i));
    const session = await model.createSession({ profileId, mode, items });
    return { sessionId: session.id, items };
  }

  async function submitAnswer(profileId, sessionId, payload) {
    const profile = await model.getProfileById(profileId);
    if (!profile) throw new Error('Profile not found');
    const session = await model.getSession(sessionId);
    if (!session || session.profile_id !== profileId) throw new Error('Session not found');

    const { wordId, quizType, userAnswer, responseMs, confidence } = payload;
    const word = await model.getWord(wordId);
    if (!word) throw new Error('Word not found');

    const item = (session.items || []).find((i) => i.wordId === wordId);
    const expected = item?.expected;
    const isCorrect = gradeAnswer(word, quizType, userAnswer, expected);
    const xpDelta = isCorrect ? 10 : 2;

    const prev = (await model.getWordStat(profileId, wordId)) || {
      intervalDays: 0.5,
      easeFactor: 2.3,
      forgetCount: 0,
      correctCount: 0,
      wrongCount: 0,
      seenCount: 0,
      avgResponseMs: responseMs,
      avgConfidence: confidence,
    };

    const correctCount = prev.correctCount + (isCorrect ? 1 : 0);
    const wrongCount = prev.wrongCount + (isCorrect ? 0 : 1);
    const seenCount = (prev.seenCount || 0) + 1;
    const avgResponseMs = Math.round(((prev.avgResponseMs || responseMs) + responseMs) / 2);
    const avgConfidence = isCorrect
      ? ((prev.avgConfidence || confidence) + confidence) / 2
      : prev.avgConfidence || 3;

    const srs = nextReviewAfterAnswer(
      {
        intervalDays: prev.intervalDays,
        easeFactor: prev.easeFactor,
        forgetCount: prev.forgetCount,
      },
      isCorrect,
      Date.now()
    );

    const memoryScore = computeMemoryScore({
      correctCount,
      wrongCount,
      avgResponseMs,
      medianResponseMs: 2500,
      hoursSinceLastReview: 0,
      scheduledIntervalDays: srs.intervalDays,
      forgetCount: srs.forgetCount,
      avgConfidenceWhenCorrect: isCorrect
        ? ((prev.avgConfidence || confidence) + confidence) / 2
        : prev.avgConfidence || 3,
      reviewDaysLast7: 1,
    });
    const masteryLevel = masteryFromScore(memoryScore);
    const status = masteryLevel >= 5 ? 'mastered' : isCorrect ? 'learning' : 'reviewing';

    await model.upsertWordStat({
      profileId,
      wordId,
      seenCount,
      correctCount,
      wrongCount,
      forgetCount: srs.forgetCount,
      memoryScore,
      masteryLevel,
      status,
      learningStage: masteryLevel >= 4 ? 'fluent' : masteryLevel >= 2 ? 'recall' : 'practice',
      intervalDays: srs.intervalDays,
      easeFactor: srs.easeFactor,
      lastReviewAt: Date.now(),
      nextReviewAt: srs.nextReviewAt,
      avgResponseMs,
      avgConfidence,
    });

    await model.upsertReviewSchedule({
      profileId,
      wordId,
      nextReviewAt: srs.nextReviewAt,
      priority: isCorrect ? 0 : 1,
    });

    await model.createQuizResult({
      sessionId,
      profileId,
      wordId,
      quizType,
      isCorrect,
      responseMs,
      confidence,
      userAnswer,
    });

    const streakPatch = applyStreak(profile);
    await model.updateProfile(profileId, {
      xp: (profile.xp || 0) + xpDelta,
      ...streakPatch,
    });

    await model.updateSession(sessionId, {
      correct_count: (session.correct_count || 0) + (isCorrect ? 1 : 0),
      xp_earned: (session.xp_earned || 0) + xpDelta,
    });

    return {
      memoryScore,
      nextReviewAt: srs.nextReviewAt,
      xpDelta,
      masteryLevel,
      isCorrect,
    };
  }

  async function completeSession(profileId, sessionId) {
    const session = await model.getSession(sessionId);
    if (!session || session.profile_id !== profileId) throw new Error('Session not found');
    return model.updateSession(sessionId, { ended_at: Date.now() });
  }

  async function getReviewQueue(profileId) {
    const profile = await model.getProfileById(profileId);
    if (!profile) throw new Error('Profile not found');
    const due = await pickDueWords(profile, 50);
    return due.map((w) => ({
      id: w.id,
      word: w.word,
      meaning_th: w.meaning_th,
      ipa: w.ipa,
    }));
  }

  async function getRecommendToday(profileId) {
    const profile = await model.getProfileById(profileId);
    if (!profile) throw new Error('Profile not found');
    const quota = newWordsPerDay();
    const dayStart = startOfUtcDayMs();
    const usedNewToday = await model.countNewWordsLearnedSince(profileId, dayStart);
    const remainingQuota = Math.max(0, quota - usedNewToday);
    const learn = await pickLearnWords(profile, remainingQuota);
    const review = await pickDueWords(profile, MAX_REVIEW_IN_LEARN);
    return {
      learn: learn.map((w) => ({ id: w.id, word: w.word, meaning_th: w.meaning_th })),
      review: review.map((w) => ({ id: w.id, word: w.word, meaning_th: w.meaning_th })),
      newWordsPerDay: quota,
    };
  }

  async function listLevels() {
    return model.listLevels();
  }

  async function getWordDetail(profileId, wordId) {
    const word = await model.getWord(wordId);
    if (!word) throw new Error('Word not found');
    const stat = await model.getWordStat(profileId, wordId);
    return { ...word, stat: stat || null };
  }

  async function getOrCreateDailySentences(profileId) {
    const profile = await model.getProfileById(profileId);
    if (!profile) throw new Error('Profile not found');

    const dateKey = utcDateKey();
    const cached = await model.getGeneratedSentences(profileId, dateKey);
    if (cached?.sentences?.length) {
      return { sentences: cached.sentences, cached: true };
    }

    const knownWords = await loadKnownWords(profile);
    if (knownWords.length === 0) {
      throw new Error('No known words available for sentences');
    }

    let sentences;
    if (!openai) {
      sentences = buildTemplateSentences(knownWords);
    } else {
      const completion = await openai.chat.completions.create({
        model: modelName,
        messages: buildSentencesPrompt(knownWords),
        max_tokens: 800,
        temperature: 0.7,
      });
      const text = completion.choices[0]?.message?.content?.trim() || '';
      const parsed = parseSentencesResponse(text);
      sentences = mapSentenceWordIds(parsed, knownWords);
    }

    await model.upsertGeneratedSentences({ profileId, dateKey, sentences });
    return { sentences, cached: false };
  }

  return {
    ensureProfile,
    getDashboard,
    startSession,
    submitAnswer,
    completeSession,
    getReviewQueue,
    getRecommendToday,
    listLevels,
    getWordDetail,
    getOrCreateDailySentences,
  };
}

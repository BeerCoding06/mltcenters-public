/**
 * Dual-mode vocab CRUD (file JSON store or Postgres).
 */

function nowMs() {
  return Date.now();
}

function parseTags(row) {
  if (!row) return [];
  if (row.tags_json != null && row.tags_json !== '') {
    try {
      const parsed = typeof row.tags_json === 'string' ? JSON.parse(row.tags_json) : row.tags_json;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  if (Array.isArray(row.tags)) return row.tags;
  return [];
}

function normalizeWord(row) {
  if (!row) return null;
  const tags = parseTags(row);
  return {
    ...row,
    tags,
    tags_json: row.tags_json != null ? row.tags_json : JSON.stringify(tags),
  };
}

function statFromRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    profileId: row.profile_id,
    wordId: row.word_id,
    seenCount: row.seen_count ?? 0,
    correctCount: row.correct_count ?? 0,
    wrongCount: row.wrong_count ?? 0,
    forgetCount: row.forget_count ?? 0,
    memoryScore: row.memory_score ?? 0,
    masteryLevel: row.mastery_level ?? 0,
    status: row.status || 'new',
    learningStage: row.learning_stage || 'introduce',
    intervalDays: row.interval_days ?? 0.5,
    easeFactor: row.ease_factor ?? 2.3,
    lastReviewAt: row.last_review_at ?? null,
    nextReviewAt: row.next_review_at ?? null,
    avgResponseMs: row.avg_response_ms ?? 0,
    avgConfidence: row.avg_confidence ?? 3,
  };
}

function statToRow(stat) {
  return {
    id: stat.id,
    profile_id: stat.profileId,
    word_id: stat.wordId,
    seen_count: stat.seenCount ?? 0,
    correct_count: stat.correctCount ?? 0,
    wrong_count: stat.wrongCount ?? 0,
    forget_count: stat.forgetCount ?? 0,
    memory_score: stat.memoryScore ?? 0,
    mastery_level: stat.masteryLevel ?? 0,
    status: stat.status || 'new',
    learning_stage: stat.learningStage || 'introduce',
    interval_days: stat.intervalDays ?? 0.5,
    ease_factor: stat.easeFactor ?? 2.3,
    last_review_at: stat.lastReviewAt ?? null,
    next_review_at: stat.nextReviewAt ?? null,
    avg_response_ms: stat.avgResponseMs ?? 0,
    avg_confidence: stat.avgConfidence ?? 3,
  };
}

function createFileModel(fileStore) {
  const data = () => fileStore.getCollections();

  const touch = () => {
    if (typeof fileStore.touch === 'function') {
      fileStore.touch();
      return;
    }
    const levels = data().levels;
    if (levels[0]) fileStore.upsertLevel({ ...levels[0] });
  };

  const nextId = (prefix) => {
    const d = data();
    const n = d.seq++;
    return `${prefix}_${n}`;
  };

  return {
    mode: 'file',

    async upsertLevel(row) {
      fileStore.upsertLevel(row);
    },

    async upsertWord(row) {
      const tags_json =
        row.tags_json != null
          ? typeof row.tags_json === 'string'
            ? row.tags_json
            : JSON.stringify(row.tags_json)
          : JSON.stringify(row.tags || []);
      fileStore.upsertWord({ ...row, tags_json });
    },

    async getProfileByVisitorId(visitorId) {
      return data().profiles.find((p) => p.visitor_id === visitorId) || null;
    },

    async getProfileById(id) {
      return data().profiles.find((p) => p.id === id) || null;
    },

    async createProfile({ visitorId, goal, levelId }) {
      const profile = {
        id: nextId('prof'),
        visitor_id: visitorId,
        goal: goal || 'general',
        current_level_id: levelId || 'starter',
        xp: 0,
        streak_days: 0,
        last_active_date: null,
        created_at: new Date().toISOString(),
      };
      data().profiles.push(profile);
      touch();
      return profile;
    },

    async updateProfile(id, patch) {
      const d = data();
      const idx = d.profiles.findIndex((p) => p.id === id);
      if (idx < 0) return null;
      d.profiles[idx] = { ...d.profiles[idx], ...patch };
      touch();
      return d.profiles[idx];
    },

    async listLevels() {
      return [...data().levels].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    },

    async getWord(id) {
      return normalizeWord(data().words.find((w) => w.id === id) || null);
    },

    async listWordsByLevel(levelId) {
      return data()
        .words.filter((w) => w.level_id === levelId && (w.status || 'active') === 'active')
        .map(normalizeWord);
    },

    async getWordStat(profileId, wordId) {
      const row = data().word_stats.find(
        (s) => s.profile_id === profileId && s.word_id === wordId
      );
      return statFromRow(row);
    },

    async listWordStats(profileId) {
      return data()
        .word_stats.filter((s) => s.profile_id === profileId)
        .map(statFromRow);
    },

    async upsertWordStat(stat) {
      const d = data();
      const row = statToRow({
        ...stat,
        id: stat.id || nextId('wstat'),
      });
      const idx = d.word_stats.findIndex(
        (s) => s.profile_id === row.profile_id && s.word_id === row.word_id
      );
      if (idx >= 0) {
        d.word_stats[idx] = { ...d.word_stats[idx], ...row, id: d.word_stats[idx].id };
        touch();
        return statFromRow(d.word_stats[idx]);
      }
      d.word_stats.push(row);
      touch();
      return statFromRow(row);
    },

    async createSession({ profileId, mode, items = [] }) {
      const session = {
        id: nextId('sess'),
        profile_id: profileId,
        mode,
        started_at: nowMs(),
        ended_at: null,
        words_count: items.length,
        correct_count: 0,
        xp_earned: 0,
        items_json: JSON.stringify(items),
      };
      data().sessions.push(session);
      touch();
      return {
        ...session,
        items,
      };
    },

    async getSession(sessionId) {
      const row = data().sessions.find((s) => s.id === sessionId);
      if (!row) return null;
      let items = [];
      try {
        items = row.items_json ? JSON.parse(row.items_json) : [];
      } catch {
        items = [];
      }
      return { ...row, items };
    },

    async updateSession(sessionId, patch) {
      const d = data();
      const idx = d.sessions.findIndex((s) => s.id === sessionId);
      if (idx < 0) return null;
      const next = { ...d.sessions[idx], ...patch };
      if (patch.items) {
        next.items_json = JSON.stringify(patch.items);
        delete next.items;
      }
      d.sessions[idx] = next;
      touch();
      let items = [];
      try {
        items = next.items_json ? JSON.parse(next.items_json) : [];
      } catch {
        items = [];
      }
      return { ...next, items };
    },

    async createQuizResult(result) {
      const row = {
        id: result.id || nextId('quiz'),
        session_id: result.sessionId,
        profile_id: result.profileId,
        word_id: result.wordId,
        quiz_type: result.quizType,
        is_correct: !!result.isCorrect,
        response_ms: result.responseMs ?? 0,
        confidence: result.confidence ?? 3,
        user_answer: result.userAnswer ?? '',
        created_at: result.createdAt ?? nowMs(),
      };
      data().quiz_results.push(row);
      touch();
      return row;
    },

    async listQuizResults(profileId, sinceMs = 0) {
      return data().quiz_results.filter(
        (r) => r.profile_id === profileId && (r.created_at || 0) >= sinceMs
      );
    },

    async upsertReviewSchedule({ profileId, wordId, nextReviewAt, priority = 0 }) {
      const d = data();
      const idx = d.review_schedule.findIndex(
        (r) => r.profile_id === profileId && r.word_id === wordId
      );
      if (idx >= 0) {
        d.review_schedule[idx] = {
          ...d.review_schedule[idx],
          next_review_at: nextReviewAt,
          priority,
        };
        touch();
        return d.review_schedule[idx];
      }
      const row = {
        id: nextId('rev'),
        profile_id: profileId,
        word_id: wordId,
        next_review_at: nextReviewAt,
        priority,
      };
      d.review_schedule.push(row);
      touch();
      return row;
    },

    async listDueReviews(profileId, atMs = nowMs(), limit = 50) {
      return data()
        .review_schedule.filter(
          (r) => r.profile_id === profileId && (r.next_review_at || 0) <= atMs
        )
        .sort((a, b) => (a.next_review_at || 0) - (b.next_review_at || 0))
        .slice(0, limit);
    },

    async countNewWordsLearnedSince(profileId, sinceMs) {
      return data().quiz_results.filter(
        (r) =>
          r.profile_id === profileId &&
          (r.created_at || 0) >= sinceMs &&
          r.is_correct
      ).length;
    },
  };
}

function createPgModel(pool) {
  const nextId = (prefix) =>
    `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  return {
    mode: 'postgres',

    async upsertLevel(row) {
      await pool.query(
        `INSERT INTO vocab_levels (id, code, name_th, name_en, target_word_count, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           code = EXCLUDED.code,
           name_th = EXCLUDED.name_th,
           name_en = EXCLUDED.name_en,
           target_word_count = EXCLUDED.target_word_count,
           sort_order = EXCLUDED.sort_order`,
        [row.id, row.code, row.name_th, row.name_en, row.target_word_count, row.sort_order]
      );
    },

    async upsertWord(row) {
      const tags_json =
        row.tags_json != null
          ? typeof row.tags_json === 'string'
            ? row.tags_json
            : JSON.stringify(row.tags_json)
          : JSON.stringify(row.tags || []);
      await pool.query(
        `INSERT INTO vocab_words (
           id, level_id, word, ipa, pos, meaning_th, difficulty, frequency,
           category, example_en, example_th, tags_json, status
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
         ON CONFLICT (id) DO UPDATE SET
           level_id = EXCLUDED.level_id,
           word = EXCLUDED.word,
           ipa = EXCLUDED.ipa,
           pos = EXCLUDED.pos,
           meaning_th = EXCLUDED.meaning_th,
           difficulty = EXCLUDED.difficulty,
           frequency = EXCLUDED.frequency,
           category = EXCLUDED.category,
           example_en = EXCLUDED.example_en,
           example_th = EXCLUDED.example_th,
           tags_json = EXCLUDED.tags_json,
           status = EXCLUDED.status`,
        [
          row.id,
          row.level_id,
          row.word,
          row.ipa,
          row.pos,
          row.meaning_th,
          row.difficulty,
          row.frequency,
          row.category,
          row.example_en,
          row.example_th,
          tags_json,
          row.status || 'active',
        ]
      );
    },

    async getProfileByVisitorId(visitorId) {
      const r = await pool.query(`SELECT * FROM vocab_profiles WHERE visitor_id = $1`, [
        visitorId,
      ]);
      return r.rows[0] || null;
    },

    async getProfileById(id) {
      const r = await pool.query(`SELECT * FROM vocab_profiles WHERE id = $1`, [id]);
      return r.rows[0] || null;
    },

    async createProfile({ visitorId, goal, levelId }) {
      const profile = {
        id: nextId('prof'),
        visitor_id: visitorId,
        goal: goal || 'general',
        current_level_id: levelId || 'starter',
        xp: 0,
        streak_days: 0,
        last_active_date: null,
        created_at: new Date().toISOString(),
      };
      await pool.query(
        `INSERT INTO vocab_profiles
           (id, visitor_id, goal, current_level_id, xp, streak_days, last_active_date, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          profile.id,
          profile.visitor_id,
          profile.goal,
          profile.current_level_id,
          profile.xp,
          profile.streak_days,
          profile.last_active_date,
          profile.created_at,
        ]
      );
      return profile;
    },

    async updateProfile(id, patch) {
      const cur = await this.getProfileById(id);
      if (!cur) return null;
      const next = { ...cur, ...patch };
      await pool.query(
        `UPDATE vocab_profiles SET
           goal = $2, current_level_id = $3, xp = $4, streak_days = $5, last_active_date = $6
         WHERE id = $1`,
        [
          id,
          next.goal,
          next.current_level_id,
          next.xp,
          next.streak_days,
          next.last_active_date,
        ]
      );
      return next;
    },

    async listLevels() {
      const r = await pool.query(`SELECT * FROM vocab_levels ORDER BY sort_order ASC`);
      return r.rows;
    },

    async getWord(id) {
      const r = await pool.query(`SELECT * FROM vocab_words WHERE id = $1`, [id]);
      return normalizeWord(r.rows[0] || null);
    },

    async listWordsByLevel(levelId) {
      const r = await pool.query(
        `SELECT * FROM vocab_words WHERE level_id = $1 AND COALESCE(status, 'active') = 'active'`,
        [levelId]
      );
      return r.rows.map(normalizeWord);
    },

    async getWordStat(profileId, wordId) {
      const r = await pool.query(
        `SELECT * FROM vocab_word_stats WHERE profile_id = $1 AND word_id = $2`,
        [profileId, wordId]
      );
      return statFromRow(r.rows[0] || null);
    },

    async listWordStats(profileId) {
      const r = await pool.query(`SELECT * FROM vocab_word_stats WHERE profile_id = $1`, [
        profileId,
      ]);
      return r.rows.map(statFromRow);
    },

    async upsertWordStat(stat) {
      const existing = await this.getWordStat(stat.profileId, stat.wordId);
      const id = existing?.id || stat.id || nextId('wstat');
      const row = statToRow({ ...stat, id });
      await pool.query(
        `INSERT INTO vocab_word_stats (
           id, profile_id, word_id, seen_count, correct_count, wrong_count,
           forget_count, memory_score, mastery_level, status, learning_stage,
           interval_days, ease_factor, last_review_at, next_review_at,
           avg_response_ms, avg_confidence
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         ON CONFLICT (profile_id, word_id) DO UPDATE SET
           seen_count = EXCLUDED.seen_count,
           correct_count = EXCLUDED.correct_count,
           wrong_count = EXCLUDED.wrong_count,
           forget_count = EXCLUDED.forget_count,
           memory_score = EXCLUDED.memory_score,
           mastery_level = EXCLUDED.mastery_level,
           status = EXCLUDED.status,
           learning_stage = EXCLUDED.learning_stage,
           interval_days = EXCLUDED.interval_days,
           ease_factor = EXCLUDED.ease_factor,
           last_review_at = EXCLUDED.last_review_at,
           next_review_at = EXCLUDED.next_review_at,
           avg_response_ms = EXCLUDED.avg_response_ms,
           avg_confidence = EXCLUDED.avg_confidence`,
        [
          row.id,
          row.profile_id,
          row.word_id,
          row.seen_count,
          row.correct_count,
          row.wrong_count,
          row.forget_count,
          row.memory_score,
          row.mastery_level,
          row.status,
          row.learning_stage,
          row.interval_days,
          row.ease_factor,
          row.last_review_at,
          row.next_review_at,
          row.avg_response_ms,
          row.avg_confidence,
        ]
      );
      return this.getWordStat(stat.profileId, stat.wordId);
    },

    async createSession({ profileId, mode, items = [] }) {
      const session = {
        id: nextId('sess'),
        profile_id: profileId,
        mode,
        started_at: nowMs(),
        ended_at: null,
        words_count: items.length,
        correct_count: 0,
        xp_earned: 0,
        items_json: JSON.stringify(items),
      };
      await pool.query(
        `INSERT INTO vocab_sessions
           (id, profile_id, mode, started_at, ended_at, words_count, correct_count, xp_earned)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [
          session.id,
          session.profile_id,
          session.mode,
          session.started_at,
          session.ended_at,
          session.words_count,
          session.correct_count,
          session.xp_earned,
        ]
      );
      // items kept in-process via items_json column if present; also return items
      try {
        await pool.query(`UPDATE vocab_sessions SET items_json = $2 WHERE id = $1`, [
          session.id,
          session.items_json,
        ]);
      } catch {
        /* column optional until migrate extended */
      }
      return { ...session, items };
    },

    async getSession(sessionId) {
      const r = await pool.query(`SELECT * FROM vocab_sessions WHERE id = $1`, [sessionId]);
      const row = r.rows[0];
      if (!row) return null;
      let items = [];
      try {
        items = row.items_json ? JSON.parse(row.items_json) : [];
      } catch {
        items = [];
      }
      return { ...row, items };
    },

    async updateSession(sessionId, patch) {
      const cur = await this.getSession(sessionId);
      if (!cur) return null;
      const next = {
        ended_at: patch.ended_at !== undefined ? patch.ended_at : cur.ended_at,
        words_count: patch.words_count !== undefined ? patch.words_count : cur.words_count,
        correct_count:
          patch.correct_count !== undefined ? patch.correct_count : cur.correct_count,
        xp_earned: patch.xp_earned !== undefined ? patch.xp_earned : cur.xp_earned,
      };
      await pool.query(
        `UPDATE vocab_sessions SET
           ended_at = $2, words_count = $3, correct_count = $4, xp_earned = $5
         WHERE id = $1`,
        [sessionId, next.ended_at, next.words_count, next.correct_count, next.xp_earned]
      );
      if (patch.items) {
        try {
          await pool.query(`UPDATE vocab_sessions SET items_json = $2 WHERE id = $1`, [
            sessionId,
            JSON.stringify(patch.items),
          ]);
        } catch {
          /* optional */
        }
      }
      return this.getSession(sessionId);
    },

    async createQuizResult(result) {
      const row = {
        id: result.id || nextId('quiz'),
        session_id: result.sessionId,
        profile_id: result.profileId,
        word_id: result.wordId,
        quiz_type: result.quizType,
        is_correct: !!result.isCorrect,
        response_ms: result.responseMs ?? 0,
        confidence: result.confidence ?? 3,
        user_answer: result.userAnswer ?? '',
        created_at: result.createdAt ?? nowMs(),
      };
      await pool.query(
        `INSERT INTO vocab_quiz_results
           (id, session_id, profile_id, word_id, quiz_type, is_correct,
            response_ms, confidence, user_answer, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          row.id,
          row.session_id,
          row.profile_id,
          row.word_id,
          row.quiz_type,
          row.is_correct,
          row.response_ms,
          row.confidence,
          row.user_answer,
          row.created_at,
        ]
      );
      return row;
    },

    async listQuizResults(profileId, sinceMs = 0) {
      const r = await pool.query(
        `SELECT * FROM vocab_quiz_results
         WHERE profile_id = $1 AND created_at >= $2`,
        [profileId, sinceMs]
      );
      return r.rows;
    },

    async upsertReviewSchedule({ profileId, wordId, nextReviewAt, priority = 0 }) {
      const existing = await pool.query(
        `SELECT * FROM vocab_review_schedule WHERE profile_id = $1 AND word_id = $2`,
        [profileId, wordId]
      );
      if (existing.rows[0]) {
        await pool.query(
          `UPDATE vocab_review_schedule SET next_review_at = $3, priority = $4
           WHERE profile_id = $1 AND word_id = $2`,
          [profileId, wordId, nextReviewAt, priority]
        );
        return { ...existing.rows[0], next_review_at: nextReviewAt, priority };
      }
      const row = {
        id: nextId('rev'),
        profile_id: profileId,
        word_id: wordId,
        next_review_at: nextReviewAt,
        priority,
      };
      await pool.query(
        `INSERT INTO vocab_review_schedule (id, profile_id, word_id, next_review_at, priority)
         VALUES ($1,$2,$3,$4,$5)`,
        [row.id, row.profile_id, row.word_id, row.next_review_at, row.priority]
      );
      return row;
    },

    async listDueReviews(profileId, atMs = nowMs(), limit = 50) {
      const r = await pool.query(
        `SELECT * FROM vocab_review_schedule
         WHERE profile_id = $1 AND next_review_at <= $2
         ORDER BY next_review_at ASC
         LIMIT $3`,
        [profileId, atMs, limit]
      );
      return r.rows;
    },

    async countNewWordsLearnedSince(profileId, sinceMs) {
      const r = await pool.query(
        `SELECT COUNT(DISTINCT word_id)::int AS count FROM vocab_quiz_results
         WHERE profile_id = $1 AND created_at >= $2 AND is_correct = true`,
        [profileId, sinceMs]
      );
      return r.rows[0]?.count ?? 0;
    },
  };
}

export function createVocabModel({ mode, fileStore, pgPool }) {
  if (mode === 'file') {
    if (!fileStore) throw new Error('createVocabModel: fileStore required for file mode');
    return createFileModel(fileStore);
  }
  if (mode === 'postgres') {
    if (!pgPool) throw new Error('createVocabModel: pgPool required for postgres mode');
    return createPgModel(pgPool);
  }
  throw new Error(`Unsupported vocab model mode: ${mode}`);
}

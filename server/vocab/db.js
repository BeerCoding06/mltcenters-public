import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createVocabFileStore } from './file-store.js';
import { loadStarterSeed } from './seed-loader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mode = 'none';
/** @type {import('pg').Pool | null} */
let pgPool = null;
/** @type {ReturnType<typeof createVocabFileStore> | null} */
let fileStore = null;

function isPostgresUrl(url) {
  return typeof url === 'string' && /^postgres(ql)?:\/\//i.test(url);
}

export function getVocabDbMode() {
  return mode;
}

export function getVocabFileStore() {
  return fileStore;
}

export function getVocabPgPool() {
  return pgPool;
}

function createFileSeedAdapter(store) {
  return {
    async upsertLevel(row) {
      store.upsertLevel(row);
    },
    async upsertWord(row) {
      store.upsertWord(row);
    },
  };
}

function createPgSeedAdapter(pool) {
  return {
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
          row.tags_json,
          row.status,
        ]
      );
    },
  };
}

async function countStarterWords() {
  if (mode === 'file' && fileStore) {
    return fileStore.countWordsByLevel('starter');
  }
  if (mode === 'postgres' && pgPool) {
    const result = await pgPool.query(
      `SELECT COUNT(*)::int AS count FROM vocab_words WHERE level_id = $1`,
      ['starter']
    );
    return result.rows[0]?.count ?? 0;
  }
  return 0;
}

async function maybeSeedStarter() {
  const count = await countStarterWords();
  if (count > 0) return;
  const adapter =
    mode === 'postgres' && pgPool
      ? createPgSeedAdapter(pgPool)
      : createFileSeedAdapter(fileStore);
  const result = await loadStarterSeed(adapter);
  console.info(`[vocab] seeded starter level: ${result.count} words`);
}

export async function initVocabDb() {
  const databaseUrl = process.env.DATABASE_URL || '';

  if (isPostgresUrl(databaseUrl)) {
    const { default: pg } = await import('pg');
    pgPool = new pg.Pool({ connectionString: databaseUrl, max: 5 });
    mode = 'postgres';
    await migratePostgres();
    await maybeSeedStarter();
    console.info('[vocab] database: postgres');
    return { mode };
  }

  const filePath =
    process.env.VOCAB_FILE_PATH || path.join(__dirname, '../data/vocab.json');

  fileStore = createVocabFileStore(filePath);
  mode = 'file';
  await maybeSeedStarter();
  console.info(`[vocab] database: file (${filePath})`);
  return { mode, filePath };
}

async function migratePostgres() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS vocab_levels (
      id TEXT PRIMARY KEY, code TEXT UNIQUE, name_th TEXT, name_en TEXT,
      target_word_count INT, sort_order INT
    )`,
    `CREATE TABLE IF NOT EXISTS vocab_words (
      id TEXT PRIMARY KEY, level_id TEXT, word TEXT, ipa TEXT, pos TEXT,
      meaning_th TEXT, difficulty INT, frequency INT, category TEXT,
      example_en TEXT, example_th TEXT, tags_json TEXT, status TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS vocab_profiles (
      id TEXT PRIMARY KEY, visitor_id TEXT UNIQUE, goal TEXT, current_level_id TEXT,
      xp INT DEFAULT 0, streak_days INT DEFAULT 0, last_active_date TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS vocab_word_stats (
      id TEXT PRIMARY KEY, profile_id TEXT, word_id TEXT,
      seen_count INT, correct_count INT, wrong_count INT,
      forget_count INT, memory_score INT, mastery_level INT,
      status TEXT, learning_stage TEXT,
      interval_days REAL, ease_factor REAL,
      last_review_at BIGINT, next_review_at BIGINT,
      avg_response_ms INT, avg_confidence REAL,
      UNIQUE(profile_id, word_id)
    )`,
    `CREATE TABLE IF NOT EXISTS vocab_sessions (
      id TEXT PRIMARY KEY, profile_id TEXT, mode TEXT,
      started_at BIGINT, ended_at BIGINT, words_count INT,
      correct_count INT, xp_earned INT
    )`,
    `CREATE TABLE IF NOT EXISTS vocab_quiz_results (
      id TEXT PRIMARY KEY, session_id TEXT, profile_id TEXT, word_id TEXT,
      quiz_type TEXT, is_correct BOOLEAN, response_ms INT,
      confidence INT, user_answer TEXT, created_at BIGINT
    )`,
    `CREATE TABLE IF NOT EXISTS vocab_generated_sentences (
      id TEXT PRIMARY KEY, profile_id TEXT, date_key TEXT,
      content_json TEXT, created_at BIGINT,
      UNIQUE(profile_id, date_key)
    )`,
    `CREATE TABLE IF NOT EXISTS vocab_review_schedule (
      id TEXT PRIMARY KEY, profile_id TEXT, word_id TEXT,
      next_review_at BIGINT, priority INT
    )`,
  ];

  for (const sql of statements) {
    await pgPool.query(sql);
  }
}

export async function closeVocabDb() {
  if (fileStore) {
    fileStore.close();
    fileStore = null;
  }
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
  }
  mode = 'none';
}

try {
  fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
} catch {
  /* ignore */
}

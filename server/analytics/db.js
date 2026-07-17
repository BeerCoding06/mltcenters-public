import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createFileStore } from './file-store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mode = 'none';
/** @type {import('pg').Pool | null} */
let pgPool = null;
/** @type {ReturnType<typeof createFileStore> | null} */
let fileStore = null;

function isPostgresUrl(url) {
  return typeof url === 'string' && /^postgres(ql)?:\/\//i.test(url);
}

export function getAnalyticsDbMode() {
  return mode;
}

export function getFileStore() {
  return fileStore;
}

export function getPgPool() {
  return pgPool;
}

export async function initAnalyticsDb() {
  const databaseUrl = process.env.DATABASE_URL || '';

  if (isPostgresUrl(databaseUrl)) {
    const { default: pg } = await import('pg');
    pgPool = new pg.Pool({ connectionString: databaseUrl, max: 5 });
    mode = 'postgres';
    await migratePostgres();
    console.info('[analytics] database: postgres');
    return { mode };
  }

  const filePath =
    process.env.ANALYTICS_SQLITE_PATH ||
    process.env.ANALYTICS_FILE_PATH ||
    path.join(__dirname, '../data/analytics.json');
  // migrate old sqlite path name → json beside it
  if (filePath.endsWith('.sqlite')) {
    const jsonPath = filePath.replace(/\.sqlite$/, '.json');
    fileStore = createFileStore(jsonPath);
    mode = 'file';
    console.info(`[analytics] database: file (${jsonPath})`);
    return { mode, filePath: jsonPath };
  }

  fileStore = createFileStore(filePath);
  mode = 'file';
  console.info(`[analytics] database: file (${filePath})`);
  return { mode, filePath };
}

async function migratePostgres() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS analytics_events (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      ts BIGINT NOT NULL,
      path TEXT,
      referrer TEXT,
      session_id TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      ip_hash TEXT,
      country_code TEXT DEFAULT 'XX',
      user_agent TEXT,
      device_type TEXT,
      browser TEXT,
      metadata_json TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS page_views (
      id BIGSERIAL PRIMARY KEY,
      visitor_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      path TEXT NOT NULL,
      started_at BIGINT NOT NULL,
      duration_ms INTEGER DEFAULT 0,
      scroll_depth INTEGER DEFAULT 0,
      referrer TEXT,
      country_code TEXT DEFAULT 'XX',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS chat_sessions (
      id BIGSERIAL PRIMARY KEY,
      session_id TEXT NOT NULL,
      visitor_id TEXT NOT NULL,
      started_at BIGINT NOT NULL,
      message_count INTEGER DEFAULT 0,
      last_event_at BIGINT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS assessment_results (
      id BIGSERIAL PRIMARY KEY,
      visitor_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      status TEXT NOT NULL,
      level TEXT,
      score_avg DOUBLE PRECISION,
      metadata_json TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE TABLE IF NOT EXISTS runner_results (
      id BIGSERIAL PRIMARY KEY,
      visitor_id TEXT NOT NULL,
      session_id TEXT NOT NULL,
      status TEXT NOT NULL,
      score DOUBLE PRECISION,
      duration_ms INTEGER,
      metadata_json TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )`,
    `CREATE INDEX IF NOT EXISTS idx_events_ts ON analytics_events(ts)`,
    `CREATE INDEX IF NOT EXISTS idx_events_name_ts ON analytics_events(name, ts)`,
    `CREATE INDEX IF NOT EXISTS idx_events_visitor_ts ON analytics_events(visitor_id, ts)`,
    `CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path, started_at)`,
    `CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id)`,
  ];

  for (const sql of statements) {
    await pgPool.query(sql);
  }
}

/**
 * Postgres helper — converts ? placeholders to $1,$2,...
 * @param {string} sql
 * @param {unknown[]} [params]
 */
export async function query(sql, params = []) {
  if (mode !== 'postgres' || !pgPool) {
    throw new Error('query() is only available in postgres mode');
  }
  let i = 0;
  const text = sql.replace(/\?/g, () => `$${++i}`);
  const result = await pgPool.query(text, params);
  return { rows: result.rows, rowCount: result.rowCount };
}

export async function closeAnalyticsDb() {
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

// Ensure data dir exists for file mode default path
try {
  fs.mkdirSync(path.join(__dirname, '../data'), { recursive: true });
} catch {
  /* ignore */
}

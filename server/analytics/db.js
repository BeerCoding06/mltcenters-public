import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mode = 'none';
/** @type {import('better-sqlite3').Database | null} */
let sqlite = null;
/** @type {import('pg').Pool | null} */
let pgPool = null;

function isPostgresUrl(url) {
  return typeof url === 'string' && /^postgres(ql)?:\/\//i.test(url);
}

export function getAnalyticsDbMode() {
  return mode;
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

  const { default: Database } = await import('better-sqlite3');
  const sqlitePath =
    process.env.ANALYTICS_SQLITE_PATH ||
    path.join(__dirname, '../data/analytics.sqlite');
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
  sqlite = new Database(sqlitePath);
  sqlite.pragma('journal_mode = WAL');
  mode = 'sqlite';
  migrateSqlite();
  console.info(`[analytics] database: sqlite (${sqlitePath})`);
  return { mode, sqlitePath };
}

function migrateSqlite() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  sqlite.exec(sql);
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
 * @param {string} sql
 * @param {unknown[]} [params]
 */
export async function query(sql, params = []) {
  if (mode === 'postgres') {
    let i = 0;
    const text = sql.replace(/\?/g, () => `$${++i}`);
    const result = await pgPool.query(text, params);
    return { rows: result.rows, rowCount: result.rowCount };
  }

  if (mode === 'sqlite') {
    const trimmed = sql.trim().toLowerCase();
    if (trimmed.startsWith('select') || trimmed.startsWith('with')) {
      const rows = sqlite.prepare(sql).all(...params);
      return { rows, rowCount: rows.length };
    }
    const info = sqlite.prepare(sql).run(...params);
    return { rows: [], rowCount: info.changes, lastInsertRowid: info.lastInsertRowid };
  }

  throw new Error('Analytics database not initialized');
}

export async function closeAnalyticsDb() {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
  }
  if (pgPool) {
    await pgPool.end();
    pgPool = null;
  }
  mode = 'none';
}

-- Analytics schema (SQLite-compatible; Postgres uses same names with adapted types in db.js)

CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  ts INTEGER NOT NULL,
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
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS page_views (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  path TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  duration_ms INTEGER DEFAULT 0,
  scroll_depth INTEGER DEFAULT 0,
  referrer TEXT,
  country_code TEXT DEFAULT 'XX',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS chat_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  visitor_id TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  message_count INTEGER DEFAULT 0,
  last_event_at INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS assessment_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  status TEXT NOT NULL,
  level TEXT,
  score_avg REAL,
  metadata_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS runner_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visitor_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  status TEXT NOT NULL,
  score REAL,
  duration_ms INTEGER,
  metadata_json TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_ts ON analytics_events(ts);
CREATE INDEX IF NOT EXISTS idx_events_name_ts ON analytics_events(name, ts);
CREATE INDEX IF NOT EXISTS idx_events_visitor_ts ON analytics_events(visitor_id, ts);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path, started_at);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);

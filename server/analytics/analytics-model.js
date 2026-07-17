import { getAnalyticsDbMode, getFileStore, query } from './db.js';

export async function insertEvent(row) {
  if (getAnalyticsDbMode() === 'file') {
    getFileStore().insertEvent(row);
    return;
  }
  await query(
    `INSERT INTO analytics_events
      (name, ts, path, referrer, session_id, visitor_id, ip_hash, country_code, user_agent, device_type, browser, metadata_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.name,
      row.ts,
      row.path || null,
      row.referrer || null,
      row.session_id,
      row.visitor_id,
      row.ip_hash || null,
      row.country_code || 'XX',
      row.user_agent || null,
      row.device_type || null,
      row.browser || null,
      row.metadata_json || null,
    ]
  );
}

export async function insertPageView(row) {
  if (getAnalyticsDbMode() === 'file') {
    getFileStore().insertPageView(row);
    return;
  }
  await query(
    `INSERT INTO page_views
      (visitor_id, session_id, path, started_at, duration_ms, scroll_depth, referrer, country_code)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      row.visitor_id,
      row.session_id,
      row.path,
      row.started_at,
      row.duration_ms || 0,
      row.scroll_depth || 0,
      row.referrer || null,
      row.country_code || 'XX',
    ]
  );
}

export async function upsertChatSession(row) {
  if (getAnalyticsDbMode() === 'file') {
    getFileStore().upsertChatSession(row);
    return;
  }
  const existing = await query(
    `SELECT id, message_count FROM chat_sessions WHERE session_id = ? AND visitor_id = ? ORDER BY id DESC LIMIT 1`,
    [row.session_id, row.visitor_id]
  );

  if (existing.rows[0]) {
    const nextCount = Number(existing.rows[0].message_count || 0) + (row.inc_messages || 0);
    await query(
      `UPDATE chat_sessions SET message_count = ?, last_event_at = ?, status = ? WHERE id = ?`,
      [nextCount, row.last_event_at, row.status || 'active', existing.rows[0].id]
    );
    return;
  }

  await query(
    `INSERT INTO chat_sessions (session_id, visitor_id, started_at, message_count, last_event_at, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      row.session_id,
      row.visitor_id,
      row.started_at,
      row.inc_messages || 0,
      row.last_event_at,
      row.status || 'active',
    ]
  );
}

export async function upsertAssessment(row) {
  if (getAnalyticsDbMode() === 'file') {
    getFileStore().upsertAssessment(row);
    return;
  }
  const existing = await query(
    `SELECT id FROM assessment_results WHERE session_id = ? AND visitor_id = ? ORDER BY id DESC LIMIT 1`,
    [row.session_id, row.visitor_id]
  );

  if (existing.rows[0] && row.status !== 'started') {
    await query(
      `UPDATE assessment_results SET status = ?, level = ?, score_avg = ?, metadata_json = ?, updated_at = ? WHERE id = ?`,
      [
        row.status,
        row.level || null,
        row.score_avg ?? null,
        row.metadata_json || null,
        new Date().toISOString(),
        existing.rows[0].id,
      ]
    );
    return;
  }

  if (!existing.rows[0]) {
    await query(
      `INSERT INTO assessment_results (visitor_id, session_id, status, level, score_avg, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        row.visitor_id,
        row.session_id,
        row.status,
        row.level || null,
        row.score_avg ?? null,
        row.metadata_json || null,
      ]
    );
  }
}

export async function upsertRunner(row) {
  if (getAnalyticsDbMode() === 'file') {
    getFileStore().upsertRunner(row);
    return;
  }
  const existing = await query(
    `SELECT id FROM runner_results WHERE session_id = ? AND visitor_id = ? ORDER BY id DESC LIMIT 1`,
    [row.session_id, row.visitor_id]
  );

  if (existing.rows[0] && row.status !== 'started') {
    await query(
      `UPDATE runner_results SET status = ?, score = ?, duration_ms = ?, metadata_json = ?, updated_at = ? WHERE id = ?`,
      [
        row.status,
        row.score ?? null,
        row.duration_ms ?? null,
        row.metadata_json || null,
        new Date().toISOString(),
        existing.rows[0].id,
      ]
    );
    return;
  }

  if (!existing.rows[0]) {
    await query(
      `INSERT INTO runner_results (visitor_id, session_id, status, score, duration_ms, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        row.visitor_id,
        row.session_id,
        row.status,
        row.score ?? null,
        row.duration_ms ?? null,
        row.metadata_json || null,
      ]
    );
  }
}

function dayStartMs(daysAgo = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.getTime();
}

export async function getSummary() {
  if (getAnalyticsDbMode() === 'file') {
    return getFileStore().getSummary();
  }

  const today = dayStartMs(0);
  const week = dayStartMs(6);
  const month = dayStartMs(29);
  const now = Date.now();
  const activeCutoff = now - 5 * 60 * 1000;

  const visitorsToday = await query(
    `SELECT COUNT(DISTINCT visitor_id) AS c FROM analytics_events WHERE ts >= ?`,
    [today]
  );
  const visitorsWeek = await query(
    `SELECT COUNT(DISTINCT visitor_id) AS c FROM analytics_events WHERE ts >= ?`,
    [week]
  );
  const visitorsMonth = await query(
    `SELECT COUNT(DISTINCT visitor_id) AS c FROM analytics_events WHERE ts >= ?`,
    [month]
  );
  const activeUsers = await query(
    `SELECT COUNT(DISTINCT visitor_id) AS c FROM analytics_events WHERE ts >= ?`,
    [activeCutoff]
  );
  const sessions = await query(
    `SELECT COUNT(DISTINCT session_id) AS c FROM analytics_events WHERE ts >= ?`,
    [month]
  );

  const visitorSessionCounts = await query(
    `SELECT visitor_id, COUNT(DISTINCT session_id) AS sc
     FROM analytics_events WHERE ts >= ?
     GROUP BY visitor_id`,
    [month]
  );
  const returningUsers = visitorSessionCounts.rows.filter((r) => Number(r.sc) > 1).length;

  const durations = await query(
    `SELECT AVG(duration_ms) AS avg_ms FROM page_views WHERE started_at >= ? AND duration_ms > 0`,
    [month]
  );

  const sessionPageCounts = await query(
    `SELECT session_id, COUNT(*) AS pc FROM page_views WHERE started_at >= ? GROUP BY session_id`,
    [month]
  );
  const totalSessions = sessionPageCounts.rows.length || 0;
  const bounced = sessionPageCounts.rows.filter((r) => Number(r.pc) <= 1).length;
  const bounceRate = totalSessions ? bounced / totalSessions : 0;

  const topPages = await query(
    `SELECT path, COUNT(*) AS views FROM page_views WHERE started_at >= ? GROUP BY path ORDER BY views DESC LIMIT 10`,
    [month]
  );
  const topBrowsers = await query(
    `SELECT browser, COUNT(*) AS c FROM analytics_events WHERE ts >= ? AND browser IS NOT NULL GROUP BY browser ORDER BY c DESC LIMIT 10`,
    [month]
  );
  const topCountries = await query(
    `SELECT country_code, COUNT(DISTINCT visitor_id) AS c FROM analytics_events WHERE ts >= ? GROUP BY country_code ORDER BY c DESC LIMIT 10`,
    [month]
  );
  const topDevices = await query(
    `SELECT device_type, COUNT(*) AS c FROM analytics_events WHERE ts >= ? AND device_type IS NOT NULL GROUP BY device_type ORDER BY c DESC LIMIT 10`,
    [month]
  );

  const assessmentStats = await query(
    `SELECT status, COUNT(*) AS c FROM assessment_results GROUP BY status`
  );
  const chatStats = await query(
    `SELECT COUNT(*) AS sessions, COALESCE(SUM(message_count), 0) AS messages FROM chat_sessions`
  );
  const runnerStats = await query(
    `SELECT status, COUNT(*) AS c FROM runner_results GROUP BY status`
  );

  const dailyVisitors = await query(
    `SELECT FLOOR(ts / 86400000) AS day_bucket, COUNT(DISTINCT visitor_id) AS c
     FROM analytics_events WHERE ts >= ?
     GROUP BY day_bucket ORDER BY day_bucket ASC`,
    [week]
  );

  const num = (row) => Number(row?.c ?? row?.avg_ms ?? 0);

  return {
    visitorsToday: num(visitorsToday.rows[0]),
    visitorsWeek: num(visitorsWeek.rows[0]),
    visitorsMonth: num(visitorsMonth.rows[0]),
    activeUsers: num(activeUsers.rows[0]),
    returningUsers,
    sessions: num(sessions.rows[0]),
    avgSessionDurationMs: Math.round(Number(durations.rows[0]?.avg_ms || 0)),
    bounceRate: Math.round(bounceRate * 1000) / 1000,
    topPages: topPages.rows.map((r) => ({ path: r.path, views: Number(r.views) })),
    topBrowsers: topBrowsers.rows.map((r) => ({ browser: r.browser, count: Number(r.c) })),
    topCountries: topCountries.rows.map((r) => ({ country: r.country_code, count: Number(r.c) })),
    topDevices: topDevices.rows.map((r) => ({ device: r.device_type, count: Number(r.c) })),
    assessment: Object.fromEntries(assessmentStats.rows.map((r) => [r.status, Number(r.c)])),
    chat: {
      sessions: Number(chatStats.rows[0]?.sessions || 0),
      messages: Number(chatStats.rows[0]?.messages || 0),
    },
    runner: Object.fromEntries(runnerStats.rows.map((r) => [r.status, Number(r.c)])),
    dailyVisitors: dailyVisitors.rows.map((r) => ({
      day: Number(r.day_bucket),
      visitors: Number(r.c),
    })),
  };
}

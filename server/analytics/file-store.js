/**
 * Pure-JS analytics store (no native modules).
 * Used when DATABASE_URL is not set — safe for Alpine / Dokploy builds.
 */
import fs from 'fs';
import path from 'path';

function emptyDb() {
  return {
    analytics_events: [],
    page_views: [],
    chat_sessions: [],
    assessment_results: [],
    runner_results: [],
    seq: 1,
  };
}

export function createFileStore(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  let data = emptyDb();
  if (fs.existsSync(filePath)) {
    try {
      data = { ...emptyDb(), ...JSON.parse(fs.readFileSync(filePath, 'utf8')) };
    } catch {
      data = emptyDb();
    }
  }

  let writeTimer = null;
  const persist = () => {
    const tmp = `${filePath}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(data));
    fs.renameSync(tmp, filePath);
  };
  const schedulePersist = () => {
    if (writeTimer) return;
    writeTimer = setTimeout(() => {
      writeTimer = null;
      try {
        persist();
      } catch (err) {
        console.error('[analytics] file persist error:', err);
      }
    }, 250);
  };

  const nextId = () => {
    const id = data.seq++;
    schedulePersist();
    return id;
  };

  return {
    mode: 'file',
    path: filePath,
    insertEvent(row) {
      data.analytics_events.push({ id: nextId(), created_at: new Date().toISOString(), ...row });
      schedulePersist();
    },
    insertPageView(row) {
      data.page_views.push({ id: nextId(), created_at: new Date().toISOString(), ...row });
      schedulePersist();
    },
    upsertChatSession(row) {
      const existing = [...data.chat_sessions]
        .reverse()
        .find((r) => r.session_id === row.session_id && r.visitor_id === row.visitor_id);
      if (existing) {
        existing.message_count = Number(existing.message_count || 0) + (row.inc_messages || 0);
        existing.last_event_at = row.last_event_at;
        existing.status = row.status || 'active';
      } else {
        data.chat_sessions.push({
          id: nextId(),
          session_id: row.session_id,
          visitor_id: row.visitor_id,
          started_at: row.started_at,
          message_count: row.inc_messages || 0,
          last_event_at: row.last_event_at,
          status: row.status || 'active',
          created_at: new Date().toISOString(),
        });
      }
      schedulePersist();
    },
    upsertAssessment(row) {
      const existing = [...data.assessment_results]
        .reverse()
        .find((r) => r.session_id === row.session_id && r.visitor_id === row.visitor_id);
      if (existing && row.status !== 'started') {
        existing.status = row.status;
        existing.level = row.level ?? existing.level;
        existing.score_avg = row.score_avg ?? existing.score_avg;
        existing.metadata_json = row.metadata_json ?? existing.metadata_json;
        existing.updated_at = new Date().toISOString();
      } else if (!existing) {
        data.assessment_results.push({
          id: nextId(),
          visitor_id: row.visitor_id,
          session_id: row.session_id,
          status: row.status,
          level: row.level || null,
          score_avg: row.score_avg ?? null,
          metadata_json: row.metadata_json || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      schedulePersist();
    },
    upsertRunner(row) {
      const existing = [...data.runner_results]
        .reverse()
        .find((r) => r.session_id === row.session_id && r.visitor_id === row.visitor_id);
      if (existing && row.status !== 'started') {
        existing.status = row.status;
        existing.score = row.score ?? existing.score;
        existing.duration_ms = row.duration_ms ?? existing.duration_ms;
        existing.metadata_json = row.metadata_json ?? existing.metadata_json;
        existing.updated_at = new Date().toISOString();
      } else if (!existing) {
        data.runner_results.push({
          id: nextId(),
          visitor_id: row.visitor_id,
          session_id: row.session_id,
          status: row.status,
          score: row.score ?? null,
          duration_ms: row.duration_ms ?? null,
          metadata_json: row.metadata_json || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
      schedulePersist();
    },
    getSummary() {
      const dayStartMs = (daysAgo = 0) => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        d.setDate(d.getDate() - daysAgo);
        return d.getTime();
      };
      const today = dayStartMs(0);
      const week = dayStartMs(6);
      const month = dayStartMs(29);
      const now = Date.now();
      const activeCutoff = now - 5 * 60 * 1000;

      const events = data.analytics_events;
      const pages = data.page_views;
      const distinct = (arr, key, since) =>
        new Set(arr.filter((r) => r.ts >= since || r.started_at >= since).map((r) => r[key])).size;

      const eventsSince = (since) => events.filter((e) => e.ts >= since);
      const pagesSince = (since) => pages.filter((p) => p.started_at >= since);

      const visitorsToday = distinct(events, 'visitor_id', today);
      const visitorsWeek = distinct(events, 'visitor_id', week);
      const visitorsMonth = distinct(events, 'visitor_id', month);
      const activeUsers = distinct(events, 'visitor_id', activeCutoff);
      const sessions = new Set(eventsSince(month).map((e) => e.session_id)).size;

      const byVisitor = new Map();
      for (const e of eventsSince(month)) {
        const set = byVisitor.get(e.visitor_id) || new Set();
        set.add(e.session_id);
        byVisitor.set(e.visitor_id, set);
      }
      let returningUsers = 0;
      for (const set of byVisitor.values()) if (set.size > 1) returningUsers += 1;

      const durationRows = pagesSince(month).filter((p) => p.duration_ms > 0);
      const avgSessionDurationMs = durationRows.length
        ? Math.round(durationRows.reduce((a, p) => a + Number(p.duration_ms || 0), 0) / durationRows.length)
        : 0;

      const sessionPages = new Map();
      for (const p of pagesSince(month)) {
        sessionPages.set(p.session_id, (sessionPages.get(p.session_id) || 0) + 1);
      }
      const totalSessions = sessionPages.size || 0;
      let bounced = 0;
      for (const count of sessionPages.values()) if (count <= 1) bounced += 1;
      const bounceRate = totalSessions ? Math.round((bounced / totalSessions) * 1000) / 1000 : 0;

      const countBy = (rows, key) => {
        const map = new Map();
        for (const r of rows) {
          const k = r[key] || 'unknown';
          map.set(k, (map.get(k) || 0) + 1);
        }
        return [...map.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([k, v]) => [k, v]);
      };

      const topPages = countBy(pagesSince(month), 'path').map(([pathName, views]) => ({
        path: pathName,
        views,
      }));
      const topBrowsers = countBy(eventsSince(month).filter((e) => e.browser), 'browser').map(
        ([browser, count]) => ({ browser, count })
      );
      const countryMap = new Map();
      for (const e of eventsSince(month)) {
        const set = countryMap.get(e.country_code || 'XX') || new Set();
        set.add(e.visitor_id);
        countryMap.set(e.country_code || 'XX', set);
      }
      const topCountries = [...countryMap.entries()]
        .map(([country, set]) => ({ country, count: set.size }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
      const topDevices = countBy(eventsSince(month).filter((e) => e.device_type), 'device_type').map(
        ([device, count]) => ({ device, count })
      );

      const assessment = {};
      for (const r of data.assessment_results) {
        assessment[r.status] = (assessment[r.status] || 0) + 1;
      }
      const runner = {};
      for (const r of data.runner_results) {
        runner[r.status] = (runner[r.status] || 0) + 1;
      }
      const chat = {
        sessions: data.chat_sessions.length,
        messages: data.chat_sessions.reduce((a, r) => a + Number(r.message_count || 0), 0),
      };

      const dayBuckets = new Map();
      for (const e of eventsSince(week)) {
        const bucket = Math.floor(e.ts / 86400000);
        const set = dayBuckets.get(bucket) || new Set();
        set.add(e.visitor_id);
        dayBuckets.set(bucket, set);
      }
      const dailyVisitors = [...dayBuckets.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([day, set]) => ({ day, visitors: set.size }));

      return {
        visitorsToday,
        visitorsWeek,
        visitorsMonth,
        activeUsers,
        returningUsers,
        sessions,
        avgSessionDurationMs,
        bounceRate,
        topPages,
        topBrowsers,
        topCountries,
        topDevices,
        assessment,
        chat,
        runner,
        dailyVisitors,
      };
    },
    close() {
      if (writeTimer) {
        clearTimeout(writeTimer);
        writeTimer = null;
      }
      persist();
    },
  };
}

// @vitest-environment node

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { initAnalyticsDb, closeAnalyticsDb, getFileStore } from './db.js';
import { createAnalyticsRouter } from './analytics-router.js';

describe('analytics router integration', () => {
  let app;
  let server;
  let baseUrl;
  const tmpDb = path.join(os.tmpdir(), `mlt-analytics-test-${Date.now()}.json`);

  beforeAll(async () => {
    process.env.ANALYTICS_ENABLED = 'true';
    process.env.ANALYTICS_ADMIN_TOKEN = 'test-admin-token';
    process.env.ANALYTICS_IP_SALT = 'test-salt';
    process.env.ANALYTICS_FILE_PATH = tmpDb;
    delete process.env.DATABASE_URL;
    delete process.env.ANALYTICS_SQLITE_PATH;

    await initAnalyticsDb();
    app = express();
    app.use(express.json());
    app.use('/api/analytics', createAnalyticsRouter());
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', resolve);
    });
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
    await closeAnalyticsDb();
    try {
      fs.unlinkSync(tmpDb);
    } catch {
      /* ignore */
    }
  });

  it('accepts events and stores rows', async () => {
    const res = await fetch(`${baseUrl}/api/analytics/event`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        events: [
          {
            name: 'page_view',
            sessionId: 'sess-1',
            visitorId: 'vis-1',
            ts: Date.now(),
            path: '/about',
          },
        ],
      }),
    });
    expect(res.status).toBe(202);

    // Force persist
    getFileStore().close();
    const raw = JSON.parse(fs.readFileSync(tmpDb, 'utf8'));
    expect(raw.analytics_events.some((r) => r.name === 'page_view' && r.path === '/about')).toBe(
      true
    );
  });

  it('rejects summary without admin token', async () => {
    const res = await fetch(`${baseUrl}/api/analytics/summary`);
    expect(res.status).toBe(401);
  });

  it('returns summary with admin token', async () => {
    // Re-init file store after close in previous test
    await closeAnalyticsDb();
    process.env.ANALYTICS_FILE_PATH = tmpDb;
    await initAnalyticsDb();

    const res = await fetch(`${baseUrl}/api/analytics/summary`, {
      headers: { Authorization: 'Bearer test-admin-token' },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.summary.visitorsMonth).toBeGreaterThanOrEqual(1);
  });
});

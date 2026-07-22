// @vitest-environment node

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createVocabFileStore } from './file-store.js';
import { createVocabModel } from './model.js';
import { createVocabService } from './service.js';
import { createVocabRouter } from './router.js';
import { loadStarterSeed } from './seed-loader.js';

async function fetchApp(app, method, urlPath, options = {}) {
  const server = await new Promise((resolve, reject) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
    s.on('error', reject);
  });
  try {
    const { port } = server.address();
    const url = `http://127.0.0.1:${port}${urlPath}`;
    return await fetch(url, { method, ...options });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function withApp() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocab-r-'));
  const store = createVocabFileStore(path.join(dir, 'v.json'));
  const model = createVocabModel({ mode: 'file', fileStore: store });
  await loadStarterSeed(model);
  const service = createVocabService({ model, openai: null });
  const app = express();
  app.use(express.json());
  app.use('/api/vocab', createVocabRouter({ service }));
  return { app, dir };
}

describe('vocab router', () => {
  let app;
  let dir;

  beforeEach(async () => {
    ({ app, dir } = await withApp());
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('rejects missing visitor header', async () => {
    const res = await fetchApp(app, 'GET', '/api/vocab/dashboard');
    expect(res.status).toBe(400);
  });

  it('returns dashboard for visitor', async () => {
    await fetchApp(app, 'POST', '/api/vocab/profile', {
      headers: { 'X-Visitor-Id': 'v1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: 'toeic', levelId: 'starter' }),
    });
    const res = await fetchApp(app, 'GET', '/api/vocab/dashboard', {
      headers: { 'X-Visitor-Id': 'v1' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.levelId).toBe('starter');
    expect(body.today.sentencesReady).toBe(true);
  });

  it('generates template sentences and caches on repeat', async () => {
    await fetchApp(app, 'POST', '/api/vocab/profile', {
      headers: { 'X-Visitor-Id': 'v2', 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: 'general', levelId: 'starter' }),
    });
    const first = await fetchApp(app, 'POST', '/api/vocab/ai/sentences', {
      headers: { 'X-Visitor-Id': 'v2' },
    });
    expect(first.status).toBe(200);
    const body1 = await first.json();
    expect(body1.cached).toBe(false);
    expect(body1.sentences).toHaveLength(5);
    expect(body1.sentences[0].en).toMatch(/I can use the word/);

    const second = await fetchApp(app, 'POST', '/api/vocab/ai/sentences', {
      headers: { 'X-Visitor-Id': 'v2' },
    });
    expect(second.status).toBe(200);
    const body2 = await second.json();
    expect(body2.cached).toBe(true);
    expect(body2.sentences).toEqual(body1.sentences);
  });
});

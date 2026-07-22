// server/vocab/service.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createVocabFileStore } from './file-store.js';
import { createVocabModel } from './model.js';
import { createVocabService } from './service.js';
import { loadStarterSeed } from './seed-loader.js';

let dir;
let service;

beforeEach(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocab-'));
  const store = createVocabFileStore(path.join(dir, 'vocab.json'));
  const model = createVocabModel({ mode: 'file', fileStore: store });
  await loadStarterSeed(model);
  service = createVocabService({ model });
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('vocab service', () => {
  it('creates profile and dashboard', async () => {
    const p = await service.ensureProfile('vis_1', { goal: 'general', levelId: 'starter' });
    const dash = await service.getDashboard(p.id);
    expect(dash.streakDays).toBe(0);
    expect(dash.levelId).toBe('starter');
    expect(dash.today.learnRemaining).toBeGreaterThan(0);
  });

  it('learn session grades mcq and updates memory', async () => {
    const p = await service.ensureProfile('vis_2', { goal: 'general', levelId: 'starter' });
    const session = await service.startSession(p.id, 'learn');
    expect(session.items.length).toBeGreaterThan(0);
    const item = session.items[0];
    const result = await service.submitAnswer(p.id, session.sessionId, {
      wordId: item.wordId,
      quizType: 'mcq',
      userAnswer: item.expected,
      responseMs: 1800,
      confidence: 4,
    });
    expect(result.isCorrect).toBe(true);
    expect(result.memoryScore).toBeGreaterThan(0);
    expect(result.xpDelta).toBe(10);
  });

  it('wrong answer schedules short review', async () => {
    const p = await service.ensureProfile('vis_3', { goal: 'general', levelId: 'starter' });
    const session = await service.startSession(p.id, 'learn');
    const item = session.items[0];
    const result = await service.submitAnswer(p.id, session.sessionId, {
      wordId: item.wordId,
      quizType: 'type',
      userAnswer: 'zzzz-not-a-word',
      responseMs: 5000,
      confidence: 1,
    });
    expect(result.isCorrect).toBe(false);
    expect(result.nextReviewAt).toBeLessThan(Date.now() + 24 * 3600 * 1000);
  });
});

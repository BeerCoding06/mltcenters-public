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
let model;

beforeEach(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocab-'));
  const store = createVocabFileStore(path.join(dir, 'vocab.json'));
  model = createVocabModel({ mode: 'file', fileStore: store });
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

  it('review answers do not reduce learnRemaining like new words', async () => {
    const p = await service.ensureProfile('vis_quota', { goal: 'general', levelId: 'starter' });
    const before = await service.getDashboard(p.id);
    const remaining0 = before.today.learnRemaining;

    const learnSession = await service.startSession(p.id, 'learn');
    const item = learnSession.items[0];
    await service.submitAnswer(p.id, learnSession.sessionId, {
      wordId: item.wordId,
      quizType: 'mcq',
      userAnswer: item.expected,
      responseMs: 1200,
      confidence: 4,
    });

    const afterNew = await service.getDashboard(p.id);
    expect(afterNew.today.learnRemaining).toBe(remaining0 - 1);

    await model.upsertReviewSchedule({
      profileId: p.id,
      wordId: item.wordId,
      nextReviewAt: Date.now() - 1000,
      priority: 1,
    });
    const st = await model.getWordStat(p.id, item.wordId);
    await model.upsertWordStat({ ...st, nextReviewAt: Date.now() - 1000 });

    const reviewSession = await service.startSession(p.id, 'review');
    const reviewItem =
      reviewSession.items.find((i) => i.wordId === item.wordId) || reviewSession.items[0];
    expect(reviewItem.wordId).toBe(item.wordId);
    await service.submitAnswer(p.id, reviewSession.sessionId, {
      wordId: reviewItem.wordId,
      quizType: 'mcq',
      userAnswer: reviewItem.expected,
      responseMs: 1400,
      confidence: 4,
    });

    const afterReview = await service.getDashboard(p.id);
    expect(afterReview.today.learnRemaining).toBe(afterNew.today.learnRemaining);
  });
});

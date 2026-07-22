// server/vocab/memory.test.js
import { describe, it, expect } from 'vitest';
import {
  computeMemoryScore,
  masteryFromScore,
  nextReviewAfterAnswer,
} from './memory.js';

describe('computeMemoryScore', () => {
  it('returns high score for strong learner', () => {
    const score = computeMemoryScore({
      correctCount: 9,
      wrongCount: 1,
      avgResponseMs: 2000,
      medianResponseMs: 2500,
      hoursSinceLastReview: 12,
      scheduledIntervalDays: 1,
      forgetCount: 0,
      avgConfidenceWhenCorrect: 4,
      reviewDaysLast7: 5,
    });
    expect(score).toBeGreaterThanOrEqual(70);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('penalizes forgets and low accuracy', () => {
    const score = computeMemoryScore({
      correctCount: 2,
      wrongCount: 8,
      avgResponseMs: 8000,
      medianResponseMs: 2500,
      hoursSinceLastReview: 72,
      scheduledIntervalDays: 1,
      forgetCount: 3,
      avgConfidenceWhenCorrect: 2,
      reviewDaysLast7: 1,
    });
    expect(score).toBeLessThan(40);
  });
});

describe('masteryFromScore', () => {
  it('maps bands', () => {
    expect(masteryFromScore(10)).toBe(0);
    expect(masteryFromScore(30)).toBe(1);
    expect(masteryFromScore(50)).toBe(2);
    expect(masteryFromScore(70)).toBe(3);
    expect(masteryFromScore(80)).toBe(4);
    expect(masteryFromScore(90)).toBe(5);
  });
});

describe('nextReviewAfterAnswer', () => {
  it('extends interval on correct', () => {
    const now = Date.parse('2026-07-22T00:00:00Z');
    const next = nextReviewAfterAnswer(
      { intervalDays: 1, easeFactor: 2.3, forgetCount: 0 },
      true,
      now
    );
    expect(next.intervalDays).toBeGreaterThan(1);
    expect(next.nextReviewAt).toBeGreaterThan(now);
    expect(next.forgetCount).toBe(0);
  });

  it('resets interval and bumps forget on wrong', () => {
    const now = Date.parse('2026-07-22T00:00:00Z');
    const next = nextReviewAfterAnswer(
      { intervalDays: 4, easeFactor: 2.3, forgetCount: 0 },
      false,
      now
    );
    expect(next.intervalDays).toBeCloseTo(0.5, 5);
    expect(next.easeFactor).toBeLessThan(2.3);
    expect(next.forgetCount).toBe(1);
  });
});

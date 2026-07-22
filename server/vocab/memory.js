// server/vocab/memory.js
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * @typedef {{
 *  correctCount: number,
 *  wrongCount: number,
 *  avgResponseMs: number,
 *  medianResponseMs: number,
 *  hoursSinceLastReview: number,
 *  scheduledIntervalDays: number,
 *  forgetCount: number,
 *  avgConfidenceWhenCorrect: number,
 *  reviewDaysLast7: number,
 * }} MemoryInput
 */

/** @param {MemoryInput} input */
export function computeMemoryScore(input) {
  const total = input.correctCount + input.wrongCount;
  const accuracy = total === 0 ? 50 : (input.correctCount / total) * 100;

  const med = Math.max(1, input.medianResponseMs || 2500);
  const ratio = (input.avgResponseMs || med) / med;
  let speed = 100;
  if (ratio < 0.35) speed = 55; // suspiciously fast
  else if (ratio <= 1.2) speed = 100;
  else if (ratio <= 2) speed = 70;
  else speed = 40;

  const dueHours = (input.scheduledIntervalDays || 1) * 24;
  const overdue = Math.max(0, (input.hoursSinceLastReview || 0) - dueHours);
  const recency = clamp(100 - overdue * 2, 0, 100);

  const forgetPenalty = Math.min(100, (input.forgetCount || 0) * 15);
  const confidence = clamp(((input.avgConfidenceWhenCorrect || 3) / 5) * 100, 0, 100);
  const streakStability = clamp(((input.reviewDaysLast7 || 0) / 7) * 100, 0, 100);

  const score =
    0.35 * accuracy +
    0.15 * speed +
    0.2 * recency +
    0.15 * (100 - forgetPenalty) +
    0.1 * confidence +
    0.05 * streakStability;

  return Math.round(clamp(score, 0, 100));
}

export function masteryFromScore(score) {
  if (score < 20) return 0;
  if (score < 40) return 1;
  if (score < 60) return 2;
  if (score < 75) return 3;
  if (score < 85) return 4;
  return 5;
}

/**
 * @param {{ intervalDays: number, easeFactor: number, forgetCount: number }} prev
 * @param {boolean} isCorrect
 * @param {number} nowMs
 */
export function nextReviewAfterAnswer(prev, isCorrect, nowMs) {
  let intervalDays = prev.intervalDays ?? 0.5;
  let easeFactor = prev.easeFactor ?? 2.3;
  let forgetCount = prev.forgetCount ?? 0;

  if (isCorrect) {
    intervalDays = Math.max(0.5, intervalDays * easeFactor);
    easeFactor = Math.min(3.0, easeFactor + 0.05);
  } else {
    intervalDays = 0.5;
    easeFactor = Math.max(1.3, easeFactor * 0.85);
    forgetCount += 1;
  }

  const nextReviewAt = nowMs + intervalDays * 24 * 60 * 60 * 1000;
  return { intervalDays, easeFactor, forgetCount, nextReviewAt };
}

import type { Difficulty } from "@prisma/client";

const DIFFICULTY_ORDER: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

export interface QuizAttemptResult {
  isCorrect: boolean;
}

export interface QuizRewardResult {
  coinsDelta: number;
  expDelta: number;
  skipNext: boolean;
}

export function gradeChoice(
  choices: { id: string; isCorrect: boolean }[],
  choiceId: string,
): boolean {
  const choice = choices.find((c) => c.id === choiceId);
  return choice?.isCorrect ?? false;
}

export function computeQuizRewards(
  isCorrect: boolean,
  isBoss: boolean,
  currentCoins: number,
): QuizRewardResult {
  if (isCorrect) {
    return {
      coinsDelta: isBoss ? 300 : 150,
      expDelta: isBoss ? 50 : 25,
      skipNext: false,
    };
  }

  return {
    coinsDelta: -Math.min(75, currentCoins),
    expDelta: 0,
    skipNext: true,
  };
}

export function consecutiveCorrectStreak(
  attempts: QuizAttemptResult[],
): number {
  let streak = 0;
  for (const attempt of attempts) {
    if (attempt.isCorrect) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

export function consecutiveWrongStreak(attempts: QuizAttemptResult[]): number {
  let streak = 0;
  for (const attempt of attempts) {
    if (!attempt.isCorrect) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

export function adjustDifficulty(
  current: Difficulty,
  recentAttempts: QuizAttemptResult[],
): Difficulty {
  const correctStreak = consecutiveCorrectStreak(recentAttempts);
  const wrongStreak = consecutiveWrongStreak(recentAttempts);
  const idx = DIFFICULTY_ORDER.indexOf(current);

  if (correctStreak >= 3 && idx < DIFFICULTY_ORDER.length - 1) {
    return DIFFICULTY_ORDER[idx + 1];
  }
  if (wrongStreak >= 2 && idx > 0) {
    return DIFFICULTY_ORDER[idx - 1];
  }
  return current;
}

export function nextStreakAfterAnswer(
  recentAttempts: QuizAttemptResult[],
  isCorrect: boolean,
): number {
  if (!isCorrect) {
    return 0;
  }
  return consecutiveCorrectStreak(recentAttempts) + 1;
}

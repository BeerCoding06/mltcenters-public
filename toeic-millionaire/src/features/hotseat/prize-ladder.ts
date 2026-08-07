/** 15-step score ladder (quiz-show style). Safe havens at steps 5 and 10. */
export const PRIZE_LADDER = [
  { step: 1, amount: 100, label: "100" },
  { step: 2, amount: 200, label: "200" },
  { step: 3, amount: 300, label: "300" },
  { step: 4, amount: 500, label: "500" },
  { step: 5, amount: 1_000, label: "1,000", safe: true },
  { step: 6, amount: 2_000, label: "2,000" },
  { step: 7, amount: 4_000, label: "4,000" },
  { step: 8, amount: 8_000, label: "8,000" },
  { step: 9, amount: 16_000, label: "16,000" },
  { step: 10, amount: 32_000, label: "32,000", safe: true },
  { step: 11, amount: 64_000, label: "64,000" },
  { step: 12, amount: 125_000, label: "125,000" },
  { step: 13, amount: 250_000, label: "250,000" },
  { step: 14, amount: 500_000, label: "500,000" },
  { step: 15, amount: 1_000_000, label: "1,000,000", safe: true },
] as const;

export type PrizeStep = (typeof PRIZE_LADDER)[number];

export const TOTAL_QUESTIONS = PRIZE_LADDER.length;

export function formatPrize(amount: number): string {
  return amount.toLocaleString("en-US");
}

/** Guaranteed score after answering `answeredCount` correctly (0 = nothing yet). */
export function guaranteedPrize(answeredCount: number): number {
  if (answeredCount >= 10) return PRIZE_LADDER[9].amount;
  if (answeredCount >= 5) return PRIZE_LADDER[4].amount;
  return 0;
}

export function currentPrize(stepIndex: number): PrizeStep {
  return PRIZE_LADDER[Math.min(Math.max(stepIndex, 0), PRIZE_LADDER.length - 1)];
}

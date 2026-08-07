"use client";

import { PRIZE_LADDER, type PrizeStep } from "./prize-ladder";
import { cn } from "@/lib/utils";

type Props = {
  currentStep: number; // 1-based question number currently being answered
  answeredCount: number;
};

export function MoneyLadder({ currentStep, answeredCount }: Props) {
  const rows = [...PRIZE_LADDER].reverse();

  return (
    <ol className="flex w-full flex-col gap-0.5 text-sm">
      {rows.map((tier) => (
        <LadderRow
          key={tier.step}
          tier={tier}
          currentStep={currentStep}
          answeredCount={answeredCount}
        />
      ))}
    </ol>
  );
}

function LadderRow({
  tier,
  currentStep,
  answeredCount,
}: {
  tier: PrizeStep;
  currentStep: number;
  answeredCount: number;
}) {
  const isCurrent = tier.step === currentStep;
  const isWon = tier.step <= answeredCount;
  const isSafe = "safe" in tier && tier.safe;

  return (
    <li
      className={cn(
        "flex items-center justify-between rounded-sm px-2 py-1 font-medium transition-colors",
        isCurrent && "bg-[var(--millionaire-gold)] text-black shadow-[0_0_16px_rgb(251_191_36_/_35%)]",
        !isCurrent && isWon && "text-[var(--millionaire-gold)]",
        !isCurrent && !isWon && isSafe && "text-[var(--millionaire-cyan)]",
        !isCurrent && !isWon && !isSafe && "text-[var(--millionaire-silver)]/70",
      )}
    >
      <span className="tabular-nums opacity-80">{tier.step}</span>
      <span className={cn(isSafe && !isCurrent && "font-semibold")}>{tier.label}</span>
    </li>
  );
}

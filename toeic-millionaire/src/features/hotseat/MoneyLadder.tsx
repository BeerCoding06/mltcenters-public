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
        isCurrent && "bg-[#c9a227] text-black shadow-[0_0_12px_rgb(201_162_39_/_40%)]",
        !isCurrent && isWon && "text-[#fbbf24]",
        !isCurrent && !isWon && isSafe && "text-[#93c5fd]",
        !isCurrent && !isWon && !isSafe && "text-[#a1a1aa]",
      )}
    >
      <span className="tabular-nums opacity-80">{tier.step}</span>
      <span className={cn(isSafe && !isCurrent && "font-semibold")}>{tier.label}</span>
    </li>
  );
}

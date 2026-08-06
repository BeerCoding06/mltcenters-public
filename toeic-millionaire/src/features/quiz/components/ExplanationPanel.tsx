"use client";

import { cn } from "@/lib/utils";

interface ExplanationPanelProps {
  explanationTh: string;
  isCorrect: boolean;
}

export function ExplanationPanel({
  explanationTh,
  isCorrect,
}: ExplanationPanelProps) {
  return (
    <div
      className={cn(
        "millionaire-pill text-sm",
        isCorrect
          ? "border-[var(--millionaire-correct)] bg-[var(--millionaire-correct)]/10"
          : "border-[var(--millionaire-wrong)] bg-[var(--millionaire-wrong)]/10",
      )}
    >
      <p
        className={cn(
          "mb-1 text-xs font-semibold uppercase tracking-wide",
          isCorrect
            ? "text-[var(--millionaire-correct)]"
            : "text-[var(--millionaire-wrong)]",
        )}
      >
        {isCorrect ? "ถูกต้อง" : "ไม่ถูกต้อง"}
      </p>
      <p className="leading-relaxed">{explanationTh}</p>
    </div>
  );
}

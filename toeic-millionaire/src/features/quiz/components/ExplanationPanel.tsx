"use client";

import { useGameLang } from "@/features/i18n/GameLangProvider";
import { cn } from "@/lib/utils";

interface ExplanationPanelProps {
  explanation: string;
  isCorrect: boolean;
}

export function ExplanationPanel({
  explanation,
  isCorrect,
}: ExplanationPanelProps) {
  const { t } = useGameLang();

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
        {isCorrect ? t.correct : t.incorrect}
      </p>
      <p className="leading-relaxed">{explanation}</p>
    </div>
  );
}

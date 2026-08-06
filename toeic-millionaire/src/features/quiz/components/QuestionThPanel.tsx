"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useGameLang } from "@/features/i18n/GameLangProvider";
import type { TranslationResult } from "@/features/quiz/translate-service";

interface QuestionThPanelProps {
  translation?: TranslationResult;
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  choiceLabels: Record<string, string>;
}

export function QuestionThPanel({
  translation,
  isLoading,
  isError,
  onRetry,
  choiceLabels,
}: QuestionThPanelProps) {
  const { t } = useGameLang();

  if (isLoading) {
    return (
      <div className="millionaire-pill space-y-2">
        <Skeleton className="h-4 w-full bg-[var(--millionaire-silver)]/20" />
        <Skeleton className="h-4 w-3/4 bg-[var(--millionaire-silver)]/20" />
        <Skeleton className="h-4 w-1/2 bg-[var(--millionaire-silver)]/20" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="millionaire-pill border-[var(--millionaire-wrong)] text-sm">
        <p className="text-[var(--millionaire-wrong)]">{t.translationFailed}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 text-xs font-medium text-[var(--millionaire-cyan)] underline"
        >
          {t.retry}
        </button>
      </div>
    );
  }

  if (!translation) {
    return null;
  }

  return (
    <div className="millionaire-pill space-y-3 text-sm">
      <p className="leading-relaxed">{translation.stemTh}</p>
      {translation.passageTh ? (
        <p className="leading-relaxed text-[var(--millionaire-silver)]">
          {translation.passageTh}
        </p>
      ) : null}
      <ul className="space-y-1.5">
        {translation.choicesTh.map((choice) => (
          <li key={choice.choiceId} className="flex gap-2">
            <span className="font-bold text-[var(--millionaire-gold)]">
              {choiceLabels[choice.choiceId] ?? "?"}
            </span>
            <span>{choice.labelTh}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

import { Languages } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import type { TranslationResult } from "@/features/quiz/translate-service";
import { useGameLang } from "@/features/i18n/GameLangProvider";
import { cn } from "@/lib/utils";

async function fetchTranslation(questionId: string): Promise<TranslationResult> {
  const res = await fetch(`/api/quiz/${questionId}/translation`);
  if (!res.ok) {
    throw new Error("Failed to load translation");
  }
  return res.json();
}

export function useQuestionTranslation(questionId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["translation", questionId],
    queryFn: () => fetchTranslation(questionId),
    enabled,
    staleTime: Infinity,
    retry: 1,
  });
}

interface TranslateThButtonProps {
  showTh: boolean;
  isLoading?: boolean;
  onToggle: (show: boolean) => void;
}

/** Per-question content translate (stem/choices) — separate from UI language. */
export function TranslateThButton({
  showTh,
  isLoading = false,
  onToggle,
}: TranslateThButtonProps) {
  const { t } = useGameLang();

  return (
    <button
      type="button"
      title={showTh ? t.showEnglish : t.translateTh}
      aria-label={showTh ? t.showEnglish : t.translateTh}
      onClick={() => onToggle(!showTh)}
      disabled={showTh && isLoading}
      className={cn(
        "millionaire-lifeline",
        showTh && "millionaire-lifeline-active",
      )}
      aria-pressed={showTh}
    >
      {showTh && isLoading ? (
        <span className="text-xs">…</span>
      ) : (
        <Languages className="size-4" />
      )}
    </button>
  );
}

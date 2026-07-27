"use client";

import { useQuery } from "@tanstack/react-query";
import type { TranslationResult } from "@/features/quiz/translate-service";

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

export function TranslateThButton({
  showTh,
  isLoading = false,
  onToggle,
}: TranslateThButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!showTh)}
      disabled={showTh && isLoading}
      className="rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
      aria-pressed={showTh}
    >
      {showTh ? "EN" : "🇹🇭 แปลเป็นภาษาไทย"}
    </button>
  );
}

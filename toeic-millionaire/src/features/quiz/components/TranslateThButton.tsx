"use client";

import { useQuery } from "@tanstack/react-query";
import { Languages } from "lucide-react";
import type { TranslationResult } from "@/features/quiz/translate-service";
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

export function TranslateThButton({
  showTh,
  isLoading = false,
  onToggle,
}: TranslateThButtonProps) {
  return (
    <button
      type="button"
      title={showTh ? "Show English" : "Translate to Thai"}
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

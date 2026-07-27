"use client";

import { Skeleton } from "@/components/ui/skeleton";
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
  if (isLoading) {
    return (
      <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
        <p className="text-destructive">โหลดคำแปลไม่สำเร็จ</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 text-xs font-medium underline"
        >
          ลองอีกครั้ง
        </button>
      </div>
    );
  }

  if (!translation) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm">
      <p className="leading-relaxed">{translation.stemTh}</p>
      {translation.passageTh ? (
        <p className="leading-relaxed text-muted-foreground">
          {translation.passageTh}
        </p>
      ) : null}
      <ul className="space-y-1.5">
        {translation.choicesTh.map((choice) => (
          <li key={choice.choiceId} className="flex gap-2">
            <span className="font-medium text-muted-foreground">
              {choiceLabels[choice.choiceId] ?? "?"}
            </span>
            <span>{choice.labelTh}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

"use client";

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
      className={`rounded-lg border p-3 text-sm ${
        isCorrect
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-destructive/30 bg-destructive/5"
      }`}
    >
      <p
        className={`mb-1 text-xs font-semibold uppercase tracking-wide ${
          isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-destructive"
        }`}
      >
        {isCorrect ? "ถูกต้อง" : "ไม่ถูกต้อง"}
      </p>
      <p className="leading-relaxed">{explanationTh}</p>
    </div>
  );
}

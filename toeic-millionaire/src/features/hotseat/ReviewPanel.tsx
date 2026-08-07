"use client";

import { Button } from "@/components/ui/button";
import { useGameLang } from "@/features/i18n/GameLangProvider";
import { cn } from "@/lib/utils";
import { formatPrize } from "./prize-ladder";
import type { HotseatReviewItem } from "./session";

type Props = {
  open: boolean;
  items: HotseatReviewItem[];
  onClose: () => void;
};

export function ReviewPanel({ open, items, onClose }: Props) {
  const { t } = useGameLang();
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-3 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[85dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#c9a227]/45 bg-[#020617] shadow-[0_0_40px_rgb(201_162_39_/_18%)]">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#c9a227]">
              {t.brand}
            </p>
            <h2 className="text-lg font-bold text-white">{t.reviewAnswers}</h2>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-full border-[#d4d4d8]/40 bg-black text-white"
          >
            {t.close}
          </Button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {items.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#a1a1aa]">{t.reviewEmpty}</p>
          ) : (
            items.map((item) => (
              <article
                key={`${item.questionId}-${item.at}`}
                className="rounded-xl border border-white/10 bg-black/60 p-3"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-[#c9a227]">
                    {t.questionOf(item.step, items.length > 15 ? item.step : 15)}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-semibold",
                      item.isCorrect
                        ? "bg-[#0d7a4f]/40 text-[#34d399]"
                        : "bg-[#8b1e1e]/40 text-[#f87171]",
                    )}
                  >
                    {item.isCorrect ? t.correct : t.incorrect}
                  </span>
                </div>
                <p className="text-sm font-medium text-white">{item.stem}</p>
                <p className="mt-2 text-xs text-[#a1a1aa]">
                  {t.yourAnswer}:{" "}
                  <span className={item.isCorrect ? "text-[#34d399]" : "text-[#f87171]"}>
                    {item.selectedLabel}
                  </span>
                </p>
                <p className="mt-1 text-xs text-[#a1a1aa]">
                  {t.correctAnswer}:{" "}
                  <span className="text-[#34d399]">{item.correctLabel}</span>
                </p>
                <p className="mt-2 rounded-lg border border-[#c9a227]/30 bg-[#c9a227]/10 px-3 py-2 text-sm text-[#fbbf24]">
                  <span className="font-semibold">{t.whyCorrect}: </span>
                  {item.explanation}
                </p>
                <p className="mt-1 text-[11px] text-[#71717a]">
                  {formatPrize(item.score)} {t.scorePts}
                </p>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

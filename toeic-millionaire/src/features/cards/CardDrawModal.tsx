"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getCardCopy } from "@/features/cards/card-th";
import type { CardDto } from "@/features/cards/card-service";
import type { CardEffect, EffectResult } from "@/features/cards/effects";
import { useGameLang } from "@/features/i18n/GameLangProvider";

interface CardDrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deck: "LUCKY" | "EVENT";
  card: CardDto | null;
  effectResult: EffectResult | null;
  isLoading?: boolean;
  onContinue?: () => void;
}

function localizeEffectSummary(
  effect: CardEffect | undefined,
  fallback: string,
  t: ReturnType<typeof useGameLang>["t"],
): string {
  if (!effect) return fallback;
  switch (effect.type) {
    case "coins":
      return t.effectCoins(effect.amount);
    case "exp":
      return t.effectExp(effect.amount);
    case "move":
      return t.effectMove(effect.steps);
    case "skipTurn":
      return t.effectSkip;
    case "freeHint":
      return t.effectFreeHint;
    case "bonusQuiz":
      return t.effectBonusQuiz;
    default:
      return fallback;
  }
}

export function CardDrawModal({
  open,
  onOpenChange,
  deck,
  card,
  effectResult,
  isLoading = false,
  onContinue,
}: CardDrawModalProps) {
  const { t, isTh } = useGameLang();
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (!open) {
      setFlipped(false);
      return;
    }
    if (card && !isLoading) {
      const timer = window.setTimeout(() => setFlipped(true), 400);
      return () => window.clearTimeout(timer);
    }
  }, [open, card, isLoading]);

  const deckLabel = deck === "LUCKY" ? t.luckyCard : t.eventCard;
  const deckAccent =
    deck === "LUCKY"
      ? "from-amber-400 to-yellow-500"
      : "from-violet-500 to-purple-600";

  const copy = card
    ? getCardCopy(card.id, card.title, card.body, isTh)
    : null;

  const effectSummary = localizeEffectSummary(
    card?.effect,
    effectResult?.summary ?? "",
    t,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showCloseButton={!isLoading}>
        <DialogHeader>
          <DialogTitle>{deckLabel}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="perspective-[1000px] h-52 w-40">
            <motion.div
              className="relative h-full w-full"
              style={{ transformStyle: "preserve-3d" }}
              animate={{ rotateY: flipped ? 180 : 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              <div
                className={`absolute inset-0 flex items-center justify-center rounded-2xl bg-gradient-to-br ${deckAccent} text-white shadow-lg`}
                style={{ backfaceVisibility: "hidden" }}
              >
                <span className="text-lg font-semibold tracking-wide">
                  {isLoading ? t.drawing : "?"}
                </span>
              </div>

              <div
                className="absolute inset-0 flex flex-col justify-center rounded-2xl border bg-card p-4 text-center shadow-lg"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                {copy ? (
                  <>
                    <p className="text-base font-semibold">{copy.title}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{copy.body}</p>
                    {effectResult ? (
                      <p className="mt-3 text-sm font-medium text-emerald-600">
                        {effectSummary}
                      </p>
                    ) : null}
                  </>
                ) : null}
              </div>
            </motion.div>
          </div>
        </div>

        <DialogFooter>
          <Button
            disabled={!card || isLoading}
            onClick={() => {
              onContinue?.();
              onOpenChange(false);
            }}
          >
            {t.continue}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
import type { CardDto } from "@/features/cards/card-service";
import type { EffectResult } from "@/features/cards/effects";

interface CardDrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deck: "LUCKY" | "EVENT";
  card: CardDto | null;
  effectResult: EffectResult | null;
  isLoading?: boolean;
  onContinue?: () => void;
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

  const deckLabel = deck === "LUCKY" ? "Lucky Card" : "Event Card";
  const deckAccent =
    deck === "LUCKY"
      ? "from-amber-400 to-yellow-500"
      : "from-violet-500 to-purple-600";

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
                  {isLoading ? "Drawing..." : "?"}
                </span>
              </div>

              <div
                className="absolute inset-0 flex flex-col justify-center rounded-2xl border bg-card p-4 text-center shadow-lg"
                style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              >
                {card ? (
                  <>
                    <p className="text-base font-semibold">{card.title}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{card.body}</p>
                    {effectResult ? (
                      <p className="mt-3 text-sm font-medium text-emerald-600">
                        {effectResult.summary}
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
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Dices } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { CardDrawModal } from "@/features/cards/CardDrawModal";
import type { CardDto } from "@/features/cards/card-service";
import type { EffectResult } from "@/features/cards/effects";
import { BoardCanvas } from "@/features/board/BoardCanvas";
import type { GameStateSnapshot } from "@/features/game/game-service";
import { tileActionToast } from "@/features/game/tile-action-toast";
import type { TileAction } from "@/features/game/types";
import {
  useGameSession,
  useInvalidateGameSession,
} from "@/features/game/useGameSession";
import { useGameStore } from "@/features/game/useGameStore";
import { Hud } from "@/features/player/Hud";
import { QuizModal } from "@/features/quiz/QuizModal";
import type { QuizModalQuestion } from "@/features/quiz/QuizModal";
import { cn } from "@/lib/utils";

interface RollResponse {
  dice: number;
  newState: GameStateSnapshot;
  tileAction: TileAction;
  skipped: boolean;
}

interface BoardGameProps {
  sessionId: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function animateDice(finalValue: number, onTick: (n: number) => void) {
  return new Promise<void>((resolve) => {
    let count = 0;
    const interval = window.setInterval(() => {
      onTick(Math.floor(Math.random() * 6) + 1);
      count += 1;
      if (count >= 10) {
        window.clearInterval(interval);
        onTick(finalValue);
        resolve();
      }
    }, 80);
  });
}

export function BoardGame({ sessionId }: BoardGameProps) {
  const { data: state, isLoading, error } = useGameSession(sessionId);
  const invalidate = useInvalidateGameSession();
  const botTimerRef = useRef<number | null>(null);

  const humanPlayerId = useGameStore((s) => s.humanPlayerId);
  const setHumanPlayerId = useGameStore((s) => s.setHumanPlayerId);
  const isRolling = useGameStore((s) => s.isRolling);
  const setIsRolling = useGameStore((s) => s.setIsRolling);
  const lastDice = useGameStore((s) => s.lastDice);
  const setLastDice = useGameStore((s) => s.setLastDice);
  const diceAnimating = useGameStore((s) => s.diceAnimating);
  const setDiceAnimating = useGameStore((s) => s.setDiceAnimating);
  const actionBlocked = useGameStore((s) => s.actionBlocked);
  const quizOpen = useGameStore((s) => s.quizOpen);
  const quizQuestion = useGameStore((s) => s.quizQuestion);
  const openQuiz = useGameStore((s) => s.openQuiz);
  const closeQuiz = useGameStore((s) => s.closeQuiz);
  const cardOpen = useGameStore((s) => s.cardOpen);
  const cardDeck = useGameStore((s) => s.cardDeck);
  const cardData = useGameStore((s) => s.cardData);
  const cardEffect = useGameStore((s) => s.cardEffect);
  const cardLoading = useGameStore((s) => s.cardLoading);
  const openCardDraw = useGameStore((s) => s.openCardDraw);
  const setCardResult = useGameStore((s) => s.setCardResult);
  const closeCard = useGameStore((s) => s.closeCard);

  const humanPlayer = state?.players.find((p) => p.id === humanPlayerId)
    ?? state?.players.find((p) => !p.isBot);

  useEffect(() => {
    if (humanPlayer && !humanPlayerId) {
      setHumanPlayerId(humanPlayer.id);
    }
  }, [humanPlayer, humanPlayerId, setHumanPlayerId]);

  const resolveTileAction = useCallback(
    async (
      action: TileAction,
      skipped: boolean,
      playerId: string,
      difficulty: string,
      isBot: boolean,
    ) => {
      if (skipped) {
        tileActionToast(action, true);
        return;
      }

      if (isBot) {
        if (action.type === "quiz" || action.type === "drawCard") {
          toast.add({
            title: "Bot turn",
            description: `${action.type === "quiz" ? "Quiz" : "Card"} resolved automatically.`,
            type: "info",
          });
          return;
        }
        tileActionToast(action, false);
        return;
      }

      if (action.type === "quiz") {
        const params = new URLSearchParams({
          sessionId,
          category: action.category,
          difficulty,
        });
        const res = await fetch(`/api/quiz/next?${params}`);
        if (!res.ok) {
          toast.add({
            title: "Quiz unavailable",
            description: "Could not load a question.",
            type: "error",
          });
          return;
        }
        const question = (await res.json()) as QuizModalQuestion;
        openQuiz(question);
        return;
      }

      if (action.type === "drawCard") {
        openCardDraw(action.deck);
        try {
          const res = await fetch("/api/cards/draw", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              playerId,
              deck: action.deck,
            }),
          });
          if (!res.ok) {
            throw new Error("Draw failed");
          }
          const payload = (await res.json()) as {
            card: CardDto;
            effectResult: EffectResult;
          };
          setCardResult(payload.card, payload.effectResult);
        } catch {
          closeCard();
          toast.add({
            title: "Card draw failed",
            type: "error",
          });
        }
        return;
      }

      if (action.type === "flavor" && action.effect === "quiz") {
        const params = new URLSearchParams({
          sessionId,
          category: "RANDOM",
          difficulty,
        });
        const res = await fetch(`/api/quiz/next?${params}`);
        if (res.ok) {
          openQuiz((await res.json()) as QuizModalQuestion);
        } else {
          tileActionToast(action, false);
        }
        return;
      }

      tileActionToast(action, false);
    },
    [sessionId, openQuiz, openCardDraw, setCardResult, closeCard],
  );

  const performRoll = useCallback(
    async (playerId?: string) => {
      if (isRolling || actionBlocked || !state) return;

      const rollingPlayerId = playerId ?? state.currentPlayerId;
      const rollingPlayer = state.players.find((p) => p.id === rollingPlayerId);
      if (!rollingPlayer) return;

      setIsRolling(true);
      setDiceAnimating(true);

      try {
        const url = playerId
          ? `/api/game/${sessionId}/roll?playerId=${playerId}`
          : `/api/game/${sessionId}/roll`;

        const res = await fetch(url, { method: "POST" });
        if (!res.ok) {
          const payload = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(payload?.error ?? "Roll failed");
        }

        const result = (await res.json()) as RollResponse;

        if (result.dice > 0) {
          await animateDice(result.dice, setLastDice);
        } else {
          setLastDice(0);
        }

        setDiceAnimating(false);
        await sleep(300);
        await invalidate(sessionId);

        await resolveTileAction(
          result.tileAction,
          result.skipped,
          rollingPlayerId,
          result.newState.difficulty,
          rollingPlayer.isBot,
        );

        if (result.newState.status === "COMPLETED") {
          await invalidate(sessionId);
        }
      } catch (err) {
        toast.add({
          title: "Roll failed",
          description: err instanceof Error ? err.message : "Try again",
          type: "error",
        });
      } finally {
        setIsRolling(false);
        setDiceAnimating(false);
      }
    },
    [
      sessionId,
      state,
      isRolling,
      actionBlocked,
      setIsRolling,
      setDiceAnimating,
      setLastDice,
      invalidate,
      resolveTileAction,
    ],
  );

  useEffect(() => {
    if (!state || state.status !== "ACTIVE") return;
    if (isRolling || actionBlocked || quizOpen || cardOpen) return;

    const current = state.players.find((p) => p.id === state.currentPlayerId);
    if (!current?.isBot) return;

    botTimerRef.current = window.setTimeout(() => {
      void performRoll(current.id);
    }, 1200);

    return () => {
      if (botTimerRef.current) {
        window.clearTimeout(botTimerRef.current);
      }
    };
  }, [
    state,
    isRolling,
    actionBlocked,
    quizOpen,
    cardOpen,
    performRoll,
  ]);

  if (isLoading) {
    return (
      <div className="flex min-h-full items-center justify-center text-muted-foreground">
        Loading board…
      </div>
    );
  }

  if (error || !state) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4">
        <p className="text-destructive">
          {error instanceof Error ? error.message : "Game not found"}
        </p>
        <Link href="/play" className={buttonVariants({ variant: "outline" })}>
          Back to lobby
        </Link>
      </div>
    );
  }

  const current = state.players.find((p) => p.id === state.currentPlayerId);
  const isHumanTurn =
    current && !current.isBot && current.id === humanPlayer?.id;
  const canRoll =
    state.status === "ACTIVE" &&
    isHumanTurn &&
    !isRolling &&
    !actionBlocked;

  if (state.status === "COMPLETED") {
    const winner = state.players.find((p) => p.id === state.winnerId);
    const humanWon = winner?.id === humanPlayer?.id;

    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-6 px-6 py-12">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md space-y-4 rounded-3xl border border-white/10 bg-card/70 p-8 text-center backdrop-blur-xl"
        >
          <h1 className="text-3xl font-bold">
            {humanWon ? "You win!" : "Game over"}
          </h1>
          <p className="text-muted-foreground">
            Winner: <strong>{winner?.displayName ?? "—"}</strong> with{" "}
            {winner?.coins ?? 0} coins
          </p>
          {humanPlayer ? (
            <p className="text-sm">
              Your score: {humanPlayer.coins} coins · {humanPlayer.exp} EXP · Lap{" "}
              {humanPlayer.lap}
            </p>
          ) : null}
          <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
            <Link
              href="/play"
              className={cn(
                buttonVariants(),
                "bg-emerald-500 text-white hover:bg-emerald-400",
              )}
            >
              Play again
            </Link>
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              Home
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col bg-gradient-to-b from-[#1E293B]/30 to-background">
      <header className="flex items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/play" className="text-sm text-muted-foreground hover:text-foreground">
          Lobby
        </Link>
        <ThemeToggle />
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-4 px-4 pb-8 sm:px-6">
        <Hud state={state} humanPlayer={humanPlayer} />

        <BoardCanvas
          players={state.players}
          currentPlayerId={state.currentPlayerId}
          highlightPosition={
            lastDice && !diceAnimating
              ? state.players.find((p) => p.id === state.currentPlayerId)?.position
              : null
          }
        />

        <div className="flex flex-col items-center gap-3">
          <motion.div
            className="flex size-16 items-center justify-center rounded-2xl border border-amber-400/30 bg-[#1E293B]/60 text-3xl font-bold text-amber-400 shadow-lg backdrop-blur-xl"
            animate={diceAnimating ? { rotate: [0, 15, -15, 0] } : {}}
            transition={{ repeat: diceAnimating ? Infinity : 0, duration: 0.3 }}
          >
            {diceAnimating || lastDice !== null ? (lastDice ?? "🎲") : "🎲"}
          </motion.div>

          <Button
            size="lg"
            disabled={!canRoll}
            onClick={() => void performRoll()}
            className="gap-2 bg-amber-400 text-[#1E293B] hover:bg-amber-300 disabled:opacity-50"
          >
            <Dices className="size-5" />
            {isRolling ? "Rolling…" : isHumanTurn ? "Roll dice" : "Waiting…"}
          </Button>

          {!isHumanTurn && current?.isBot ? (
            <p className="text-xs text-muted-foreground">
              {current.displayName} is thinking…
            </p>
          ) : null}
        </div>
      </div>

      <QuizModal
        open={quizOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeQuiz();
            void invalidate(sessionId);
          }
        }}
        question={quizQuestion}
        sessionId={sessionId}
        playerId={humanPlayer?.id ?? ""}
        onAnswered={() => void invalidate(sessionId)}
      />

      <CardDrawModal
        open={cardOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeCard();
            void invalidate(sessionId);
          }
        }}
        deck={cardDeck ?? "LUCKY"}
        card={cardData}
        effectResult={cardEffect}
        isLoading={cardLoading}
        onContinue={() => void invalidate(sessionId)}
      />
    </div>
  );
}

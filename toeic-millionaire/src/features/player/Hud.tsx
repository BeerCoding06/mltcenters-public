"use client";

import { Coins, Sparkles, User } from "lucide-react";
import type { GamePlayerSnapshot, GameStateSnapshot } from "@/features/game/game-service";
import { cn } from "@/lib/utils";

interface HudProps {
  state: GameStateSnapshot;
  humanPlayer: GamePlayerSnapshot | undefined;
}

export function Hud({ state, humanPlayer }: HudProps) {
  const current = state.players.find((p) => p.id === state.currentPlayerId);
  const isHumanTurn = current?.id === humanPlayer?.id;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--millionaire-silver)]/50 bg-black px-4 py-3 shadow-[0_0_24px_rgb(91_192_255_/_8%)]">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-[var(--millionaire-gold)]">
          <Coins className="size-4" />
          <span className="font-semibold tabular-nums">
            {humanPlayer?.coins ?? 0}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[var(--millionaire-cyan)]">
          <Sparkles className="size-4" />
          <span className="font-semibold tabular-nums">
            {humanPlayer?.exp ?? 0} EXP
          </span>
        </div>
        <div className="text-xs text-[var(--millionaire-silver)]">
          Lap {humanPlayer?.lap ?? 0}/{state.lapsToWin}
        </div>
      </div>

      <div
        className="flex items-center gap-2 text-sm"
        aria-live="polite"
        aria-atomic="true"
      >
        <User className="size-4 text-[var(--millionaire-silver)]" />
        <span
          className={cn(
            "font-medium",
            isHumanTurn
              ? "text-[var(--millionaire-cyan)]"
              : "text-[var(--millionaire-gold)]",
          )}
        >
          {current?.displayName ?? "—"}
        </span>
        <span className="text-[var(--millionaire-silver)]">
          {isHumanTurn ? "(Your turn)" : current?.isBot ? "(Bot)" : ""}
        </span>
      </div>

      <div className="text-xs text-[var(--millionaire-silver)]">
        Turn {state.turnCount} · {state.difficulty}
      </div>
    </div>
  );
}

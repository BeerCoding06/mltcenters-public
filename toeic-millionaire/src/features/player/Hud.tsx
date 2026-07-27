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
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#1E293B]/50 px-4 py-3 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-amber-400">
          <Coins className="size-4" />
          <span className="font-semibold tabular-nums">
            {humanPlayer?.coins ?? 0}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Sparkles className="size-4" />
          <span className="font-semibold tabular-nums">
            {humanPlayer?.exp ?? 0} EXP
          </span>
        </div>
        <div className="text-xs text-muted-foreground">
          Lap {humanPlayer?.lap ?? 0}/{state.lapsToWin}
        </div>
      </div>

      <div
        className="flex items-center gap-2 text-sm"
        aria-live="polite"
        aria-atomic="true"
      >
        <User className="size-4 text-muted-foreground" />
        <span
          className={cn(
            "font-medium",
            isHumanTurn ? "text-emerald-400" : "text-violet-400",
          )}
        >
          {current?.displayName ?? "—"}
        </span>
        <span className="text-muted-foreground">
          {isHumanTurn ? "(Your turn)" : current?.isBot ? "(Bot)" : ""}
        </span>
      </div>

      <div className="text-xs text-muted-foreground">
        Turn {state.turnCount} · {state.difficulty}
      </div>
    </div>
  );
}

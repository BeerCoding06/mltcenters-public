"use client";

import { motion } from "framer-motion";
import tilesData from "../../../board/tiles.json";
import type { TileDefinition, TileType } from "@/features/game/types";
import type { GamePlayerSnapshot } from "@/features/game/game-service";
import { tileGridPosition, BOARD_GRID } from "./tile-layout";
import { cn } from "@/lib/utils";

const tiles = tilesData as TileDefinition[];

const TILE_COLORS: Partial<Record<TileType, string>> = {
  START: "from-amber-400/80 to-yellow-500/80 border-amber-300/50",
  VOCABULARY: "from-emerald-500/70 to-emerald-600/70 border-emerald-400/40",
  GRAMMAR: "from-emerald-500/70 to-teal-600/70 border-emerald-400/40",
  READING: "from-emerald-500/70 to-green-600/70 border-emerald-400/40",
  LISTENING: "from-emerald-500/70 to-cyan-600/70 border-emerald-400/40",
  BUSINESS_EMAIL: "from-violet-500/70 to-purple-600/70 border-violet-400/40",
  BUSINESS_MEETING: "from-violet-500/70 to-purple-600/70 border-violet-400/40",
  LUCKY_CARD: "from-amber-400/80 to-orange-500/80 border-amber-300/50",
  EVENT_CARD: "from-fuchsia-500/70 to-purple-600/70 border-fuchsia-400/40",
  BONUS: "from-yellow-400/80 to-amber-500/80 border-yellow-300/50",
  SALARY: "from-yellow-400/80 to-amber-500/80 border-yellow-300/50",
  PROMOTION: "from-yellow-400/80 to-amber-500/80 border-yellow-300/50",
  TAX: "from-red-500/70 to-rose-600/70 border-red-400/40",
  REST: "from-slate-400/60 to-slate-500/60 border-slate-300/40",
  BOSS_QUIZ: "from-red-600/80 to-orange-600/80 border-red-400/50",
  GOLD_CHEST: "from-yellow-400/90 to-amber-600/90 border-yellow-300/60",
  DIAMOND_CHEST: "from-cyan-400/80 to-blue-500/80 border-cyan-300/50",
  TREASURE: "from-amber-300/90 to-yellow-500/90 border-amber-200/60",
};

const PLAYER_COLORS = [
  "bg-emerald-500",
  "bg-violet-500",
  "bg-amber-400",
  "bg-sky-500",
];

function defaultTileColor(type: TileType): string {
  return TILE_COLORS[type] ?? "from-slate-700/60 to-slate-800/60 border-white/10";
}

interface BoardCanvasProps {
  players: GamePlayerSnapshot[];
  currentPlayerId: string;
  highlightPosition?: number | null;
}

export function BoardCanvas({
  players,
  currentPlayerId,
  highlightPosition,
}: BoardCanvasProps) {
  const tokensByTile = new Map<number, GamePlayerSnapshot[]>();
  for (const player of players) {
    const list = tokensByTile.get(player.position) ?? [];
    list.push(player);
    tokensByTile.set(player.position, list);
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto aspect-square p-2 sm:p-4">
      <div
        className="grid h-full w-full gap-1 sm:gap-1.5 rounded-3xl border border-white/10 bg-[#1E293B]/40 p-2 sm:p-3 backdrop-blur-xl shadow-2xl dark:bg-[#1E293B]/60"
        style={{
          gridTemplateRows: `repeat(${BOARD_GRID.rows}, minmax(0, 1fr))`,
          gridTemplateColumns: `repeat(${BOARD_GRID.cols}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: BOARD_GRID.rows * BOARD_GRID.cols }, (_, i) => {
          const row = Math.floor(i / BOARD_GRID.cols);
          const col = i % BOARD_GRID.cols;
          const tile = tiles.find((t) => {
            const pos = tileGridPosition(t.id);
            return pos.row === row && pos.col === col;
          });

          if (!tile) {
            return (
              <div
                key={`empty-${row}-${col}`}
                className="rounded-lg bg-[#0f172a]/30"
                style={{ gridRow: row + 1, gridColumn: col + 1 }}
              />
            );
          }

          const pos = tileGridPosition(tile.id);
          const onPath = highlightPosition === tile.id;
          const tileTokens = tokensByTile.get(tile.id) ?? [];

          return (
            <motion.div
              key={tile.id}
              layout
              className={cn(
                "relative flex flex-col items-center justify-center rounded-lg sm:rounded-xl border bg-gradient-to-br p-0.5 sm:p-1 text-center shadow-md backdrop-blur-sm transition-shadow",
                defaultTileColor(tile.type),
                onPath && "ring-2 ring-amber-400 ring-offset-1 ring-offset-[#1E293B]",
              )}
              style={{ gridRow: pos.row + 1, gridColumn: pos.col + 1 }}
              title={tile.label}
            >
              <span className="text-[6px] sm:text-[8px] font-bold leading-tight text-white drop-shadow">
                {tile.id}
              </span>
              <span className="hidden sm:block text-[7px] font-medium leading-tight text-white/90 line-clamp-2">
                {tile.label}
              </span>
              <div className="absolute -top-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                {tileTokens.map((p, idx) => (
                  <motion.span
                    key={p.id}
                    layout
                    className={cn(
                      "size-2 sm:size-3 rounded-full border border-white/80 shadow",
                      PLAYER_COLORS[p.sortOrder % PLAYER_COLORS.length],
                      p.id === currentPlayerId && "ring-1 ring-white animate-pulse",
                    )}
                    title={p.displayName}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                    style={{ marginLeft: idx > 0 ? -4 : 0 }}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

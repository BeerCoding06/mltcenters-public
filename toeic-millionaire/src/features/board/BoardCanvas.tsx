"use client";

import { motion } from "framer-motion";
import tilesData from "../../../board/tiles.json";
import type { TileDefinition, TileType } from "@/features/game/types";
import type { GamePlayerSnapshot } from "@/features/game/game-service";
import { tileGridPosition, BOARD_GRID } from "./tile-layout";
import { cn } from "@/lib/utils";

const tiles = tilesData as TileDefinition[];

const TILE_COLORS: Partial<Record<TileType, string>> = {
  START: "from-[#FBBF24]/30 to-[#FBBF24]/10 border-[#FBBF24]/50",
  VOCABULARY: "from-[#10B981]/25 to-black border-[#10B981]/40",
  GRAMMAR: "from-[#5BC0FF]/20 to-black border-[#5BC0FF]/40",
  READING: "from-[#10B981]/20 to-black border-[#10B981]/35",
  LISTENING: "from-[#5BC0FF]/25 to-black border-[#5BC0FF]/45",
  BUSINESS_EMAIL: "from-[#FBBF24]/15 to-black border-[#FBBF24]/35",
  BUSINESS_MEETING: "from-[#FBBF24]/15 to-black border-[#FBBF24]/35",
  LUCKY_CARD: "from-[#FBBF24]/35 to-black border-[#FBBF24]/55",
  EVENT_CARD: "from-[#5BC0FF]/20 to-black border-[#5BC0FF]/40",
  BONUS: "from-[#FBBF24]/30 to-black border-[#FBBF24]/50",
  SALARY: "from-[#FBBF24]/30 to-black border-[#FBBF24]/50",
  PROMOTION: "from-[#FBBF24]/30 to-black border-[#FBBF24]/50",
  TAX: "from-[#EF4444]/25 to-black border-[#EF4444]/45",
  REST: "from-[#C0C8D4]/10 to-black border-[#C0C8D4]/25",
  BOSS_QUIZ: "from-[#EF4444]/30 to-black border-[#EF4444]/55",
  GOLD_CHEST: "from-[#FBBF24]/40 to-black border-[#FBBF24]/60",
  DIAMOND_CHEST: "from-[#5BC0FF]/30 to-black border-[#5BC0FF]/55",
  TREASURE: "from-[#FBBF24]/35 to-black border-[#FBBF24]/55",
};

const PLAYER_COLORS = [
  "bg-[#10B981]",
  "bg-[#5BC0FF]",
  "bg-[#FBBF24]",
  "bg-[#EF4444]",
];

function defaultTileColor(type: TileType): string {
  return TILE_COLORS[type] ?? "from-black to-black border-[#C0C8D4]/20";
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
    <div className="relative mx-auto aspect-square w-full max-w-4xl p-2 sm:p-4">
      <div
        className="grid h-full w-full gap-1 rounded-3xl border border-[var(--millionaire-silver)]/40 bg-black p-2 shadow-[0_0_40px_rgb(91_192_255_/_12%)] sm:gap-1.5 sm:p-3"
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
                className="rounded-lg bg-[#05070F]/80"
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
                "relative flex flex-col items-center justify-center rounded-lg border bg-gradient-to-br p-0.5 text-center shadow-md transition-shadow sm:rounded-xl sm:p-1",
                defaultTileColor(tile.type),
                onPath &&
                  "ring-2 ring-[var(--millionaire-gold)] ring-offset-1 ring-offset-black",
              )}
              style={{ gridRow: pos.row + 1, gridColumn: pos.col + 1 }}
              title={tile.label}
            >
              <span className="text-[6px] font-bold leading-tight text-white drop-shadow sm:text-[8px]">
                {tile.id}
              </span>
              <span className="hidden line-clamp-2 text-[7px] font-medium leading-tight text-white/90 sm:block">
                {tile.label}
              </span>
              <div className="absolute -top-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                {tileTokens.map((p, idx) => (
                  <motion.span
                    key={p.id}
                    layout
                    className={cn(
                      "size-2 rounded-full border border-white/80 shadow sm:size-3",
                      PLAYER_COLORS[p.sortOrder % PLAYER_COLORS.length],
                      p.id === currentPlayerId && "animate-pulse ring-1 ring-[var(--millionaire-cyan)]",
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

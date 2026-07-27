import tilesData from "../../../board/tiles.json";
import type {
  AdvanceResult,
  PlayerState,
  TileAction,
  TileDefinition,
  WinRules,
} from "./types";

export const BOARD_SIZE = 40;

export function loadTiles(): TileDefinition[] {
  return tilesData as TileDefinition[];
}

export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

export function advancePosition(
  current: number,
  steps: number,
  lap: number,
  boardSize: number = BOARD_SIZE,
): AdvanceResult {
  const total = current + steps;
  const position = total % boardSize;
  const lapsCrossed = Math.floor(total / boardSize);

  return {
    position,
    lap: lap + lapsCrossed,
    passedStart: lapsCrossed > 0,
  };
}

export function resolveTile(tile: TileDefinition): TileAction {
  switch (tile.type) {
    case "START":
      return { type: "start" };
    case "VOCABULARY":
    case "GRAMMAR":
    case "READING":
    case "LISTENING":
      return { type: "quiz", category: tile.category! };
    case "BUSINESS_EMAIL":
    case "BUSINESS_MEETING":
      return { type: "quiz", category: "BUSINESS_ENGLISH" };
    case "RANDOM_QUESTION":
      return { type: "quiz", category: "RANDOM" };
    case "BOSS_QUIZ":
      return { type: "quiz", category: tile.category ?? "RANDOM", hard: true };
    case "EXAM_CENTER":
      return { type: "quiz", category: "RANDOM", hard: true };
    case "LUCKY_CARD":
      return { type: "drawCard", deck: "LUCKY" };
    case "EVENT_CARD":
      return { type: "drawCard", deck: "EVENT" };
    case "BONUS":
    case "SALARY":
    case "PROMOTION":
      return { type: "bonus", coins: 200, exp: 25 };
    case "TAX":
      return { type: "tax", coins: 150 };
    case "REST":
      return { type: "rest" };
    case "LIBRARY":
    case "ENGLISH_CAMP":
      return { type: "freeHint" };
    case "MINI_GAME":
      return { type: "miniGame" };
    case "CHALLENGE":
      return { type: "challenge" };
    case "GOLD_CHEST":
      return { type: "chest", tier: "gold" };
    case "DIAMOND_CHEST":
      return { type: "chest", tier: "diamond" };
    case "TREASURE":
      return { type: "chest", tier: "treasure" };
    case "AIRPORT":
    case "HOTEL":
    case "COMPANY":
      return { type: "flavor", effect: "quiz" };
    default:
      return { type: "flavor", effect: "bonus" };
  }
}

export function checkWin(
  players: PlayerState[],
  rules: WinRules,
): string | null {
  const lapWinner = players.find((p) => p.lap >= rules.lapsToWin);
  if (lapWinner) {
    return lapWinner.id;
  }

  if (
    players.length > 0 &&
    players.every((p) => p.turns >= rules.maxTurnsPerPlayer)
  ) {
    let best = players[0];
    for (const player of players) {
      if (player.coins > best.coins) {
        best = player;
      }
    }
    return best.id;
  }

  return null;
}

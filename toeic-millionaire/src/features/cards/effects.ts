import { advancePosition, BOARD_SIZE } from "@/features/game/fsm";
import type { QuestionCategory } from "@/features/game/types";

export type CardEffect =
  | { type: "coins"; amount: number }
  | { type: "exp"; amount: number }
  | { type: "move"; steps: number }
  | { type: "skipTurn" }
  | { type: "freeHint" }
  | {
      type: "bonusQuiz";
      category: QuestionCategory;
      reward: { coins: number; exp: number };
    };

export interface EffectPlayer {
  id: string;
  position: number;
  lap: number;
  coins: number;
  exp: number;
  skipNext: boolean;
}

export interface EffectSession {
  boardSize?: number;
}

export interface GameStatePatch {
  coins?: number;
  exp?: number;
  position?: number;
  lap?: number;
  skipNext?: boolean;
  startBonus?: number;
  freeHint?: boolean;
  bonusQuiz?: {
    category: QuestionCategory;
    reward: { coins: number; exp: number };
  };
}

export interface EffectResult {
  patch: GameStatePatch;
  summary: string;
}

function applyMove(
  position: number,
  lap: number,
  steps: number,
  boardSize: number = BOARD_SIZE,
): { position: number; lap: number; passedStart: boolean } {
  if (steps >= 0) {
    return advancePosition(position, steps, lap, boardSize);
  }

  let pos = position + steps;
  let newLap = lap;
  while (pos < 0) {
    pos += boardSize;
    newLap = Math.max(0, newLap - 1);
  }

  return { position: pos, lap: newLap, passedStart: false };
}

export function applyCardEffect(
  _session: EffectSession,
  player: EffectPlayer,
  effect: CardEffect,
): EffectResult {
  const boardSize = _session.boardSize ?? BOARD_SIZE;
  const patch: GameStatePatch = {};

  switch (effect.type) {
    case "coins": {
      const nextCoins = Math.max(0, player.coins + effect.amount);
      patch.coins = nextCoins;
      return {
        patch,
        summary:
          effect.amount >= 0
            ? `+${effect.amount} coins`
            : `${effect.amount} coins`,
      };
    }
    case "exp": {
      patch.exp = Math.max(0, player.exp + effect.amount);
      return {
        patch,
        summary: effect.amount >= 0 ? `+${effect.amount} EXP` : `${effect.amount} EXP`,
      };
    }
    case "move": {
      const moved = applyMove(player.position, player.lap, effect.steps, boardSize);
      patch.position = moved.position;
      patch.lap = moved.lap;

      let coins = player.coins;
      if (moved.passedStart) {
        coins += 200;
        patch.startBonus = 200;
        patch.coins = coins;
      }

      const direction = effect.steps >= 0 ? "forward" : "back";
      const steps = Math.abs(effect.steps);
      return {
        patch,
        summary:
          moved.passedStart && effect.steps > 0
            ? `Moved ${steps} ${direction} (+200 start bonus)`
            : `Moved ${steps} ${direction}`,
      };
    }
    case "skipTurn": {
      patch.skipNext = true;
      return { patch, summary: "Skip next turn" };
    }
    case "freeHint": {
      patch.freeHint = true;
      return { patch, summary: "Free hint on next quiz" };
    }
    case "bonusQuiz": {
      patch.bonusQuiz = {
        category: effect.category,
        reward: effect.reward,
      };
      return {
        patch,
        summary: `Bonus ${effect.category.toLowerCase()} quiz`,
      };
    }
    default: {
      const _exhaustive: never = effect;
      return _exhaustive;
    }
  }
}

export function mergePatch(
  player: EffectPlayer,
  patch: GameStatePatch,
): EffectPlayer {
  return {
    ...player,
    coins: patch.coins ?? player.coins,
    exp: patch.exp ?? player.exp,
    position: patch.position ?? player.position,
    lap: patch.lap ?? player.lap,
    skipNext: patch.skipNext ?? player.skipNext,
  };
}

import type { CardDeck, PrismaClient } from "@prisma/client";
import { z } from "zod";
import {
  applyCardEffect,
  mergePatch,
  type CardEffect,
  type EffectPlayer,
  type EffectResult,
} from "./effects";

export const drawCardSchema = z.object({
  sessionId: z.string().min(1),
  playerId: z.string().min(1),
  deck: z.enum(["LUCKY", "EVENT"]),
});

export type DrawCardInput = z.infer<typeof drawCardSchema>;

export interface CardDto {
  id: string;
  deck: CardDeck;
  title: string;
  body: string;
  effect: CardEffect;
}

export interface DrawCardResult {
  card: CardDto;
  effectResult: EffectResult;
  player: EffectPlayer;
}

export class CardError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "NOT_ACTIVE" | "NO_CARDS" | "INVALID_EFFECT",
  ) {
    super(message);
    this.name = "CardError";
  }
}

function pickWeightedCard<T extends { weight: number }>(cards: T[]): T {
  const total = cards.reduce((sum, card) => sum + card.weight, 0);
  let roll = Math.random() * total;

  for (const card of cards) {
    roll -= card.weight;
    if (roll <= 0) {
      return card;
    }
  }

  return cards[cards.length - 1];
}

function parseCardEffect(raw: unknown): CardEffect {
  if (!raw || typeof raw !== "object" || !("type" in raw)) {
    throw new CardError("Invalid card effect", "INVALID_EFFECT");
  }

  const effect = raw as CardEffect;
  switch (effect.type) {
    case "coins":
    case "exp":
    case "move":
    case "skipTurn":
    case "freeHint":
    case "bonusQuiz":
      return effect;
    default:
      throw new CardError("Unknown card effect type", "INVALID_EFFECT");
  }
}

export function createCardService(db: PrismaClient) {
  return {
    async drawCard(input: DrawCardInput): Promise<DrawCardResult> {
      const session = await db.gameSession.findUnique({
        where: { id: input.sessionId },
        include: { players: true },
      });

      if (!session) {
        throw new CardError("Session not found", "NOT_FOUND");
      }
      if (session.status !== "ACTIVE") {
        throw new CardError("Game is not active", "NOT_ACTIVE");
      }

      const player = session.players.find((p) => p.id === input.playerId);
      if (!player) {
        throw new CardError("Player not found", "NOT_FOUND");
      }

      const definitions = await db.cardDefinition.findMany({
        where: { deck: input.deck },
      });

      if (definitions.length === 0) {
        throw new CardError("No cards in deck", "NO_CARDS");
      }

      const picked = pickWeightedCard(definitions);
      const effect = parseCardEffect(picked.effect);

      const effectPlayer: EffectPlayer = {
        id: player.id,
        position: player.position,
        lap: player.lap,
        coins: player.coins,
        exp: player.exp,
        skipNext: player.skipNext,
      };

      const effectResult = applyCardEffect({}, effectPlayer, effect);
      const updated = mergePatch(effectPlayer, effectResult.patch);

      await db.$transaction([
        db.gamePlayer.update({
          where: { id: player.id },
          data: {
            coins: updated.coins,
            exp: updated.exp,
            position: updated.position,
            lap: updated.lap,
            skipNext: updated.skipNext,
          },
        }),
        db.cardDraw.create({
          data: {
            sessionId: input.sessionId,
            playerId: player.id,
            cardId: picked.id,
          },
        }),
      ]);

      return {
        card: {
          id: picked.id,
          deck: picked.deck,
          title: picked.title,
          body: picked.body,
          effect,
        },
        effectResult,
        player: updated,
      };
    },
  };
}

export type CardService = ReturnType<typeof createCardService>;

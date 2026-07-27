import type { Difficulty, GameStatus, PrismaClient } from "@prisma/client";
import {
  advancePosition,
  checkWin,
  loadTiles,
  resolveTile,
  rollDice,
} from "./fsm";
import type { TileAction } from "./types";
import { z } from "zod";

export const startGameSchema = z.object({
  guestId: z.string().min(1).optional(),
  displayName: z.string().min(1).max(50),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  botCount: z.number().int().min(1).max(3),
});

export const rollQuerySchema = z.object({
  playerId: z.string().min(1).optional(),
});

export const endGameSchema = z.object({
  reason: z.enum(["completed", "abandoned"]).optional(),
});

export type StartGameInput = z.infer<typeof startGameSchema>;
export type EndGameInput = z.infer<typeof endGameSchema>;

export interface GamePlayerSnapshot {
  id: string;
  displayName: string;
  isBot: boolean;
  position: number;
  lap: number;
  coins: number;
  exp: number;
  skipNext: boolean;
  sortOrder: number;
  turns: number;
}

export interface GameStateSnapshot {
  sessionId: string;
  status: GameStatus;
  difficulty: Difficulty;
  turnCount: number;
  maxTurns: number;
  lapsToWin: number;
  currentIndex: number;
  currentPlayerId: string;
  winnerId: string | null;
  players: GamePlayerSnapshot[];
}

export class GameError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "NOT_ACTIVE" | "NOT_YOUR_TURN" | "ALREADY_ENDED",
  ) {
    super(message);
    this.name = "GameError";
  }
}

type SessionWithRelations = Awaited<
  ReturnType<typeof fetchSession>
>;

const SESSION_INCLUDE = {
  players: { orderBy: { sortOrder: "asc" as const } },
  turns: true,
} as const;

async function fetchSession(db: PrismaClient, sessionId: string) {
  return db.gameSession.findUnique({
    where: { id: sessionId },
    include: SESSION_INCLUDE,
  });
}

function countTurns(playerId: string, turns: { playerId: string }[]): number {
  return turns.filter((t) => t.playerId === playerId).length;
}

function buildSnapshot(session: NonNullable<SessionWithRelations>): GameStateSnapshot {
  const players = session.players.map((p) => ({
    id: p.id,
    displayName: p.displayName,
    isBot: p.isBot,
    position: p.position,
    lap: p.lap,
    coins: p.coins,
    exp: p.exp,
    skipNext: p.skipNext,
    sortOrder: p.sortOrder,
    turns: countTurns(p.id, session.turns),
  }));

  const currentPlayer = session.players[session.currentIndex];
  const winnerId =
    session.status === "COMPLETED"
      ? checkWin(
          players.map((p) => ({
            id: p.id,
            lap: p.lap,
            coins: p.coins,
            turns: p.turns,
          })),
          { lapsToWin: session.lapsToWin, maxTurnsPerPlayer: session.maxTurns },
        )
      : checkWin(
          players.map((p) => ({
            id: p.id,
            lap: p.lap,
            coins: p.coins,
            turns: p.turns,
          })),
          { lapsToWin: session.lapsToWin, maxTurnsPerPlayer: session.maxTurns },
        );

  return {
    sessionId: session.id,
    status: session.status,
    difficulty: session.difficulty,
    turnCount: session.turnCount,
    maxTurns: session.maxTurns,
    lapsToWin: session.lapsToWin,
    currentIndex: session.currentIndex,
    currentPlayerId: currentPlayer?.id ?? "",
    winnerId,
    players,
  };
}

function applyTileEffects(
  tileAction: TileAction,
  coins: number,
  exp: number,
): { coins: number; exp: number; skipNext: boolean } {
  let nextCoins = coins;
  let nextExp = exp;
  let skipNext = false;

  switch (tileAction.type) {
    case "bonus":
      nextCoins += tileAction.coins;
      nextExp += tileAction.exp ?? 0;
      break;
    case "tax":
      nextCoins = Math.max(0, nextCoins - tileAction.coins);
      break;
    case "rest":
      skipNext = true;
      break;
    default:
      break;
  }

  return { coins: nextCoins, exp: nextExp, skipNext };
}

export function createGameService(db: PrismaClient) {
  return {
    async startGame(
      input: StartGameInput,
    ): Promise<{ sessionId: string; state: GameStateSnapshot }> {
      let profileId: string | undefined;

      if (input.guestId) {
        const profile = await db.playerProfile.upsert({
          where: { guestId: input.guestId },
          create: {
            guestId: input.guestId,
            displayName: input.displayName,
          },
          update: {},
        });
        profileId = profile.id;
      }

      const botPlayers = Array.from({ length: input.botCount }, (_, i) => ({
        displayName: `Bot ${i + 1}`,
        isBot: true,
        sortOrder: i + 1,
      }));

      const session = await db.gameSession.create({
        data: {
          difficulty: input.difficulty,
          maxTurns: 30,
          lapsToWin: 2,
          currentIndex: 0,
          players: {
            create: [
              {
                displayName: input.displayName,
                isBot: false,
                sortOrder: 0,
                profileId,
              },
              ...botPlayers,
            ],
          },
        },
        include: SESSION_INCLUDE,
      });

      return { sessionId: session.id, state: buildSnapshot(session) };
    },

    async getState(sessionId: string): Promise<GameStateSnapshot> {
      const session = await fetchSession(db, sessionId);
      if (!session) {
        throw new GameError("Session not found", "NOT_FOUND");
      }
      return buildSnapshot(session);
    },

    async roll(
      sessionId: string,
      playerId?: string,
    ): Promise<{
      dice: number;
      newState: GameStateSnapshot;
      tileAction: TileAction;
      skipped: boolean;
    }> {
      const session = await fetchSession(db, sessionId);
      if (!session) {
        throw new GameError("Session not found", "NOT_FOUND");
      }
      if (session.status !== "ACTIVE") {
        throw new GameError("Game is not active", session.status === "COMPLETED" ? "ALREADY_ENDED" : "NOT_ACTIVE");
      }

      const currentPlayer = session.players[session.currentIndex];
      if (!currentPlayer) {
        throw new GameError("No current player", "NOT_FOUND");
      }

      if (playerId && playerId !== currentPlayer.id) {
        throw new GameError("Not your turn", "NOT_YOUR_TURN");
      }
      if (currentPlayer.isBot && !playerId) {
        throw new GameError("Bot turn requires playerId", "NOT_YOUR_TURN");
      }

      const tiles = loadTiles();
      const nextIndex = (session.currentIndex + 1) % session.players.length;

      if (currentPlayer.skipNext) {
        await db.gamePlayer.update({
          where: { id: currentPlayer.id },
          data: { skipNext: false },
        });
        await db.gameSession.update({
          where: { id: sessionId },
          data: {
            currentIndex: nextIndex,
            turnCount: session.turnCount + 1,
          },
        });

        const updated = await fetchSession(db, sessionId);
        return {
          dice: 0,
          skipped: true,
          tileAction: { type: "rest" },
          newState: buildSnapshot(updated!),
        };
      }

      const dice = rollDice();
      const advance = advancePosition(
        currentPlayer.position,
        dice,
        currentPlayer.lap,
      );
      const tile = tiles[advance.position];
      const tileAction = resolveTile(tile);

      let coins = currentPlayer.coins;
      let exp = currentPlayer.exp;
      if (advance.passedStart) {
        coins += 200;
      }
      const effects = applyTileEffects(tileAction, coins, exp);
      coins = effects.coins;
      exp = effects.exp;

      await db.$transaction([
        db.gamePlayer.update({
          where: { id: currentPlayer.id },
          data: {
            position: advance.position,
            lap: advance.lap,
            coins,
            exp,
            skipNext: effects.skipNext,
          },
        }),
        db.turnLog.create({
          data: {
            sessionId,
            playerId: currentPlayer.id,
            dice,
            fromPos: currentPlayer.position,
            toPos: advance.position,
            tileType: tile.type,
          },
        }),
        db.gameSession.update({
          where: { id: sessionId },
          data: {
            currentIndex: nextIndex,
            turnCount: session.turnCount + 1,
          },
        }),
      ]);

      const updated = await fetchSession(db, sessionId);
      const state = buildSnapshot(updated!);

      const winnerId = checkWin(
        state.players.map((p) => ({
          id: p.id,
          lap: p.lap,
          coins: p.coins,
          turns: p.turns,
        })),
        { lapsToWin: session.lapsToWin, maxTurnsPerPlayer: session.maxTurns },
      );

      if (winnerId) {
        await db.gameSession.update({
          where: { id: sessionId },
          data: { status: "COMPLETED" },
        });
        const final = await fetchSession(db, sessionId);
        return {
          dice,
          skipped: false,
          tileAction,
          newState: { ...buildSnapshot(final!), winnerId },
        };
      }

      return { dice, skipped: false, tileAction, newState: state };
    },

    async endGame(
      sessionId: string,
      input: EndGameInput = {},
    ): Promise<GameStateSnapshot> {
      const session = await fetchSession(db, sessionId);
      if (!session) {
        throw new GameError("Session not found", "NOT_FOUND");
      }
      if (session.status !== "ACTIVE") {
        throw new GameError("Game already ended", "ALREADY_ENDED");
      }

      const status =
        input.reason === "abandoned"
          ? ("ABANDONED" as const)
          : ("COMPLETED" as const);

      await db.gameSession.update({
        where: { id: sessionId },
        data: { status },
      });

      const human = session.players.find((p) => !p.isBot && p.profileId);
      if (human?.profileId) {
        const state = buildSnapshot(session);
        const winnerId = checkWin(
          state.players.map((p) => ({
            id: p.id,
            lap: p.lap,
            coins: p.coins,
            turns: p.turns,
          })),
          { lapsToWin: session.lapsToWin, maxTurnsPerPlayer: session.maxTurns },
        );
        await db.playerProfile.update({
          where: { id: human.profileId },
          data: {
            gamesPlayed: { increment: 1 },
            ...(winnerId === human.id ? { gamesWon: { increment: 1 } } : {}),
          },
        });
      }

      const updated = await fetchSession(db, sessionId);
      return buildSnapshot(updated!);
    },
  };
}

export type GameService = ReturnType<typeof createGameService>;

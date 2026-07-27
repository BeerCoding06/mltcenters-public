import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { createGameService, GameError } from "./game-service";

const SESSION_ID = "session-1";
const HUMAN_ID = "player-human";
const BOT_ID = "player-bot";

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: SESSION_ID,
    status: "ACTIVE" as const,
    difficulty: "MEDIUM" as const,
    turnCount: 0,
    maxTurns: 30,
    lapsToWin: 2,
    currentIndex: 0,
    players: [
      {
        id: HUMAN_ID,
        displayName: "Alice",
        isBot: false,
        position: 0,
        lap: 0,
        coins: 1500,
        exp: 0,
        skipNext: false,
        sortOrder: 0,
        profileId: "profile-1",
      },
      {
        id: BOT_ID,
        displayName: "Bot 1",
        isBot: true,
        position: 0,
        lap: 0,
        coins: 1500,
        exp: 0,
        skipNext: false,
        sortOrder: 1,
        profileId: null,
      },
    ],
    turns: [],
    ...overrides,
  };
}

function createMockDb() {
  let session = makeSession();

  const db = {
    playerProfile: {
      upsert: vi.fn().mockResolvedValue({ id: "profile-1" }),
      update: vi.fn().mockResolvedValue({}),
    },
    gameSession: {
      create: vi.fn().mockImplementation(({ data }) => {
        session = makeSession({
          difficulty: data.difficulty,
          players: [
            {
              id: HUMAN_ID,
              displayName: data.players.create[0].displayName,
              isBot: false,
              position: 0,
              lap: 0,
              coins: 1500,
              exp: 0,
              skipNext: false,
              sortOrder: 0,
              profileId: data.players.create[0].profileId ?? null,
            },
            ...data.players.create.slice(1).map(
              (b: { displayName: string; sortOrder: number }, i: number) => ({
                id: `bot-${i}`,
                displayName: b.displayName,
                isBot: true,
                position: 0,
                lap: 0,
                coins: 1500,
                exp: 0,
                skipNext: false,
                sortOrder: b.sortOrder,
                profileId: null,
              }),
            ),
          ],
        });
        return Promise.resolve(session);
      }),
      findUnique: vi.fn().mockImplementation(() => Promise.resolve(session)),
      update: vi.fn().mockImplementation(({ data }) => {
        session = { ...session, ...data };
        return Promise.resolve(session);
      }),
    },
    gamePlayer: {
      update: vi.fn().mockImplementation(({ where, data }) => {
        session.players = session.players.map((p) =>
          p.id === where.id ? { ...p, ...data } : p,
        );
        return Promise.resolve(session.players.find((p) => p.id === where.id));
      }),
    },
    turnLog: {
      create: vi.fn().mockImplementation(({ data }) => {
        const log = { id: `turn-${session.turns.length}`, ...data };
        session.turns.push(log);
        return Promise.resolve(log);
      }),
    },
    $transaction: vi.fn().mockImplementation((ops) => Promise.all(ops)),
  };

  return { db: db as unknown as PrismaClient, getSession: () => session, setSession: (s: typeof session) => { session = s; } };
}

describe("createGameService", () => {
  let mock: ReturnType<typeof createMockDb>;
  let service: ReturnType<typeof createGameService>;

  beforeEach(() => {
    mock = createMockDb();
    service = createGameService(mock.db);
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  describe("startGame", () => {
    it("creates session with human and bots", async () => {
      const result = await service.startGame({
        displayName: "Alice",
        difficulty: "MEDIUM",
        botCount: 2,
      });

      expect(result.sessionId).toBe(SESSION_ID);
      expect(result.state.players).toHaveLength(3);
      expect(result.state.players[0].displayName).toBe("Alice");
      expect(result.state.players[1].isBot).toBe(true);
      expect(result.state.currentPlayerId).toBe(HUMAN_ID);
    });

    it("upserts guest profile when guestId provided", async () => {
      await service.startGame({
        guestId: "guest-abc",
        displayName: "Alice",
        difficulty: "EASY",
        botCount: 1,
      });

      expect(mock.db.playerProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { guestId: "guest-abc" } }),
      );
    });
  });

  describe("getState", () => {
    it("returns snapshot for existing session", async () => {
      const state = await service.getState(SESSION_ID);
      expect(state.sessionId).toBe(SESSION_ID);
      expect(state.players).toHaveLength(2);
    });

    it("throws NOT_FOUND for missing session", async () => {
      mock.db.gameSession.findUnique = vi.fn().mockResolvedValue(null);
      await expect(service.getState("missing")).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("roll", () => {
    it("rolls dice, advances player, logs turn", async () => {
      const result = await service.roll(SESSION_ID);

      expect(result.dice).toBe(4);
      expect(result.skipped).toBe(false);
      expect(result.tileAction.type).toBe("quiz");
      expect(mock.db.turnLog.create).toHaveBeenCalled();
      expect(result.newState.currentPlayerId).toBe(BOT_ID);
    });

    it("rejects roll when not current player", async () => {
      await expect(service.roll(SESSION_ID, BOT_ID)).rejects.toMatchObject({
        code: "NOT_YOUR_TURN",
      });
    });

    it("requires playerId on bot turn", async () => {
      mock.setSession(makeSession({ currentIndex: 1 }));
      await expect(service.roll(SESSION_ID)).rejects.toMatchObject({
        code: "NOT_YOUR_TURN",
      });
    });

    it("skips turn when skipNext is set", async () => {
      const s = makeSession();
      s.players[0].skipNext = true;
      mock.setSession(s);

      const result = await service.roll(SESSION_ID);
      expect(result.skipped).toBe(true);
      expect(result.dice).toBe(0);
      expect(result.newState.currentPlayerId).toBe(BOT_ID);
    });

    it("throws when session not active", async () => {
      mock.setSession(makeSession({ status: "COMPLETED" }));
      await expect(service.roll(SESSION_ID)).rejects.toBeInstanceOf(GameError);
    });
  });

  describe("endGame", () => {
    it("marks session completed and updates profile stats", async () => {
      const state = await service.endGame(SESSION_ID);
      expect(state.status).toBe("COMPLETED");
      expect(mock.db.playerProfile.update).toHaveBeenCalled();
    });

    it("marks session abandoned when requested", async () => {
      const state = await service.endGame(SESSION_ID, { reason: "abandoned" });
      expect(state.status).toBe("ABANDONED");
    });

    it("throws when already ended", async () => {
      mock.setSession(makeSession({ status: "COMPLETED" }));
      await expect(service.endGame(SESSION_ID)).rejects.toMatchObject({
        code: "ALREADY_ENDED",
      });
    });
  });
});

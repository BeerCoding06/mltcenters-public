import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import {
  adjustDifficulty,
  computeQuizRewards,
  consecutiveCorrectStreak,
  consecutiveWrongStreak,
  gradeChoice,
  nextStreakAfterAnswer,
} from "./grade";
import { createQuizService, QuizError } from "./quiz-service";

describe("grade", () => {
  it("grades correct choice", () => {
    const choices = [
      { id: "a", isCorrect: false },
      { id: "b", isCorrect: true },
    ];
    expect(gradeChoice(choices, "b")).toBe(true);
    expect(gradeChoice(choices, "a")).toBe(false);
  });

  it("returns false for unknown choice", () => {
    expect(gradeChoice([{ id: "a", isCorrect: true }], "missing")).toBe(false);
  });

  it("awards standard rewards on correct answer", () => {
    expect(computeQuizRewards(true, false, 1500)).toEqual({
      coinsDelta: 150,
      expDelta: 25,
      skipNext: false,
    });
  });

  it("doubles rewards on boss correct answer", () => {
    expect(computeQuizRewards(true, true, 1500)).toEqual({
      coinsDelta: 300,
      expDelta: 50,
      skipNext: false,
    });
  });

  it("penalizes wrong answer without going below zero coins", () => {
    expect(computeQuizRewards(false, false, 1500)).toEqual({
      coinsDelta: -75,
      expDelta: 0,
      skipNext: true,
    });
    expect(computeQuizRewards(false, false, 40)).toEqual({
      coinsDelta: -40,
      expDelta: 0,
      skipNext: true,
    });
  });

  it("counts consecutive correct streak from most recent", () => {
    const attempts = [
      { isCorrect: true },
      { isCorrect: true },
      { isCorrect: false },
      { isCorrect: true },
    ];
    expect(consecutiveCorrectStreak(attempts)).toBe(2);
    expect(consecutiveWrongStreak(attempts)).toBe(0);
  });

  it("counts consecutive wrong streak from most recent", () => {
    const attempts = [{ isCorrect: false }, { isCorrect: false }, { isCorrect: true }];
    expect(consecutiveWrongStreak(attempts)).toBe(2);
  });

  it("bumps difficulty up after 3 correct in a row", () => {
    const attempts = [{ isCorrect: true }, { isCorrect: true }, { isCorrect: true }];
    expect(adjustDifficulty("EASY", attempts)).toBe("MEDIUM");
    expect(adjustDifficulty("MEDIUM", attempts)).toBe("HARD");
    expect(adjustDifficulty("HARD", attempts)).toBe("HARD");
  });

  it("bumps difficulty down after 2 wrong in a row", () => {
    const attempts = [{ isCorrect: false }, { isCorrect: false }];
    expect(adjustDifficulty("HARD", attempts)).toBe("MEDIUM");
    expect(adjustDifficulty("MEDIUM", attempts)).toBe("EASY");
    expect(adjustDifficulty("EASY", attempts)).toBe("EASY");
  });

  it("computes streak after answer", () => {
    expect(nextStreakAfterAnswer([{ isCorrect: true }, { isCorrect: true }], true)).toBe(3);
    expect(nextStreakAfterAnswer([{ isCorrect: true }], false)).toBe(0);
  });
});

const SESSION_ID = "session-1";
const PLAYER_ID = "player-1";
const QUESTION_ID = "q-1";

function makeQuestion(overrides: Record<string, unknown> = {}) {
  return {
    id: QUESTION_ID,
    category: "VOCABULARY" as const,
    type: "MCQ" as const,
    difficulty: "MEDIUM" as const,
    stem: "Choose the best word",
    passage: null,
    audioUrl: null,
    explanation: "Because B fits the context.",
    active: true,
    choices: [
      { id: "c1", label: "A", isCorrect: false, sortOrder: 0 },
      { id: "c2", label: "B", isCorrect: true, sortOrder: 1 },
    ],
    ...overrides,
  };
}

function createMockDb() {
  let sessionDifficulty: "EASY" | "MEDIUM" | "HARD" = "MEDIUM";
  let player = {
    id: PLAYER_ID,
    sessionId: SESSION_ID,
    coins: 1500,
    exp: 0,
    skipNext: false,
  };
  const attempts: Array<{
    id: string;
    sessionId: string;
    playerId: string;
    questionId: string;
    isCorrect: boolean;
    responseMs: number;
    createdAt: Date;
  }> = [];
  const questions = [makeQuestion()];

  const db = {
    gameSession: {
      findUnique: vi.fn().mockImplementation(({ where }) =>
        Promise.resolve(
          where.id === SESSION_ID
            ? { id: SESSION_ID, status: "ACTIVE", difficulty: sessionDifficulty }
            : null,
        ),
      ),
      update: vi.fn().mockImplementation(({ data }) => {
        if (data.difficulty) {
          sessionDifficulty = data.difficulty;
        }
        return Promise.resolve({ id: SESSION_ID, difficulty: sessionDifficulty });
      }),
    },
    gamePlayer: {
      findFirst: vi.fn().mockImplementation(({ where }) =>
        Promise.resolve(
          where.sessionId === SESSION_ID && where.id === PLAYER_ID ? player : null,
        ),
      ),
      update: vi.fn().mockImplementation(({ data }) => {
        player = {
          ...player,
          coins: data.coins ?? player.coins,
          exp: data.exp ?? player.exp,
          skipNext: data.skipNext ?? player.skipNext,
        };
        return Promise.resolve(player);
      }),
    },
    question: {
      findMany: vi.fn().mockImplementation(({ where }) => {
        const attemptedIds = where.id?.notIn ?? [];
        const filtered = questions.filter((q) => {
          if (!q.active) return false;
          if (attemptedIds.includes(q.id)) return false;
          if (where.difficulty && q.difficulty !== where.difficulty) return false;
          if (where.category && q.category !== where.category) return false;
          return true;
        });
        return Promise.resolve(filtered);
      }),
      findUnique: vi.fn().mockImplementation(({ where }) =>
        Promise.resolve(questions.find((q) => q.id === where.id) ?? null),
      ),
    },
    quizAttempt: {
      findMany: vi.fn().mockImplementation(({ where, orderBy }) => {
        let rows = attempts.filter(
          (a) =>
            a.sessionId === where.sessionId &&
            (!where.playerId || a.playerId === where.playerId),
        );
        if (orderBy?.createdAt === "desc") {
          rows = [...rows].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        }
        return Promise.resolve(rows);
      }),
      create: vi.fn().mockImplementation(({ data }) => {
        const row = {
          id: `attempt-${attempts.length}`,
          ...data,
          createdAt: new Date(),
        };
        attempts.unshift(row);
        return Promise.resolve(row);
      }),
    },
    $transaction: vi.fn().mockImplementation((ops) => Promise.all(ops)),
  };

  return {
    db: db as unknown as PrismaClient,
    getPlayer: () => player,
    getAttempts: () => attempts,
    getSessionDifficulty: () => sessionDifficulty,
  };
}

describe("createQuizService", () => {
  let mock: ReturnType<typeof createMockDb>;
  let service: ReturnType<typeof createQuizService>;

  beforeEach(() => {
    mock = createMockDb();
    service = createQuizService(mock.db);
    vi.spyOn(Math, "random").mockReturnValue(0);
  });

  describe("getNextQuestion", () => {
    it("returns question without isCorrect on choices", async () => {
      const result = await service.getNextQuestion({
        sessionId: SESSION_ID,
        category: "VOCABULARY",
        difficulty: "MEDIUM",
      });

      expect(result.questionId).toBe(QUESTION_ID);
      expect(result.stem).toBe("Choose the best word");
      expect(result.quizType).toBe("mcq");
      expect(result.choices).toEqual([
        { id: "c1", label: "A" },
        { id: "c2", label: "B" },
      ]);
      expect(JSON.stringify(result)).not.toContain("isCorrect");
    });

    it("throws when session not found", async () => {
      await expect(
        service.getNextQuestion({
          sessionId: "missing",
          category: "VOCABULARY",
          difficulty: "MEDIUM",
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });
  });

  describe("submitAnswer", () => {
    it("grades correct answer and updates player", async () => {
      const result = await service.submitAnswer({
        sessionId: SESSION_ID,
        playerId: PLAYER_ID,
        questionId: QUESTION_ID,
        choiceId: "c2",
        responseMs: 1200,
      });

      expect(result.isCorrect).toBe(true);
      expect(result.coinsDelta).toBe(150);
      expect(result.expDelta).toBe(25);
      expect(result.explanation).toBe("Because B fits the context.");
      expect(result.streak).toBe(1);
      expect(mock.getPlayer().coins).toBe(1650);
      expect(mock.getPlayer().exp).toBe(25);
    });

    it("applies boss multiplier when isBoss is true", async () => {
      const result = await service.submitAnswer({
        sessionId: SESSION_ID,
        playerId: PLAYER_ID,
        questionId: QUESTION_ID,
        choiceId: "c2",
        responseMs: 800,
        isBoss: true,
      });

      expect(result.coinsDelta).toBe(300);
      expect(result.expDelta).toBe(50);
    });

    it("penalizes wrong answer and sets skipNext", async () => {
      const result = await service.submitAnswer({
        sessionId: SESSION_ID,
        playerId: PLAYER_ID,
        questionId: QUESTION_ID,
        choiceId: "c1",
        responseMs: 3000,
      });

      expect(result.isCorrect).toBe(false);
      expect(result.coinsDelta).toBe(-75);
      expect(result.streak).toBe(0);
      expect(mock.getPlayer().skipNext).toBe(true);
    });

    it("raises difficulty after 3 correct answers", async () => {
      await service.submitAnswer({
        sessionId: SESSION_ID,
        playerId: PLAYER_ID,
        questionId: QUESTION_ID,
        choiceId: "c2",
        responseMs: 1000,
      });
      await service.submitAnswer({
        sessionId: SESSION_ID,
        playerId: PLAYER_ID,
        questionId: QUESTION_ID,
        choiceId: "c2",
        responseMs: 1000,
      });
      await service.submitAnswer({
        sessionId: SESSION_ID,
        playerId: PLAYER_ID,
        questionId: QUESTION_ID,
        choiceId: "c2",
        responseMs: 1000,
      });

      expect(mock.getSessionDifficulty()).toBe("HARD");
    });

    it("throws for invalid player", async () => {
      await expect(
        service.submitAnswer({
          sessionId: SESSION_ID,
          playerId: "unknown",
          questionId: QUESTION_ID,
          choiceId: "c2",
          responseMs: 500,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("throws for unknown question", async () => {
      await expect(
        service.submitAnswer({
          sessionId: SESSION_ID,
          playerId: PLAYER_ID,
          questionId: "missing",
          choiceId: "c2",
          responseMs: 500,
        }),
      ).rejects.toBeInstanceOf(QuizError);
    });
  });
});

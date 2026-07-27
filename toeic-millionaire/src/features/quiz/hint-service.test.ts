import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import type { OpenAIClient } from "@/features/ai/openai-client";
import {
  createHintService,
  HINT_COST,
  HINT_SYSTEM_PROMPT,
  HintError,
  sanitizeLlmText,
  EXPLANATION_SYSTEM_PROMPT,
} from "./hint-service";

const SESSION_ID = "session-1";
const PLAYER_ID = "player-1";
const QUESTION_ID = "q-1";

const questionWithChoices = {
  id: QUESTION_ID,
  stem: "Choose the best word.",
  passage: null as string | null,
  explanation: "Use 'how' to ask about condition.",
  hint: null as string | null,
  choices: [
    { id: "c-a", label: "how", isCorrect: true, sortOrder: 0 },
    { id: "c-b", label: "what", isCorrect: false, sortOrder: 1 },
  ],
};

function createMockDb(initialCoins = 1500) {
  let player = {
    id: PLAYER_ID,
    sessionId: SESSION_ID,
    coins: initialCoins,
  };
  let question = {
    ...questionWithChoices,
    choices: [...questionWithChoices.choices],
  };

  const db = {
    gameSession: {
      findUnique: vi.fn(async () => ({
        id: SESSION_ID,
        status: "ACTIVE",
      })),
    },
    gamePlayer: {
      findFirst: vi.fn(async () => player),
      update: vi.fn(async ({ data }: { data: { coins?: number } }) => {
        if (data.coins !== undefined) {
          player = { ...player, coins: data.coins };
        }
        return player;
      }),
    },
    question: {
      findUnique: vi.fn(async () => question),
      update: vi.fn(async ({ data }: { data: { hint?: string } }) => {
        question = { ...question, hint: data.hint ?? question.hint };
        return question;
      }),
    },
  };

  return {
    db: db as unknown as PrismaClient,
    getPlayer: () => player,
    getQuestion: () => question,
    setQuestionHint(hint: string | null) {
      question = { ...question, hint };
    },
  };
}

function createMockLlm(response: string): OpenAIClient {
  return {
    chatCompletion: vi.fn().mockResolvedValue(response),
  };
}

describe("hint-service", () => {
  let mock: ReturnType<typeof createMockDb>;
  let llm: OpenAIClient;

  beforeEach(() => {
    mock = createMockDb();
    llm = createMockLlm(JSON.stringify({ hint: "ลองคิดถึงคำถามเกี่ยวกับสภาพ" }));
    vi.stubEnv("OPENAI_API_KEY", "test-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("requestHint", () => {
    it("returns cached hint and deducts coins", async () => {
      mock.setQuestionHint("Think about question words.");

      const service = createHintService(mock.db, llm);
      const result = await service.requestHint({
        questionId: QUESTION_ID,
        sessionId: SESSION_ID,
        playerId: PLAYER_ID,
      });

      expect(result).toEqual({
        hint: "Think about question words.",
        coinsDelta: -HINT_COST,
      });
      expect(mock.getPlayer().coins).toBe(1500 - HINT_COST);
      expect(llm.chatCompletion).not.toHaveBeenCalled();
    });

    it("calls LLM on cache miss, persists hint, and deducts coins", async () => {
      const service = createHintService(mock.db, llm);
      const result = await service.requestHint({
        questionId: QUESTION_ID,
        sessionId: SESSION_ID,
        playerId: PLAYER_ID,
      });

      expect(result.hint).toBe("ลองคิดถึงคำถามเกี่ยวกับสภาพ");
      expect(result.coinsDelta).toBe(-HINT_COST);
      expect(llm.chatCompletion).toHaveBeenCalledWith({
        system: HINT_SYSTEM_PROMPT,
        user: expect.stringContaining("Choose the best word"),
      });
      expect(mock.db.question.update).toHaveBeenCalledOnce();
      expect(mock.getQuestion().hint).toBe("ลองคิดถึงคำถามเกี่ยวกับสภาพ");
    });

    it("does not send isCorrect to LLM payload", async () => {
      const service = createHintService(mock.db, llm);
      await service.requestHint({
        questionId: QUESTION_ID,
        sessionId: SESSION_ID,
        playerId: PLAYER_ID,
      });

      const payload = JSON.parse(
        vi.mocked(llm.chatCompletion).mock.calls[0][0].user,
      );
      expect(payload.choices[0]).toEqual({
        choiceId: "c-a",
        label: "how",
      });
      expect(payload.choices[0]).not.toHaveProperty("isCorrect");
    });

    it("throws INSUFFICIENT_COINS when player cannot afford hint", async () => {
      mock = createMockDb(3);
      const service = createHintService(mock.db, llm);

      await expect(
        service.requestHint({
          questionId: QUESTION_ID,
          sessionId: SESSION_ID,
          playerId: PLAYER_ID,
        }),
      ).rejects.toMatchObject({ code: "INSUFFICIENT_COINS" });
    });

    it("throws NOT_FOUND when question is missing", async () => {
      vi.mocked(mock.db.question.findUnique).mockResolvedValue(null);
      const service = createHintService(mock.db, llm);

      await expect(
        service.requestHint({
          questionId: "missing",
          sessionId: SESSION_ID,
          playerId: PLAYER_ID,
        }),
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    });

    it("uses fallback hint when no cache and no LLM key", async () => {
      vi.unstubAllEnvs();
      const service = createHintService(mock.db, llm);
      const result = await service.requestHint({
        questionId: QUESTION_ID,
        sessionId: SESSION_ID,
        playerId: PLAYER_ID,
      });

      expect(result.hint).toContain("ลองอ่านประโยค");
      expect(llm.chatCompletion).not.toHaveBeenCalled();
    });
  });

  describe("enrichExplanation", () => {
    it("returns LLM explanation when key is configured", async () => {
      llm = createMockLlm(
        JSON.stringify({
          explanationTh: "ใช้ how เพื่อถามเกี่ยวกับสภาพ how asks about condition",
        }),
      );
      const service = createHintService(mock.db, llm);

      const result = await service.enrichExplanation({
        questionId: QUESTION_ID,
        choiceId: "c-a",
        isCorrect: true,
        fallbackExplanation: "Use 'how' to ask about condition.",
      });

      expect(result).toContain("how");
      expect(llm.chatCompletion).toHaveBeenCalledWith({
        system: EXPLANATION_SYSTEM_PROMPT,
        user: expect.stringContaining("Use 'how' to ask about condition."),
      });
    });

    it("falls back to question explanation when no LLM key", async () => {
      vi.unstubAllEnvs();
      const service = createHintService(mock.db, llm);

      const result = await service.enrichExplanation({
        questionId: QUESTION_ID,
        choiceId: "c-b",
        isCorrect: false,
        fallbackExplanation: "Use 'how' to ask about condition.",
      });

      expect(result).toBe("Use 'how' to ask about condition.");
      expect(llm.chatCompletion).not.toHaveBeenCalled();
    });

    it("falls back when LLM returns invalid JSON", async () => {
      llm = createMockLlm("not-json");
      const service = createHintService(mock.db, llm);

      const result = await service.enrichExplanation({
        questionId: QUESTION_ID,
        choiceId: "c-a",
        isCorrect: true,
        fallbackExplanation: "Use 'how' to ask about condition.",
      });

      expect(result).toBe("Use 'how' to ask about condition.");
    });
  });
});

describe("sanitizeLlmText", () => {
  it("strips choice letter leaks", () => {
    expect(sanitizeLlmText("The correct answer is B for this stem.")).toBe(
      "The for this stem.",
    );
    expect(sanitizeLlmText("Choice A is wrong here.")).toBe("is wrong here.");
  });
});

describe("HintError", () => {
  it("exposes error code", () => {
    const err = new HintError("fail", "LLM_FAILED");
    expect(err.code).toBe("LLM_FAILED");
    expect(err.name).toBe("HintError");
  });
});

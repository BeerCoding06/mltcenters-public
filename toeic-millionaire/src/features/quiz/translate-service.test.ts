import { describe, it, expect, vi, beforeEach } from "vitest";
import type { PrismaClient } from "@prisma/client";
import type { OpenAIClient } from "@/features/ai/openai-client";
import {
  createTranslateService,
  TranslateError,
  TRANSLATE_SYSTEM_PROMPT,
} from "./translate-service";

const QUESTION_ID = "q-1";

const questionWithChoices = {
  id: QUESTION_ID,
  stem: "Choose the best answer.",
  passage: "The meeting starts at nine.",
  stemTh: null as string | null,
  passageTh: null as string | null,
  choices: [
    { id: "c-a", label: "Option A", sortOrder: 0 },
    { id: "c-b", label: "Option B", sortOrder: 1 },
  ],
  translation: null as {
    stemTh: string;
    passageTh: string | null;
    choicesTh: unknown;
  } | null,
};

function createMockDb() {
  let question = { ...questionWithChoices, choices: [...questionWithChoices.choices] };
  let translationRecord: typeof questionWithChoices.translation = null;

  const db = {
    question: {
      findUnique: vi.fn(async () => ({
        ...question,
        translation: translationRecord,
      })),
    },
    questionTranslation: {
      create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
        translationRecord = {
          stemTh: data.stemTh as string,
          passageTh: (data.passageTh as string | null) ?? null,
          choicesTh: data.choicesTh,
        };
        return { id: "tr-1", ...translationRecord };
      }),
    },
  };

  return {
    db: db as unknown as PrismaClient,
    setTranslation(record: NonNullable<typeof translationRecord>) {
      translationRecord = record;
    },
    getCreatedTranslation() {
      return translationRecord;
    },
    resetQuestion() {
      question = {
        ...questionWithChoices,
        choices: [...questionWithChoices.choices],
      };
      translationRecord = null;
    },
  };
}

function createMockLlm(response: string): OpenAIClient {
  return {
    chatCompletion: vi.fn().mockResolvedValue(response),
  };
}

describe("translate-service", () => {
  let mock: ReturnType<typeof createMockDb>;
  let llm: OpenAIClient;

  beforeEach(() => {
    mock = createMockDb();
    llm = createMockLlm(
      JSON.stringify({
        stemTh: "เลือกคำตอบที่ดีที่สุด",
        passageTh: "การประชุมเริ่มต้นเว้าเก้า",
        choicesTh: [
          { choiceId: "c-a", labelTh: "ตัวเลือก A" },
          { choiceId: "c-b", labelTh: "ตัวเลือก B" },
        ],
      }),
    );
  });

  it("returns cached QuestionTranslation without calling LLM", async () => {
    mock.setTranslation({
      stemTh: "คำถามแปลแล้ว",
      passageTh: "บทความแปลแล้ว",
      choicesTh: [{ choiceId: "c-a", labelTh: "ตัวเลือก A" }],
    });

    const service = createTranslateService(mock.db, llm);
    const result = await service.translateQuestion(QUESTION_ID);

    expect(result).toEqual({
      stemTh: "คำถามแปลแล้ว",
      passageTh: "บทความแปลแล้ว",
      choicesTh: [{ choiceId: "c-a", labelTh: "ตัวเลือก A" }],
    });
    expect(llm.chatCompletion).not.toHaveBeenCalled();
    expect(mock.db.questionTranslation.create).not.toHaveBeenCalled();
  });

  it("calls LLM on cache miss and persists translation", async () => {
    const service = createTranslateService(mock.db, llm);
    const result = await service.translateQuestion(QUESTION_ID);

    expect(result.stemTh).toBe("เลือกคำตอบที่ดีที่สุด");
    expect(result.choicesTh).toHaveLength(2);
    expect(llm.chatCompletion).toHaveBeenCalledWith({
      system: TRANSLATE_SYSTEM_PROMPT,
      user: expect.stringContaining("Choose the best answer"),
    });
    expect(mock.db.questionTranslation.create).toHaveBeenCalledOnce();
    expect(mock.getCreatedTranslation()?.stemTh).toBe("เลือกคำตอบที่ดีที่สุด");
  });

  it("does not send isCorrect to LLM payload", async () => {
    const service = createTranslateService(mock.db, llm);
    await service.translateQuestion(QUESTION_ID);

    const payload = JSON.parse(
      vi.mocked(llm.chatCompletion).mock.calls[0][0].user,
    );
    expect(payload.choices[0]).toEqual({
      choiceId: "c-a",
      label: "Option A",
    });
    expect(payload.choices[0]).not.toHaveProperty("isCorrect");
  });

  it("throws NOT_FOUND when question is missing", async () => {
    vi.mocked(mock.db.question.findUnique).mockResolvedValue(null);
    const service = createTranslateService(mock.db, llm);

    await expect(service.translateQuestion("missing")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("throws LLM_FAILED when LLM returns invalid JSON", async () => {
    llm = createMockLlm("not-json");
    const service = createTranslateService(mock.db, llm);

    await expect(service.translateQuestion(QUESTION_ID)).rejects.toMatchObject({
      code: "LLM_FAILED",
    });
    expect(mock.db.questionTranslation.create).not.toHaveBeenCalled();
  });
});

describe("TranslateError", () => {
  it("exposes error code", () => {
    const err = new TranslateError("fail", "INVALID_RESPONSE");
    expect(err.code).toBe("INVALID_RESPONSE");
    expect(err.name).toBe("TranslateError");
  });
});

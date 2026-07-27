import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import type { OpenAIClient } from "@/features/ai/openai-client";

export const TRANSLATE_SYSTEM_PROMPT = `You translate TOEIC exam content from English to Thai for learners.
Return ONLY JSON: {"stemTh":"...","passageTh":"...|null","choicesTh":[{"choiceId":"...","labelTh":"..."}]}
Do NOT reveal which choice is correct. Do NOT add explanations.`;

const choiceTranslationSchema = z.object({
  choiceId: z.string(),
  labelTh: z.string(),
});

const llmTranslationSchema = z.object({
  stemTh: z.string(),
  passageTh: z.string().nullable().optional(),
  choicesTh: z.array(choiceTranslationSchema),
});

export interface TranslationChoice {
  choiceId: string;
  labelTh: string;
}

export interface TranslationResult {
  stemTh: string;
  passageTh?: string | null;
  choicesTh: TranslationChoice[];
}

export class TranslateError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "LLM_FAILED" | "INVALID_RESPONSE",
  ) {
    super(message);
    this.name = "TranslateError";
  }
}

function parseCachedChoices(choicesTh: unknown): TranslationChoice[] {
  return z.array(choiceTranslationSchema).parse(choicesTh);
}

function toTranslationResult(data: {
  stemTh: string;
  passageTh: string | null;
  choicesTh: unknown;
}): TranslationResult {
  return {
    stemTh: data.stemTh,
    passageTh: data.passageTh,
    choicesTh: parseCachedChoices(data.choicesTh),
  };
}

function extractJson(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const payload = fenced?.[1]?.trim() ?? trimmed;
  return JSON.parse(payload);
}

function normalizePassageTh(value: string | null | undefined): string | null {
  if (value == null || value === "null" || value.trim() === "") {
    return null;
  }
  return value;
}

export function createTranslateService(db: PrismaClient, llm: OpenAIClient) {
  return {
    async translateQuestion(questionId: string): Promise<TranslationResult> {
      const question = await db.question.findUnique({
        where: { id: questionId },
        include: {
          choices: { orderBy: { sortOrder: "asc" } },
          translation: true,
        },
      });

      if (!question) {
        throw new TranslateError("Question not found", "NOT_FOUND");
      }

      if (question.translation) {
        return toTranslationResult(question.translation);
      }

      const userPayload = {
        stem: question.stem,
        passage: question.passage,
        choices: question.choices.map((choice) => ({
          choiceId: choice.id,
          label: choice.label,
        })),
      };

      let parsed: z.infer<typeof llmTranslationSchema>;
      try {
        const raw = await llm.chatCompletion({
          system: TRANSLATE_SYSTEM_PROMPT,
          user: JSON.stringify(userPayload),
        });
        parsed = llmTranslationSchema.parse(extractJson(raw));
      } catch {
        throw new TranslateError("Translation failed", "LLM_FAILED");
      }

      const result: TranslationResult = {
        stemTh: parsed.stemTh,
        passageTh: normalizePassageTh(parsed.passageTh),
        choicesTh: parsed.choicesTh,
      };

      await db.questionTranslation.create({
        data: {
          questionId,
          stemTh: result.stemTh,
          passageTh: result.passageTh,
          choicesTh: result.choicesTh,
          source: "llm",
        },
      });

      return result;
    },
  };
}

export type TranslateService = ReturnType<typeof createTranslateService>;

import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import type { OpenAIClient } from "@/features/ai/openai-client";
import { OpenAIError } from "@/features/ai/openai-client";

export const HINT_COST = 5;

export const requestHintSchema = z.object({
  questionId: z.string().min(1),
  sessionId: z.string().min(1),
  playerId: z.string().min(1),
});

export type RequestHintInput = z.infer<typeof requestHintSchema>;

export const HINT_SYSTEM_PROMPT = `You give subtle TOEIC quiz hints in Thai.
Return ONLY JSON: {"hint":"..."}
Do NOT reveal the correct answer. Do NOT mention choice letters (A, B, C, D, E).
Keep hints to 1-2 short sentences.`;

export const EXPLANATION_SYSTEM_PROMPT = `You explain TOEIC quiz answers for Thai learners.
Return ONLY JSON: {"explanationTh":"..."}
Use 2-4 short sentences mixing Thai and English.
Do NOT change which answer is correct. Do NOT mention choice letters (A, B, C, D, E).`;

const hintResponseSchema = z.object({
  hint: z.string().min(1),
});

const explanationResponseSchema = z.object({
  explanationTh: z.string().min(1),
});

export class HintError extends Error {
  constructor(
    message: string,
    public code:
      | "NOT_FOUND"
      | "NOT_ACTIVE"
      | "INSUFFICIENT_COINS"
      | "LLM_FAILED",
  ) {
    super(message);
    this.name = "HintError";
  }
}

function extractJson(content: string): unknown {
  const trimmed = content.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const payload = fenced?.[1]?.trim() ?? trimmed;
  return JSON.parse(payload);
}

export function sanitizeLlmText(text: string): string {
  return text
    .replace(/\b(?:correct answer is|the answer is|answer:)\s*[A-E]\b/gi, "")
    .replace(/\bchoice\s+[A-E]\b/gi, "")
    .replace(/\b(?:option|ตัวเลือก)\s+[A-E]\b/gi, "")
    .replace(/\b[A-E]\b/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function hasLlmKey(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function createHintService(db: PrismaClient, llm: OpenAIClient) {
  return {
    async requestHint(
      input: RequestHintInput,
    ): Promise<{ hint: string; coinsDelta: number }> {
      const session = await db.gameSession.findUnique({
        where: { id: input.sessionId },
      });
      if (!session) {
        throw new HintError("Session not found", "NOT_FOUND");
      }
      if (session.status !== "ACTIVE") {
        throw new HintError("Session is not active", "NOT_ACTIVE");
      }

      const player = await db.gamePlayer.findFirst({
        where: { id: input.playerId, sessionId: input.sessionId },
      });
      if (!player) {
        throw new HintError("Player not found", "NOT_FOUND");
      }
      if (player.coins < HINT_COST) {
        throw new HintError("Insufficient coins", "INSUFFICIENT_COINS");
      }

      const question = await db.question.findUnique({
        where: { id: input.questionId },
        include: { choices: { orderBy: { sortOrder: "asc" } } },
      });
      if (!question) {
        throw new HintError("Question not found", "NOT_FOUND");
      }

      let hint = question.hint?.trim() ?? "";

      if (!hint && hasLlmKey()) {
        const userPayload = {
          stem: question.stem,
          passage: question.passage,
          choices: question.choices.map((choice) => ({
            choiceId: choice.id,
            label: choice.label,
          })),
        };

        try {
          const raw = await llm.chatCompletion({
            system: HINT_SYSTEM_PROMPT,
            user: JSON.stringify(userPayload),
          });
          const parsed = hintResponseSchema.parse(extractJson(raw));
          hint = sanitizeLlmText(parsed.hint);
          if (!hint) {
            throw new HintError("Hint generation failed", "LLM_FAILED");
          }

          await db.question.update({
            where: { id: question.id },
            data: { hint },
          });
        } catch (err) {
          if (err instanceof HintError) {
            throw err;
          }
          throw new HintError("Hint generation failed", "LLM_FAILED");
        }
      }

      if (!hint) {
        hint = "ลองอ่านประโยคและเลือกคำที่เหมาะสมที่สุด";
      }

      const nextCoins = player.coins - HINT_COST;
      await db.gamePlayer.update({
        where: { id: player.id },
        data: { coins: nextCoins },
      });

      return { hint, coinsDelta: -HINT_COST };
    },

    async enrichExplanation(input: {
      questionId: string;
      choiceId: string;
      isCorrect: boolean;
      fallbackExplanation: string;
    }): Promise<string> {
      const question = await db.question.findUnique({
        where: { id: input.questionId },
        include: { choices: { orderBy: { sortOrder: "asc" } } },
      });
      if (!question) {
        return input.fallbackExplanation;
      }

      if (!hasLlmKey()) {
        return input.fallbackExplanation;
      }

      const selected = question.choices.find((c) => c.id === input.choiceId);
      const correct = question.choices.find((c) => c.isCorrect);

      const userPayload = {
        stem: question.stem,
        passage: question.passage,
        selectedLabel: selected?.label ?? "",
        correctLabel: correct?.label ?? "",
        isCorrect: input.isCorrect,
        baseExplanation: question.explanation,
      };

      try {
        const raw = await llm.chatCompletion({
          system: EXPLANATION_SYSTEM_PROMPT,
          user: JSON.stringify(userPayload),
        });
        const parsed = explanationResponseSchema.parse(extractJson(raw));
        const explanationTh = sanitizeLlmText(parsed.explanationTh);
        return explanationTh || input.fallbackExplanation;
      } catch (err) {
        if (err instanceof OpenAIError) {
          return input.fallbackExplanation;
        }
        return input.fallbackExplanation;
      }
    },
  };
}

export type HintService = ReturnType<typeof createHintService>;

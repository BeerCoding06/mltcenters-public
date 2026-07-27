import type {
  Difficulty,
  PrismaClient,
  QuestionCategory,
  QuestionType,
} from "@prisma/client";
import { z } from "zod";
import {
  adjustDifficulty,
  computeQuizRewards,
  gradeChoice,
  nextStreakAfterAnswer,
} from "./grade";

export const nextQuestionQuerySchema = z.object({
  sessionId: z.string().min(1),
  category: z.enum([
    "VOCABULARY",
    "GRAMMAR",
    "READING",
    "LISTENING",
    "BUSINESS_ENGLISH",
    "RANDOM",
  ]),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
});

export const submitAnswerSchema = z.object({
  sessionId: z.string().min(1),
  playerId: z.string().min(1),
  questionId: z.string().min(1),
  choiceId: z.string().min(1),
  responseMs: z.number().int().min(0),
  isBoss: z.boolean().optional(),
});

export type NextQuestionInput = z.infer<typeof nextQuestionQuerySchema>;
export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;

export interface QuizChoiceDto {
  id: string;
  label: string;
}

export interface NextQuestionDto {
  questionId: string;
  stem: string;
  passage: string | null;
  audioUrl: string | null;
  choices: QuizChoiceDto[];
  quizType: string;
}

export interface SubmitAnswerDto {
  isCorrect: boolean;
  coinsDelta: number;
  expDelta: number;
  explanation: string;
  explanationTh?: string;
  streak: number;
}

export class QuizError extends Error {
  constructor(
    message: string,
    public code:
      | "NOT_FOUND"
      | "NOT_ACTIVE"
      | "NO_QUESTIONS"
      | "INVALID_CHOICE",
  ) {
    super(message);
    this.name = "QuizError";
  }
}

function mapQuizType(type: QuestionType): string {
  switch (type) {
    case "SENTENCE_COMPLETION":
      return "sentence_completion";
    case "ERROR_IDENTIFICATION":
      return "error_identification";
    default:
      return "mcq";
  }
}

function pickRandom<T>(items: T[]): T | undefined {
  if (items.length === 0) {
    return undefined;
  }
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

export function createQuizService(db: PrismaClient) {
  return {
    async getNextQuestion(input: NextQuestionInput): Promise<NextQuestionDto> {
      const session = await db.gameSession.findUnique({
        where: { id: input.sessionId },
      });
      if (!session) {
        throw new QuizError("Session not found", "NOT_FOUND");
      }
      if (session.status !== "ACTIVE") {
        throw new QuizError("Session is not active", "NOT_ACTIVE");
      }

      const recentAttempts = await db.quizAttempt.findMany({
        where: { sessionId: input.sessionId },
        select: { questionId: true },
      });
      const attemptedIds = recentAttempts.map((a) => a.questionId);

      const categoryFilter =
        input.category === "RANDOM"
          ? {}
          : { category: input.category as QuestionCategory };

      const candidates = await db.question.findMany({
        where: {
          active: true,
          difficulty: input.difficulty as Difficulty,
          ...categoryFilter,
          id: { notIn: attemptedIds },
        },
        include: {
          choices: { orderBy: { sortOrder: "asc" } },
        },
      });

      const question = pickRandom(candidates);
      if (!question) {
        throw new QuizError("No questions available", "NO_QUESTIONS");
      }

      return {
        questionId: question.id,
        stem: question.stem,
        passage: question.passage,
        audioUrl: question.audioUrl,
        quizType: mapQuizType(question.type),
        choices: question.choices.map((c) => ({ id: c.id, label: c.label })),
      };
    },

    async submitAnswer(input: SubmitAnswerInput): Promise<SubmitAnswerDto> {
      const session = await db.gameSession.findUnique({
        where: { id: input.sessionId },
      });
      if (!session) {
        throw new QuizError("Session not found", "NOT_FOUND");
      }
      if (session.status !== "ACTIVE") {
        throw new QuizError("Session is not active", "NOT_ACTIVE");
      }

      const player = await db.gamePlayer.findFirst({
        where: { id: input.playerId, sessionId: input.sessionId },
      });
      if (!player) {
        throw new QuizError("Player not found", "NOT_FOUND");
      }

      const question = await db.question.findUnique({
        where: { id: input.questionId },
        include: { choices: true },
      });
      if (!question) {
        throw new QuizError("Question not found", "NOT_FOUND");
      }

      if (!question.choices.some((c) => c.id === input.choiceId)) {
        throw new QuizError("Invalid choice", "INVALID_CHOICE");
      }

      const isCorrect = gradeChoice(question.choices, input.choiceId);
      const rewards = computeQuizRewards(
        isCorrect,
        input.isBoss ?? false,
        player.coins,
      );

      const recentAttempts = await db.quizAttempt.findMany({
        where: { sessionId: input.sessionId, playerId: input.playerId },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { isCorrect: true },
      });

      const streak = nextStreakAfterAnswer(recentAttempts, isCorrect);
      const nextDifficulty = adjustDifficulty(session.difficulty, [
        { isCorrect },
        ...recentAttempts,
      ]);

      const nextCoins = Math.max(0, player.coins + rewards.coinsDelta);
      const nextExp = player.exp + rewards.expDelta;

      await db.$transaction([
        db.quizAttempt.create({
          data: {
            sessionId: input.sessionId,
            playerId: input.playerId,
            questionId: input.questionId,
            isCorrect,
            responseMs: input.responseMs,
          },
        }),
        db.gamePlayer.update({
          where: { id: player.id },
          data: {
            coins: nextCoins,
            exp: nextExp,
            skipNext: rewards.skipNext ? true : player.skipNext,
          },
        }),
        db.gameSession.update({
          where: { id: input.sessionId },
          data: { difficulty: nextDifficulty },
        }),
      ]);

      return {
        isCorrect,
        coinsDelta: rewards.coinsDelta,
        expDelta: rewards.expDelta,
        explanation: question.explanation,
        streak,
      };
    },
  };
}

export type QuizService = ReturnType<typeof createQuizService>;

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/shared/db/prisma";
import {
  createQuizService,
  QuizError,
  submitAnswerSchema,
} from "@/features/quiz/quiz-service";

const quizService = createQuizService(prisma);

function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: err.flatten() },
      { status: 400 },
    );
  }
  if (err instanceof QuizError) {
    const status =
      err.code === "NOT_FOUND"
        ? 404
        : err.code === "NOT_ACTIVE"
          ? 409
          : 400;
    return NextResponse.json({ error: err.message, code: err.code }, { status });
  }
  console.error(err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    const body = submitAnswerSchema.parse(await request.json());
    const result = await quizService.submitAnswer(body);
    return NextResponse.json(result);
  } catch (err) {
    return handleError(err);
  }
}

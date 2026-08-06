import { NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  nextQuestionQuerySchema,
  QuizError,
} from "@/features/quiz/quiz-service";
import { memoryQuiz } from "@/features/store/services";

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
        : err.code === "NO_QUESTIONS"
          ? 404
          : err.code === "NOT_ACTIVE"
            ? 409
            : 400;
    return NextResponse.json({ error: err.message, code: err.code }, { status });
  }
  console.error(err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = nextQuestionQuerySchema.parse({
      sessionId: url.searchParams.get("sessionId"),
      category: url.searchParams.get("category"),
      difficulty: url.searchParams.get("difficulty"),
    });
    const question = await memoryQuiz.getNextQuestion(query);
    return NextResponse.json(question);
  } catch (err) {
    return handleError(err);
  }
}

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { QuizError, submitAnswerSchema } from "@/features/quiz/quiz-service";
import { memoryHints, memoryQuiz } from "@/features/store/services";

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
    const result = await memoryQuiz.submitAnswer(body);
    const explanationTh = await memoryHints.enrichExplanation({
      questionId: body.questionId,
      isCorrect: result.isCorrect,
      fallbackExplanation: result.explanation,
    });
    return NextResponse.json({ ...result, explanationTh });
  } catch (err) {
    return handleError(err);
  }
}

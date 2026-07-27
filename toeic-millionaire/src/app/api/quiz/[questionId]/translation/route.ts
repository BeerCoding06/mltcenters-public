import { NextResponse } from "next/server";
import { createOpenAIClient } from "@/features/ai/openai-client";
import { prisma } from "@/shared/db/prisma";
import {
  createTranslateService,
  TranslateError,
} from "@/features/quiz/translate-service";

const translateService = createTranslateService(
  prisma,
  createOpenAIClient(),
);

function handleError(err: unknown) {
  if (err instanceof TranslateError) {
    const status = err.code === "NOT_FOUND" ? 404 : 502;
    return NextResponse.json({ error: err.message, code: err.code }, { status });
  }
  console.error(err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ questionId: string }> },
) {
  try {
    const { questionId } = await context.params;
    const translation = await translateService.translateQuestion(questionId);
    return NextResponse.json(translation);
  } catch (err) {
    return handleError(err);
  }
}

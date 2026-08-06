import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HintError, requestHintSchema } from "@/features/quiz/hint-service";
import { memoryHints } from "@/features/store/services";

function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: err.flatten() },
      { status: 400 },
    );
  }
  if (err instanceof HintError) {
    const status =
      err.code === "NOT_FOUND"
        ? 404
        : err.code === "NOT_ACTIVE"
          ? 409
          : err.code === "INSUFFICIENT_COINS"
            ? 402
            : err.code === "LLM_FAILED"
              ? 502
              : 400;
    return NextResponse.json({ error: err.message, code: err.code }, { status });
  }
  console.error(err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function POST(request: Request) {
  try {
    const body = requestHintSchema.parse(await request.json());
    const result = await memoryHints.requestHint(body);
    return NextResponse.json(result);
  } catch (err) {
    return handleError(err);
  }
}

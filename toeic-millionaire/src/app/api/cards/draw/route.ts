import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { CardError, drawCardSchema } from "@/features/cards/card-service";
import { memoryCards } from "@/features/store/services";

function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: err.flatten() },
      { status: 400 },
    );
  }
  if (err instanceof CardError) {
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
    const body = drawCardSchema.parse(await request.json());
    const result = await memoryCards.drawCard(body);
    return NextResponse.json({
      card: result.card,
      effectResult: result.effectResult,
      player: result.player,
    });
  } catch (err) {
    return handleError(err);
  }
}

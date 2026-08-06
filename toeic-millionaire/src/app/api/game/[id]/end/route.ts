import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { GameError, endGameSchema } from "@/features/game/game-service";
import { memoryGame } from "@/features/store/services";

function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: err.flatten() },
      { status: 400 },
    );
  }
  if (err instanceof GameError) {
    const status =
      err.code === "NOT_FOUND"
        ? 404
        : err.code === "ALREADY_ENDED"
          ? 409
          : 400;
    return NextResponse.json({ error: err.message, code: err.code }, { status });
  }
  console.error(err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = endGameSchema.parse(await request.json().catch(() => ({})));
    const state = await memoryGame.endGame(id, body);
    return NextResponse.json(state);
  } catch (err) {
    return handleError(err);
  }
}

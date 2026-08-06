import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { GameError, startGameSchema } from "@/features/game/game-service";
import { memoryGame } from "@/features/store/services";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

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
        : err.code === "NOT_YOUR_TURN"
          ? 403
          : err.code === "ALREADY_ENDED"
            ? 409
            : 400;
    return NextResponse.json({ error: err.message, code: err.code }, { status });
  }
  console.error(err);
  return jsonError("Internal server error", 500);
}

export async function POST(request: Request) {
  try {
    const body = startGameSchema.parse(await request.json());
    const result = await memoryGame.startGame(body);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

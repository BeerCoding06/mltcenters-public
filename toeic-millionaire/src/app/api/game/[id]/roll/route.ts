import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { prisma } from "@/shared/db/prisma";
import {
  createGameService,
  GameError,
  rollQuerySchema,
} from "@/features/game/game-service";

const gameService = createGameService(prisma);

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
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const query = rollQuerySchema.parse({
      playerId: url.searchParams.get("playerId") ?? undefined,
    });
    const result = await gameService.roll(id, query.playerId);
    return NextResponse.json(result);
  } catch (err) {
    return handleError(err);
  }
}

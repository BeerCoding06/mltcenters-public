import { NextResponse } from "next/server";
import { prisma } from "@/shared/db/prisma";
import { createGameService, GameError } from "@/features/game/game-service";

const gameService = createGameService(prisma);

function handleError(err: unknown) {
  if (err instanceof GameError) {
    return NextResponse.json(
      { error: err.message, code: err.code },
      { status: err.code === "NOT_FOUND" ? 404 : 400 },
    );
  }
  console.error(err);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const state = await gameService.getState(id);
    return NextResponse.json(state);
  } catch (err) {
    return handleError(err);
  }
}

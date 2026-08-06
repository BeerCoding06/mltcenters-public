import { NextResponse } from "next/server";
import { prisma } from "@/shared/db/prisma";

export const dynamic = "force-dynamic";

/** Lightweight readiness check for Dokploy / ops. */
export async function GET() {
  const hasDatabaseUrl = Boolean(process.env.DATABASE_URL);

  if (!hasDatabaseUrl) {
    return NextResponse.json(
      {
        ok: false,
        databaseUrl: false,
        error: "DATABASE_URL is not set",
      },
      { status: 503 },
    );
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    const questions = await prisma.question.count();
    return NextResponse.json({
      ok: true,
      databaseUrl: true,
      questions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        databaseUrl: true,
        error: message,
      },
      { status: 503 },
    );
  }
}

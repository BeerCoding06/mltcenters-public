import { NextResponse } from "next/server";
import { getQuestionBankStats } from "@/features/store/services";

export const dynamic = "force-dynamic";

/** Readiness for memory-backed game (no database). */
export async function GET() {
  const stats = getQuestionBankStats();
  return NextResponse.json({
    ok: true,
    mode: "memory",
    questions: stats.questions,
    cards: stats.cards,
    byCategory: stats.byCategory,
  });
}

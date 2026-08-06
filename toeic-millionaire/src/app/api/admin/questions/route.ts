import { NextResponse } from "next/server";
import { getQuestionBankStats, getQuestionById } from "@/features/store/memory-runtime";
import questionsBank from "@/data/toeic-questions.json";

/** Read-only list from the embedded TOEIC bank (no database). */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? "100") || 100, 200);
  const stats = getQuestionBankStats();
  const items = (questionsBank as Array<{ id: string; stem: string; category: string; difficulty: string }>)
    .slice(0, limit)
    .map((q) => {
      const full = getQuestionById(q.id);
      return {
        id: q.id,
        stem: q.stem,
        category: q.category,
        difficulty: q.difficulty,
        active: true,
        explanation: full?.explanation ?? "",
        hint: full?.hint ?? null,
        choices: (full?.choices ?? []).map((c) => ({
          id: c.id,
          label: c.label,
          isCorrect: c.isCorrect,
          sortOrder: c.sortOrder,
        })),
      };
    });

  return NextResponse.json({
    mode: "memory",
    total: stats.questions,
    items,
  });
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Admin writes disabled in memory mode. Edit src/data/toeic-questions.json.",
    },
    { status: 501 },
  );
}

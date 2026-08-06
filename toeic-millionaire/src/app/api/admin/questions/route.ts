import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { requireAdmin } from "@/features/auth/admin-guard";
import { prisma } from "@/shared/db/prisma";

const categoryEnum = z.enum([
  "VOCABULARY",
  "GRAMMAR",
  "READING",
  "LISTENING",
  "BUSINESS_ENGLISH",
  "RANDOM",
]);

const difficultyEnum = z.enum(["EASY", "MEDIUM", "HARD"]);

const choiceSchema = z.object({
  label: z.string().min(1),
  isCorrect: z.boolean(),
});

const createQuestionSchema = z.object({
  stem: z.string().min(1),
  explanation: z.string().min(1),
  category: categoryEnum,
  difficulty: difficultyEnum,
  choices: z.array(choiceSchema).length(4),
  hint: z.string().optional(),
  passage: z.string().nullable().optional(),
});

const patchQuestionSchema = createQuestionSchema.partial().extend({
  id: z.string().min(1),
  active: z.boolean().optional(),
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function validateSingleCorrect(choices: z.infer<typeof choiceSchema>[]) {
  const correctCount = choices.filter((c) => c.isCorrect).length;
  if (correctCount !== 1) {
    throw new Error("Exactly one choice must be marked correct");
  }
}

function handleError(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", details: err.flatten() },
      { status: 400 },
    );
  }
  if (err instanceof Error && err.message.includes("correct")) {
    return jsonError(err.message, 400);
  }
  console.error(err);
  return jsonError("Internal server error", 500);
}

async function guardAdmin() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    const status =
      auth.reason === "unauthenticated"
        ? 401
        : auth.reason === "forbidden"
          ? 403
          : 503;
    const message =
      auth.reason === "not_configured"
        ? "Authentication is not configured"
        : auth.reason === "unauthenticated"
          ? "Unauthorized"
          : "Forbidden";
    return { error: jsonError(message, status) };
  }
  return { auth };
}

export async function GET(request: Request) {
  const guard = await guardAdmin();
  if ("error" in guard) return guard.error;

  try {
    const url = new URL(request.url);
    const query = listQuerySchema.parse({
      limit: url.searchParams.get("limit") ?? undefined,
      offset: url.searchParams.get("offset") ?? undefined,
    });

    const [questions, total] = await Promise.all([
      prisma.question.findMany({
        orderBy: { createdAt: "desc" },
        take: query.limit,
        skip: query.offset,
        include: {
          choices: { orderBy: { sortOrder: "asc" } },
        },
      }),
      prisma.question.count(),
    ]);

    return NextResponse.json({ questions, total, ...query });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(request: Request) {
  const guard = await guardAdmin();
  if ("error" in guard) return guard.error;

  try {
    const body = createQuestionSchema.parse(await request.json());
    validateSingleCorrect(body.choices);

    const question = await prisma.question.create({
      data: {
        stem: body.stem,
        explanation: body.explanation,
        category: body.category,
        difficulty: body.difficulty,
        hint: body.hint,
        passage: body.passage ?? null,
        choices: {
          create: body.choices.map((choice, index) => ({
            label: choice.label,
            isCorrect: choice.isCorrect,
            sortOrder: index,
          })),
        },
      },
      include: {
        choices: { orderBy: { sortOrder: "asc" } },
      },
    });

    return NextResponse.json(question, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

export async function PATCH(request: Request) {
  const guard = await guardAdmin();
  if ("error" in guard) return guard.error;

  try {
    const body = patchQuestionSchema.parse(await request.json());

    const existing = await prisma.question.findUnique({
      where: { id: body.id },
      include: { choices: true },
    });

    if (!existing) {
      return jsonError("Question not found", 404);
    }

    if (body.choices) {
      validateSingleCorrect(body.choices);
    }

    const question = await prisma.$transaction(async (tx) => {
      if (body.choices) {
        await tx.choice.deleteMany({ where: { questionId: body.id } });
      }

      return tx.question.update({
        where: { id: body.id },
        data: {
          ...(body.stem !== undefined ? { stem: body.stem } : {}),
          ...(body.explanation !== undefined
            ? { explanation: body.explanation }
            : {}),
          ...(body.category !== undefined ? { category: body.category } : {}),
          ...(body.difficulty !== undefined
            ? { difficulty: body.difficulty }
            : {}),
          ...(body.hint !== undefined ? { hint: body.hint } : {}),
          ...(body.passage !== undefined ? { passage: body.passage } : {}),
          ...(body.active !== undefined ? { active: body.active } : {}),
          ...(body.choices
            ? {
                choices: {
                  create: body.choices.map((choice, index) => ({
                    label: choice.label,
                    isCorrect: choice.isCorrect,
                    sortOrder: index,
                  })),
                },
              }
            : {}),
        },
        include: {
          choices: { orderBy: { sortOrder: "asc" } },
        },
      });
    });

    return NextResponse.json(question);
  } catch (err) {
    return handleError(err);
  }
}

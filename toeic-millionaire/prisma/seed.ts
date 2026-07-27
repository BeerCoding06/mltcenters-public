import "dotenv/config";
import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import {
  PrismaClient,
  QuestionCategory,
  QuestionType,
  Difficulty,
  CardDeck,
} from "@prisma/client";
import { assertQuestionsValid, type SeedQuestion } from "./validate-questions";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");

export interface SeedCard {
  id: string;
  deck: "LUCKY" | "EVENT";
  title: string;
  body: string;
  effect: Record<string, unknown>;
  weight?: number;
}

function loadCards(): SeedCard[] {
  const raw = readFileSync(join(DATA_DIR, "cards.json"), "utf-8");
  return JSON.parse(raw) as SeedCard[];
}

function loadQuestions(): SeedQuestion[] {
  const dir = join(DATA_DIR, "questions");
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  const all: SeedQuestion[] = [];

  for (const file of files.sort()) {
    const raw = readFileSync(join(dir, file), "utf-8");
    const parsed = JSON.parse(raw) as SeedQuestion[] | SeedQuestion;
    all.push(...(Array.isArray(parsed) ? parsed : [parsed]));
  }

  return all;
}

function toQuestionType(type?: string): QuestionType {
  if (type === "SENTENCE_COMPLETION") return QuestionType.SENTENCE_COMPLETION;
  if (type === "ERROR_IDENTIFICATION") return QuestionType.ERROR_IDENTIFICATION;
  return QuestionType.MCQ;
}

export async function seedDatabase(prisma: PrismaClient) {
  const validation = assertQuestionsValid(join(DATA_DIR, "questions"));
  console.log(
    `Validated ${validation.totalQuestions} questions across ${validation.files.length} files`,
  );

  const cards = loadCards();
  if (cards.length !== 40) {
    throw new Error(`Expected 40 cards, got ${cards.length}`);
  }

  const questions = loadQuestions();

  // Dev-friendly: wipe seeded content then recreate (stable ids keep this idempotent)
  await prisma.choice.deleteMany({
    where: { question: { id: { in: questions.map((q) => q.id!).filter(Boolean) } } },
  });
  await prisma.question.deleteMany({
    where: { id: { in: questions.map((q) => q.id!).filter(Boolean) } },
  });
  await prisma.cardDefinition.deleteMany({
    where: { id: { in: cards.map((c) => c.id) } },
  });

  for (const card of cards) {
    await prisma.cardDefinition.create({
      data: {
        id: card.id,
        deck: card.deck as CardDeck,
        title: card.title,
        body: card.body,
        effect: card.effect,
        weight: card.weight ?? 1,
      },
    });
  }
  console.log(`Seeded ${cards.length} cards`);

  for (const q of questions) {
    if (!q.id) throw new Error(`Question missing id in ${q.category}`);

    await prisma.question.create({
      data: {
        id: q.id,
        category: q.category as QuestionCategory,
        type: toQuestionType(q.type),
        difficulty: q.difficulty as Difficulty,
        stem: q.stem,
        passage: q.passage ?? null,
        audioUrl: q.audioUrl ?? null,
        explanation: q.explanation,
        hint: q.hint ?? null,
        active: true,
        choices: {
          create: q.choices.map((choice, sortOrder) => ({
            label: choice.label,
            isCorrect: choice.isCorrect,
            sortOrder,
          })),
        },
      },
    });
  }
  console.log(`Seeded ${questions.length} questions`);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required for seeding.");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  try {
    await seedDatabase(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString =
    process.env.DATABASE_URL ?? "postgresql://localhost:5432/toeic_millionaire";

  const pool = new pg.Pool({
    connectionString,
    // Fail fast in production if DB is unreachable (avoid hung "เริ่มเกม")
    connectionTimeoutMillis: 8_000,
    idleTimeoutMillis: 30_000,
    max: 10,
  });

  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export {
  CardDeck,
  Difficulty,
  GameStatus,
  QuestionCategory,
  QuestionType,
} from "@prisma/client";

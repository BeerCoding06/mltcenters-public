import "dotenv/config";
import { defineConfig } from "prisma/config";

// Supabase: set DIRECT_URL for migrations (pooler bypass); DATABASE_URL for runtime.
const migrationUrl =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: migrationUrl,
  },
});

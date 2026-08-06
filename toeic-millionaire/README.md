# TOEIC Millionaire

Monopoly-style TOEIC board game built with Next.js 16, Prisma, and Supabase Auth.

## Prerequisites

- Node.js 20+
- PostgreSQL (local or Supabase)
- Optional: Supabase project for account sign-in and admin access

## Local development

```bash
cd toeic-millionaire
cp .env.example .env
# Edit .env — at minimum set DATABASE_URL and DIRECT_URL
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Open [http://localhost:3001](http://localhost:3001).

The dev server runs on port **3001** (see `package.json`).

## Environment variables

Copy `.env.example` and fill in:

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Postgres connection (pooled) |
| `DIRECT_URL` | Yes | Direct Postgres URL for migrations |
| `NEXT_PUBLIC_SUPABASE_URL` | For auth | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For auth | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Server-side Supabase tasks |
| `ADMIN_EMAIL_ALLOWLIST` | For admin | Comma-separated admin emails |
| `OPENAI_API_KEY` | Optional | LLM hints / Thai translation |
| `OPENAI_BASE_URL` | Optional | Defaults to Groq OpenAI-compatible API |
| `OPENAI_MODEL` | Optional | Model name for hints/translation |
| `NEXT_PUBLIC_APP_URL` | Recommended | App origin (e.g. `http://localhost:3001`) |

Guest play works without Supabase. Sign-in syncs progress across devices.

## Millionaire theme

The game UI uses a dark **Who Wants to Be a Millionaire**–inspired palette:

- Gold accents (`--millionaire-gold`) for CTAs and highlights
- Cyan glow (`--millionaire-cyan`) for links and focus rings
- Deep black panels with silver borders

Game routes under `(game)` and admin under `(admin)` apply the `millionaire-studio-bg` dark layout automatically.

## Admin — question CRUD

1. Set `ADMIN_EMAIL_ALLOWLIST=you@yourdomain.com` in `.env`.
2. Configure Supabase auth and sign in at `/login`.
3. Visit `/questions` to list, create, and edit questions (stem, 4 choices, explanation, category, difficulty).

Non-allowlisted or unsigned users see a forbidden page.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server on :3001 |
| `npm run build` | Production build |
| `npm test` | Run Vitest unit tests |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Seed questions and cards (~250 questions) |

## Manual smoke checklist

Playwright E2E is not bundled by default. Before release, verify manually:

- [ ] Landing (`/`) loads with Millionaire dark theme
- [ ] **Play as Guest** → `/play` lobby loads
- [ ] Start game → board renders with dice and tiles
- [ ] Quiz modal opens on quiz tile; answer submits without error
- [ ] Guest ID persists in localStorage after refresh
- [ ] `/login` magic link or password sign-in (if Supabase configured)
- [ ] `/questions` admin: forbidden when logged out; CRUD when allowlisted

## Deployment

The game ships **inside** the main MLTCENTERS Docker image and is served at:

**https://www.mltcenters.com/millionaire**

See [docs/DEPLOY.md](./docs/DEPLOY.md). There is **no** `toeic.mltcenters.com` subdomain.

## Link from MLTCENTERS

Navbar **AI/คำศัพท์ → TOEIC เกมส์เศรษฐี** always opens `/millionaire` (same origin).
Do not set `VITE_TOEIC_GAME_URL` to an external host in Dokploy.

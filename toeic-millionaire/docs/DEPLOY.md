# Deploy TOEIC เกมส์เศรษฐี (`/millionaire`)

The game runs **inside the main MLTCENTERS site** at:

**https://www.mltcenters.com/millionaire**

Not a separate subdomain. Express reverse-proxies `/millionaire` → Next.js (port 3002) in the same Docker container.

## Architecture

```
Browser → https://www.mltcenters.com/millionaire
       → Express (:3000) proxy
       → Next.js standalone (:3002, basePath=/millionaire)
       → Postgres (DATABASE_URL) + optional Supabase Auth
```

## Dokploy / Docker

`Dockerfile.prod` already builds:

1. Vite main site (with `VITE_TOEIC_GAME_URL=/millionaire`)
2. Runner 3D
3. `toeic-millionaire` Next.js standalone
4. Starts both Next (:3002) and Express (:3000) via `server/start.sh`

### Required runtime env (Dokploy)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Postgres for game data (can share analytics Postgres) |
| `DIRECT_URL` | Direct Postgres URL for migrations |
| `OPENAI_API_KEY` / `AI_GATEWAY_*` | Optional — Thai translate / hints |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional — login |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional |
| `ADMIN_EMAIL_ALLOWLIST` | Admin `/millionaire/questions` |
| `NEXT_PUBLIC_APP_URL` | `https://www.mltcenters.com/millionaire` |
| `MILLIONAIRE_ORIGIN` | Default `http://127.0.0.1:3002` (internal) |

### First-time DB setup

From a machine with network access to production Postgres:

```bash
cd toeic-millionaire
export DATABASE_URL=... DIRECT_URL=...
npx prisma migrate deploy
npm run db:seed
```

## Local development

```bash
# Terminal 1 — Express API (port from your .env, often 3000)
cd server && npm start

# Terminal 2 — Next game
cd toeic-millionaire && npm run dev   # :3002 + basePath /millionaire

# Terminal 3 — Vite
npm run dev   # :8080, proxies /millionaire → :3002
```

Open: http://localhost:8080/millionaire  

Or directly: http://localhost:3002/millionaire

## Supabase Auth (optional)

Site URL: `https://www.mltcenters.com`  
Redirect: `https://www.mltcenters.com/millionaire/auth/callback`

## Navbar

Dropdown **AI/คำศัพท์** → **TOEIC เกมส์เศรษฐี** links to `/millionaire` (same origin).

## Troubleshooting

| Issue | Fix |
|-------|-----|
| **เริ่มเกมไม่สำเร็จ** / `Cannot POST /api/game/start` | Client hit Express without basePath — fixed with `apiUrl()`; redeploy |
| 503 Database unavailable on start | Set runtime `DATABASE_URL` + `prisma migrate deploy` + `db:seed` |
| Navbar opens `toeic.mltcenters.com` | Old client bundle — redeploy; URL is forced to `/millionaire` |
| Site 404 page (Oops!) on `/millionaire` | SPA stole the route — redeploy Express proxy |
| Branded 503 HTML on `/millionaire` | Next process not running — check Docker logs for `[millionaire]` |
| Whole site 502 | Express must keep Dokploy `PORT` (3000); Next uses 3002 only internally |
| Empty quizzes | Run `prisma migrate deploy` + `db:seed` |
| Build fails on Prisma | Ensure `openssl` in image; `DATABASE_URL` placeholder at build is OK |

## Game data (no database)

The live game uses an **in-memory** store with an embedded bank:

- `src/data/toeic-questions.json` — **200** TOEIC questions (choices + correct answers)
- `src/data/cards.json` — lucky/event cards

`DATABASE_URL` is **not required** to play. Sessions live in the Node process (reset on container restart).

Health: `GET /millionaire/api/health` → `{ ok: true, mode: "memory", questions: 200 }`

### Dokploy checklist after deploy

1. Redeploy `Dockerfile.prod` (no Postgres setup needed for Millionaire)
2. Smoke test Start Game → `POST /millionaire/api/game/start` **201**
3. Fonts: Poppins + Noto Sans Thai (same as main site navbar)

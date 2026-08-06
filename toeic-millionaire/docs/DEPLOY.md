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
| 503 on `/millionaire` | Next process not running — check Docker logs for `[millionaire] starting` |
| Empty quizzes | Run `prisma migrate deploy` + `db:seed` |
| Build fails on Prisma | Ensure `openssl` in image; `DATABASE_URL` placeholder at build is OK |
| SPA steals `/millionaire` | Express must proxy `/millionaire` **before** SPA `*` route (already wired) |

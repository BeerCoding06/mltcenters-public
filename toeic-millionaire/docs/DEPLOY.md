# Deploy TOEIC Millionaire

Production target: **Vercel** (Next.js app) + **Supabase** (Postgres + Auth).  
Domain: **`toeic.mltcenters.com`**

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. **Database** → copy the connection strings:
   - `DATABASE_URL` — use the **Transaction pooler** URI (port 6543)
   - `DIRECT_URL` — use the **Direct** URI (port 5432) for migrations
3. **Authentication** → enable Email (magic link) and/or Google OAuth.
4. **Authentication → URL configuration**:
   - Site URL: `https://toeic.mltcenters.com`
   - Redirect URLs: `https://toeic.mltcenters.com/auth/callback`
5. Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
6. Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
7. Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server only, never expose to client)

### Run migrations against Supabase

From your machine (with `DIRECT_URL` pointing at Supabase):

```bash
cd toeic-millionaire
npm run db:migrate
npm run db:seed
```

Or use Supabase SQL editor to verify tables after migrate.

## 2. Vercel

1. Import the `toeic-millionaire` directory (monorepo root or subdirectory project).
2. **Framework preset:** Next.js  
3. **Root directory:** `toeic-millionaire` (if repo is MLTCENTERS monorepo)
4. **Build command:** `npm run build` (runs `prisma generate` via postinstall if configured, else add build step)
5. Add environment variables (Production + Preview):

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | Supabase pooler URI |
| `DIRECT_URL` | Supabase direct URI |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (encrypted) |
| `ADMIN_EMAIL_ALLOWLIST` | `admin@mltcenters.com` |
| `NEXT_PUBLIC_APP_URL` | `https://toeic.mltcenters.com` |
| `OPENAI_API_KEY` | Optional — hints / translation |
| `OPENAI_BASE_URL` | Optional — e.g. Groq endpoint |
| `OPENAI_MODEL` | Optional |

6. Deploy. Confirm `/`, `/play`, and `/api/game/start` respond.

### Prisma on Vercel

Ensure `prisma generate` runs before build. Add to `package.json` if needed:

```json
"postinstall": "prisma generate"
```

Apply migrations locally against production `DIRECT_URL` before first deploy, or use a CI step.

## 3. Custom domain

1. Vercel project → **Settings → Domains** → add `toeic.mltcenters.com`.
2. At your DNS provider (MLTCENTERS), add:

| Type | Name | Value |
|------|------|-------|
| CNAME | `toeic` | `cname.vercel-dns.com` |

(Vercel shows the exact CNAME target after you add the domain.)

3. Wait for SSL provisioning (usually minutes).
4. Update Supabase redirect URLs if you added preview domains.

## 4. Link from MLTCENTERS main site

In the parent MLTCENTERS app (Vite), set:

```env
VITE_TOEIC_GAME_URL=https://toeic.mltcenters.com
```

Redeploy MLTCENTERS. The navbar **TOEIC Game** item opens the deployed game in a new tab.

Local dev default: `VITE_TOEIC_GAME_URL=http://localhost:3001`

## 5. Post-deploy checks

- [ ] HTTPS loads at `https://toeic.mltcenters.com`
- [ ] Guest can start a game end-to-end
- [ ] Supabase sign-in callback works
- [ ] Admin `/questions` accessible only for allowlisted emails
- [ ] Database has seeded questions (`npm run db:seed` was run once)

## 6. Admin access in production

Set `ADMIN_EMAIL_ALLOWLIST` in Vercel to comma-separated admin emails.  
Sign in at `https://toeic.mltcenters.com/login`, then open `/questions`.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Auth redirect loop | Match Supabase Site URL and redirect URLs to production domain |
| DB connection errors on Vercel | Use pooler `DATABASE_URL`; keep `DIRECT_URL` for migrations only |
| Empty quiz pool | Run `npm run db:seed` against production DB |
| 403 on `/questions` | Add your email to `ADMIN_EMAIL_ALLOWLIST` and redeploy |

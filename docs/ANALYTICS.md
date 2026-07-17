# MLTCENTERS Analytics

First-party website analytics for the React + Vite + Express stack.

## Architecture

```
Browser AnalyticsProvider / track()
  → batch + sendBeacon/fetch (+ localStorage retry)
  → POST /api/analytics/event
  → validate → sanitize → geo header → hash IP → DB
  → GET /api/analytics/summary (admin Bearer token)
  → /admin/analytics dashboard
```

## Event flow

1. `AnalyticsProvider` starts a session and tracks page/route/scroll/button/form events.
2. Product code calls `track('assessment_started')` etc.
3. Events queue for ~2s or until 10 items, then flush.
4. On tab hide / unload, flush uses `navigator.sendBeacon` when available.
5. Failed batches retry from `localStorage`.

## Database (dual-mode)

| Mode | When |
|------|------|
| PostgreSQL | `DATABASE_URL=postgresql://...` |
| SQLite | default — `server/data/analytics.sqlite` (or `ANALYTICS_SQLITE_PATH`) |

Tables: `analytics_events`, `page_views`, `chat_sessions`, `assessment_results`, `runner_results`.

**Privacy:** raw IP is never stored. Only `ip_hash = sha256(salt:ip)`.

## API

| Method | Path | Auth |
|--------|------|------|
| POST | `/api/analytics/event` | public + rate limit |
| GET | `/api/analytics/summary` | `Authorization: Bearer $ANALYTICS_ADMIN_TOKEN` |
| GET | `/api/analytics/health` | public |

## Dashboard

Open `/admin/analytics` and paste `ANALYTICS_ADMIN_TOKEN`.

Shows visitors, sessions, bounce rate, top pages/browsers/countries/devices, assessment/chat/runner stats, and a 7-day chart.

## Environment

```env
ANALYTICS_ENABLED=true
ANALYTICS_ADMIN_TOKEN=long-random-secret
ANALYTICS_IP_SALT=another-long-random-secret
DATABASE_URL=                 # optional Postgres
ANALYTICS_SQLITE_PATH=        # optional SQLite path
```

### Dokploy

1. Set the env vars above as **runtime Environment** (not Build Args when possible).
2. **Do not put spaces** in secrets that Dokploy may pass as `--build-arg` — e.g. Gmail App Password should be `abcdefghijklmnop` not `abcd efgh ijkl mnop`.
3. Avoid spaces/`<>` in `EMAIL_FROM` if it is passed as a build-arg (prefer `MLTCENTERS <onboarding@resend.dev>` only as runtime env).
4. Optional: attach a Postgres service and set `DATABASE_URL`.
5. Redeploy.
6. Visit `https://www.mltcenters.com/admin/analytics`.

Geo uses `CF-IPCountry` / `X-Vercel-IP-Country` / `X-Country-Code` when present; otherwise `XX` (Bangkok timezone → `TH`).

## Local smoke test

```bash
cd server && npm install && npm run dev
# another terminal
npm run dev

# browse the site, then:
curl -s http://localhost:3000/api/analytics/health
curl -s -H "Authorization: Bearer $ANALYTICS_ADMIN_TOKEN" \
  http://localhost:3000/api/analytics/summary
```

## Tests

```bash
npm test
```

Covers sanitize/hash/validate, track queue retry, and ingest + summary integration (SQLite temp file).

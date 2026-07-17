# Website Analytics System — Design Spec

**Date:** 2026-07-17  
**Status:** Approved (product decisions) — awaiting written-spec confirmation  
**Project:** MLTCENTERS (React + Vite + Express)

## 1. Goals

Ship a first-party, production-ready analytics system that:

- Tracks page/session engagement and product events (assessment, chat, speech, TTS, runner, register, contact)
- Stores data in PostgreSQL when available, otherwise SQLite
- Protects the admin dashboard with a shared secret from env
- Respects privacy (no raw IP storage)
- Stays performant (batching, `sendBeacon`, retry)

## 2. Decisions (locked)

| Topic | Choice |
|-------|--------|
| Storage | Dual-mode: `DATABASE_URL` → PostgreSQL; else SQLite file |
| Admin auth | Shared secret `ANALYTICS_ADMIN_TOKEN` (Bearer) |
| Geo | Lightweight: proxy country headers (`CF-IPCountry`, etc.), else `XX` + client timezone |
| Vendor | First-party only (no GA / Plausible required) |

## 3. Architecture

```
Browser (AnalyticsProvider + track queue)
    │  batch / sendBeacon / fetch + retry
    ▼
POST /api/analytics/event  (rate-limited, public)
    │  validate → sanitize → geo → hash IP → write
    ▼
DB (Postgres | SQLite)
    ▲
GET /api/analytics/summary  (Bearer admin token)
    │
Admin UI /admin/analytics
```

## 4. Frontend (`src/analytics/`)

| File | Responsibility |
|------|----------------|
| `analytics-context.ts` | Types, React context, event name constants |
| `track.ts` | Queue, batch flush, `sendBeacon`/`fetch`, localStorage retry |
| `useAnalytics.ts` | Hook: `track`, `trackPageView`, helpers |
| `AnalyticsProvider.tsx` | Session lifecycle, route changes, time-on-page, scroll depth, click capture |

### Auto-tracked

- `session_start`, `session_end`
- `page_view`, `route_change`
- `time_on_page`
- `scroll_depth` (milestones 25/50/75/100)
- `click`, `button_click`, `form_submit` (delegated; ignore sensitive fields)

### Custom events (call sites)

| Domain | Events |
|--------|--------|
| Assessment | `assessment_started`, `assessment_completed`, `assessment_failed` |
| Chatbot | `chat_started`, `chat_message_sent`, `chat_response_received` |
| Speech | `speech_started`, `speech_completed`, `speech_failed` |
| TTS | `tts_started`, `tts_completed` |
| Runner | `runner_started`, `runner_finished` |
| Registration | `register_started`, `register_completed` |
| Contact | `contact_submit` |

### Batching / reliability

- Flush every ~2s or when queue ≥ 10
- Prefer `navigator.sendBeacon` on unload / visibility hidden
- Persist failed batches in `localStorage` and retry on next load
- Never block UI; fire-and-forget with backoff

### Payload shape (client → server)

```ts
type AnalyticsEventPayload = {
  events: Array<{
    name: string;
    ts: number;              // client epoch ms
    path?: string;
    referrer?: string;
    sessionId: string;
    visitorId: string;       // durable anonymous id (localStorage)
    metadata?: Record<string, string | number | boolean | null>;
  }>;
  timezone?: string;
  language?: string;
  screen?: { w: number; h: number };
};
```

## 5. Backend (`server/analytics/`)

| File | Responsibility |
|------|----------------|
| `db.js` | Dual-mode pool/connection + migrate on boot |
| `schema.sql` | Tables + indexes (SQL dialect notes for PG/SQLite) |
| `analytics-model.js` | Inserts + summary queries |
| `analytics-service.js` | Validate, sanitize, hash IP, geo, domain upserts |
| `analytics-controller.js` | HTTP handlers |
| `analytics-router.js` | Mount routes, rate limit, admin auth middleware |

### Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/analytics/event` | none (rate-limited) | Ingest batch |
| GET | `/api/analytics/summary` | Bearer `ANALYTICS_ADMIN_TOKEN` | Dashboard aggregates |
| GET | `/api/analytics/health` | none | DB mode + ok |

### Validation rules

- Max 50 events per request
- Event `name`: snake_case, allowlist or `/^[a-z][a-z0-9_]{1,63}$/`
- `metadata`: max 20 keys; key ≤ 40 chars; string values ≤ 500 chars; drop nested objects/arrays
- Reject empty batches

### Security

- Raw IP never stored
- `ip_hash = sha256(IP + ANALYTICS_IP_SALT)` (or `ANALYTICS_ADMIN_TOKEN` salt fallback only if salt unset in dev)
- Rate limit: e.g. 60 requests / minute / ip_hash (in-memory Map; document Dokploy multi-instance caveat)
- Admin routes require exact Bearer token match (timing-safe compare)
- Sanitize User-Agent / path length

### Geo (lightweight)

Priority:

1. `CF-IPCountry`
2. `X-Vercel-IP-Country`
3. `X-Country-Code`
4. Client `timezone` → coarse map optional, else `XX`

Store `country_code` (ISO-ish 2-letter or `XX`) only.

## 6. Database

### Tables

**analytics_events**  
id, name, ts, path, referrer, session_id, visitor_id, ip_hash, country_code, user_agent, device_type, browser, metadata_json, created_at

**page_views**  
id, visitor_id, session_id, path, started_at, duration_ms, scroll_depth, referrer, country_code, created_at

**chat_sessions**  
id, session_id, visitor_id, started_at, message_count, last_event_at, status

**assessment_results**  
id, visitor_id, session_id, status (`started`\|`completed`\|`failed`), level, score_avg, metadata_json, created_at, updated_at

**runner_results**  
id, visitor_id, session_id, status (`started`\|`finished`), score, duration_ms, metadata_json, created_at, updated_at

Indexes on: `analytics_events(ts)`, `(name, ts)`, `(visitor_id, ts)`, `page_views(path, started_at)`.

### Dual-mode behavior

- If `DATABASE_URL` starts with `postgres` → `pg`
- Else → `better-sqlite3` at `ANALYTICS_SQLITE_PATH` (default `server/data/analytics.sqlite`)
- Run idempotent `CREATE TABLE IF NOT EXISTS` on boot

## 7. Admin Dashboard

- Route: `/admin/analytics`
- Gate: prompt for token once → `sessionStorage`
- Metrics: visitors today/week/month, active users, returning users, sessions, avg session duration, bounce rate
- Breakdowns: top pages, browsers, countries, devices
- Product stats: assessment / chat / runner
- Charts: Recharts (already in repo)
- Polling: refresh summary every 60s while tab visible

## 8. Instrumentation touchpoints

Wire `track()` into existing flows without changing UX:

- `EnglishAssessmentPage` / `useAssessment` — assessment + chat events
- `useSpeechRecognition` / `useTextToSpeech` — speech + TTS
- `RegisterPage` — register_started / register_completed
- `ContactPage` / `HomeContactSection` — contact_submit
- Runner: best-effort via `/runner-app` bridge or when landing `RunnerRedirectPage` + runner-api hooks if available

## 9. Env vars

```env
DATABASE_URL=                 # optional postgres URL
ANALYTICS_SQLITE_PATH=        # optional
ANALYTICS_ADMIN_TOKEN=        # required for dashboard API
ANALYTICS_IP_SALT=            # required in production
ANALYTICS_ENABLED=true
```

## 10. Testing

- Unit: sanitize, validate, ip hash, device/browser parse, batch queue helpers
- Integration: POST event → row inserted (SQLite in-memory/file temp); summary auth reject/accept
- Frontend: track queue flush / ignore filler metadata keys (vitest)

## 11. Documentation

- `docs/ANALYTICS.md` — architecture, event flow, DB, dashboard setup for Dokploy

## 12. Out of scope (this iteration)

- MaxMind / paid geo DB
- Multi-node distributed rate limiting
- Real-time websocket dashboard
- PII in metadata (emails, full transcripts) — explicitly forbidden in sanitize allowlist guidance

## 13. Success criteria

- Events appear in DB within seconds of browsing
- Dashboard loads with admin token and shows non-zero page views after smoke test
- No raw IPs in DB
- Works locally on SQLite without Postgres
- Unit + integration tests pass in CI/`npm test`

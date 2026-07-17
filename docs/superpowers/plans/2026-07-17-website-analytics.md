# Website Analytics Implementation Plan

> **For agentic workers:** Implement task-by-task. Spec: `docs/superpowers/specs/2026-07-17-website-analytics-design.md`

**Goal:** First-party analytics with dual-mode DB, batched client tracking, admin dashboard.

**Tech:** React/TS frontend, Express backend, `pg` + `better-sqlite3`, Recharts, vitest.

## Files to create

### Backend
- `server/analytics/db.js`
- `server/analytics/schema.sql`
- `server/analytics/analytics-model.js`
- `server/analytics/analytics-service.js`
- `server/analytics/analytics-controller.js`
- `server/analytics/analytics-router.js`
- `server/analytics/analytics-service.test.js`
- `server/analytics/analytics-router.test.js`

### Frontend
- `src/analytics/analytics-context.ts`
- `src/analytics/track.ts`
- `src/analytics/useAnalytics.ts`
- `src/analytics/AnalyticsProvider.tsx`
- `src/analytics/track.test.ts`
- `src/pages/AdminAnalyticsPage.tsx`

### Docs / config
- `docs/ANALYTICS.md`
- Update `.env.example`, `docker-compose.yml`, `Dockerfile.prod`, `server/package.json`, `src/App.tsx`, instrumentation call sites

## Tasks

1. Backend DB + schema + model (SQLite default)
2. Service validate/sanitize/hash/geo + unit tests
3. Router/controller + mount in `server/index.js` + integration tests
4. Frontend track queue + provider + wire App
5. Instrument product events
6. Admin dashboard page + charts
7. Docs + env + docker deps
8. Run full test suite

---

I'm using the writing-plans skill; executing immediately after plan write (spec already approved).

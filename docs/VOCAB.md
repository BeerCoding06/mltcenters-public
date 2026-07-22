# MLTCENTERS Vocabulary Learning (MVP)

Embedded AI vocabulary tutor at `/vocab/*` with API at `/api/vocab/*`.

## Enable flag and environment

| Variable | Default | Description |
|----------|---------|-------------|
| `VOCAB_ENABLED` | `true` | Set to `false` or `0` to unmount all `/api/vocab` routes (404). |
| `VOCAB_NEW_WORDS_PER_DAY` | `15` | Max new words in a learn session. |
| `VOCAB_AI_DAILY_SENTENCES` | `5` | Daily AI sentence cap (hard limit 5). |
| `VOCAB_FILE_PATH` | `server/data/vocab.json` | JSON store path when not using Postgres. |
| `DATABASE_URL` | *(empty)* | When set to a `postgresql://…` URL, vocab uses Postgres instead of the file store. |
| `OPENAI_*` / `AI_GATEWAY_*` | — | Reused for AI sentence generation (same as assessment). |

Copy from `.env.example` and adjust as needed.

## Guest identity (`X-Visitor-Id`)

Vocab has no login in MVP. Each learner is identified by the analytics visitor ID:

- Browser: `localStorage` key `mlt-analytics-visitor` (via `getVisitorId()` in `src/analytics/track.ts`).
- API: every `/api/vocab/*` request must include header `X-Visitor-Id: <uuid>`.
- Missing header → `400 { "error": "Missing X-Visitor-Id header" }`.
- Frontend `src/vocab/api.ts` attaches the header automatically.

Profiles, word stats, sessions, and AI sentence cache are scoped to this visitor ID.

## Storage (dual-mode)

Same pattern as analytics:

| Mode | When | Location |
|------|------|----------|
| **PostgreSQL** | `DATABASE_URL=postgresql://…` | Tables `vocab_levels`, `vocab_words`, `vocab_profiles`, `vocab_word_stats`, `vocab_sessions`, `vocab_quiz_results`, `vocab_generated_sentences`, `vocab_review_schedule` (migrated on startup). |
| **File JSON** | `DATABASE_URL` empty | `server/data/vocab.json` (override with `VOCAB_FILE_PATH`). |

On first start with an empty word bank, the server auto-seeds **Level 1 Starter** (300 words) from `server/vocab/seed/level1-starter.json`.

## MVP API

All routes require `X-Visitor-Id`. Base path: `/api/vocab`.

| Method | Path | Body / notes |
|--------|------|--------------|
| POST | `/profile` | `{ goal?, levelId? }` — create/update profile; returns dashboard. |
| GET | `/dashboard` | Progress, streak, weak/strong words. |
| GET | `/levels` | Available levels. |
| GET | `/words/:id` | Word detail + learner stats. |
| POST | `/sessions` | `{ mode: "learn" \| "review" \| "quiz" }` — start session. |
| POST | `/sessions/:id/answer` | `{ wordId, quizType, isCorrect, … }` — submit answer. |
| POST | `/sessions/:id/complete` | Finish session. |
| GET | `/review/queue` | Due review items. |
| GET | `/recommend/today` | Today’s learn pack. |
| POST | `/ai/sentences` | Daily AI sentences (max 5/day, cached per profile). |

## Reset local `vocab.json`

**Full reset (profiles + progress + word bank):**

```bash
rm -f server/data/vocab.json
# restart the server — starter seed reloads automatically
```

**Reset learner progress only** (keep 300-word bank): edit `server/data/vocab.json` and clear arrays `profiles`, `word_stats`, `sessions`, `quiz_results`, `review_schedule`, and `generated_sentences`. Leave `levels` and `words` intact.

**Reset a single guest:** remove that visitor’s rows from `profiles` and related stats in the JSON file (or use Postgres `DELETE` on `vocab_profiles` where `visitor_id = …`).

**Browser onboarding:** clear `localStorage` keys `mlt-analytics-visitor` and `mlt-vocab-onboarded` to simulate a new guest in dev.

## Frontend routes

| Path | Purpose |
|------|---------|
| `/vocab` | Dashboard |
| `/vocab/onboarding` | Goal / level setup |
| `/vocab/learn` | Learn session |
| `/vocab/learn/:wordId` | Word detail |
| `/vocab/review` | Smart review |
| `/vocab/quiz` | Quiz session |
| `/vocab/sentences` | AI sentences of the day |

## Analytics events

- `vocab_session_started`
- `vocab_word_learned`
- `vocab_quiz_answered`

## Design spec and plan

- Full product design: [docs/superpowers/specs/2026-07-22-ai-vocab-learning-design.md](superpowers/specs/2026-07-22-ai-vocab-learning-design.md)
- MVP implementation plan: [docs/superpowers/plans/2026-07-22-ai-vocab-learning-mvp.md](superpowers/plans/2026-07-22-ai-vocab-learning-mvp.md)

## Out of scope (MVP)

Not implemented in this release — see the design spec for future phases:

- Match / Arrange / Image / AI Convo quiz types
- AI story generator
- AI chat tutor
- Leaderboard
- Full weekly AI report
- Level 2–3 word banks (Starter / 300 words only)
- User accounts / JWT auth (guest profile only)
- Placement mini-quiz and full onboarding flows from the long-term spec

# AI Vocabulary Learning Platform (MVP P0) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an embedded `/vocab` AI vocabulary tutor MVP inside MLTCENTERS: guest profile, Level-1 300-word bank, learn + MCQ/type/fill quiz, Memory Score v1 + SRS review queue, dashboard, and 5 AI sentences/day.

**Architecture:** New Express module `server/vocab/` (dual-mode Postgres or pure-JS JSON file store, same pattern as analytics) + React pages under `/vocab/*`. Guest identity = analytics `visitorId` sent as `X-Visitor-Id`. AI sentences reuse existing OpenAI/Groq client env (`OPENAI_*` / `AI_GATEWAY_*`). No story/chat/leaderboard in this plan.

**Tech Stack:** React + Vite + Tailwind + React Router, Express (ESM), Vitest, `pg` (optional Postgres), pure-JS file store fallback, existing OpenAI SDK.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-22-ai-vocab-learning-design.md` (approved)
- Embed only — routes `/vocab/*`, API `/api/vocab/*`, feature flag `VOCAB_ENABLED`
- Dual-mode DB: Postgres if `DATABASE_URL`, else `server/data/vocab.json` (no native sqlite)
- Guest profile via `visitorId` (localStorage analytics id); no login required for MVP
- Quiz types in MVP: `mcq`, `type`, `fill` only
- Seed: Level 1 Starter exactly 300 active words
- AI: max 5 sentences/day/user, cached by `userId + dateKey`
- Analytics events: `vocab_session_started`, `vocab_word_learned`, `vocab_quiz_answered`
- UI: match MLTCENTERS tokens (`#5BC0FF`, `#6EE7B7`, Poppins + Noto Sans Thai, pastel-card patterns)
- i18n keys under `vocabPage.*` (TH + EN)
- Out of scope: story, chat tutor, weekly AI report, match/arrange/image/ai_convo, Level 2–3 full banks, leaderboard
- Tests: `npm test` (vitest) must pass; TDD for memory/SRS and API handlers
- Commits: small, conventional (`feat(vocab): …`)

---

## File Map

### Backend (create)
| File | Responsibility |
|------|----------------|
| `server/vocab/db.js` | Init dual-mode DB, migrate Postgres |
| `server/vocab/file-store.js` | Pure-JS JSON persistence |
| `server/vocab/memory.js` | Memory Score + SRS interval (pure) |
| `server/vocab/memory.test.js` | Unit tests for memory/SRS |
| `server/vocab/seed/level1-starter.json` | 300 starter words |
| `server/vocab/seed-loader.js` | Load/validate seed into store |
| `server/vocab/model.js` | CRUD profiles, words, stats, sessions, sentences |
| `server/vocab/service.js` | Business rules: learn pack, answer, review, AI sentences |
| `server/vocab/service.test.js` | Service unit tests |
| `server/vocab/ai-sentences.js` | Prompt + parse + daily cache |
| `server/vocab/controller.js` | HTTP handlers |
| `server/vocab/router.js` | Express router + visitor middleware |
| `server/vocab/router.test.js` | Integration tests with file store |

### Frontend (create)
| File | Responsibility |
|------|----------------|
| `src/vocab/types.ts` | Shared TS types |
| `src/vocab/api.ts` | `fetch` wrappers + visitor header |
| `src/vocab/useVocabProfile.ts` | Ensure profile + dashboard fetch |
| `src/pages/vocab/VocabLayout.tsx` | Shared shell / mobile bottom nav |
| `src/pages/vocab/VocabOnboardingPage.tsx` | Goal + level |
| `src/pages/vocab/VocabDashboardPage.tsx` | Today pack + stats |
| `src/pages/vocab/VocabLearnPage.tsx` | Learn cards |
| `src/pages/vocab/VocabWordDetailPage.tsx` | Word detail |
| `src/pages/vocab/VocabQuizPage.tsx` | Quiz session UI |
| `src/pages/vocab/VocabReviewPage.tsx` | Review queue session |
| `src/pages/vocab/VocabSentencesPage.tsx` | AI sentences |

### Modify
| File | Change |
|------|--------|
| `server/index.js` | `initVocabDb` + mount `/api/vocab` when enabled |
| `src/App.tsx` | Lazy routes for `/vocab/*` |
| `src/components/Navbar.tsx` | Link “ศัพท์ / Vocab” |
| `src/lib/i18n.tsx` | `vocabPage` strings TH/EN |
| `server/seo-meta.js` | Known paths + meta for `/vocab` |
| `.env.example` | Vocab env vars |
| `docs/VOCAB.md` | Operator docs |

---

### Task 1: Memory Score + SRS pure module

**Files:**
- Create: `server/vocab/memory.js`
- Test: `server/vocab/memory.test.js`

**Interfaces:**
- Produces:
  - `computeMemoryScore(input: MemoryInput): number` → 0–100
  - `masteryFromScore(score: number): number` → 0–5
  - `nextReviewAfterAnswer(prev: SrsState, isCorrect: boolean, nowMs: number): SrsState`

- [ ] **Step 1: Write failing tests**

```js
// server/vocab/memory.test.js
import { describe, it, expect } from 'vitest';
import {
  computeMemoryScore,
  masteryFromScore,
  nextReviewAfterAnswer,
} from './memory.js';

describe('computeMemoryScore', () => {
  it('returns high score for strong learner', () => {
    const score = computeMemoryScore({
      correctCount: 9,
      wrongCount: 1,
      avgResponseMs: 2000,
      medianResponseMs: 2500,
      hoursSinceLastReview: 12,
      scheduledIntervalDays: 1,
      forgetCount: 0,
      avgConfidenceWhenCorrect: 4,
      reviewDaysLast7: 5,
    });
    expect(score).toBeGreaterThanOrEqual(70);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('penalizes forgets and low accuracy', () => {
    const score = computeMemoryScore({
      correctCount: 2,
      wrongCount: 8,
      avgResponseMs: 8000,
      medianResponseMs: 2500,
      hoursSinceLastReview: 72,
      scheduledIntervalDays: 1,
      forgetCount: 3,
      avgConfidenceWhenCorrect: 2,
      reviewDaysLast7: 1,
    });
    expect(score).toBeLessThan(40);
  });
});

describe('masteryFromScore', () => {
  it('maps bands', () => {
    expect(masteryFromScore(10)).toBe(0);
    expect(masteryFromScore(30)).toBe(1);
    expect(masteryFromScore(50)).toBe(2);
    expect(masteryFromScore(70)).toBe(3);
    expect(masteryFromScore(80)).toBe(4);
    expect(masteryFromScore(90)).toBe(5);
  });
});

describe('nextReviewAfterAnswer', () => {
  it('extends interval on correct', () => {
    const now = Date.parse('2026-07-22T00:00:00Z');
    const next = nextReviewAfterAnswer(
      { intervalDays: 1, easeFactor: 2.3, forgetCount: 0 },
      true,
      now
    );
    expect(next.intervalDays).toBeGreaterThan(1);
    expect(next.nextReviewAt).toBeGreaterThan(now);
    expect(next.forgetCount).toBe(0);
  });

  it('resets interval and bumps forget on wrong', () => {
    const now = Date.parse('2026-07-22T00:00:00Z');
    const next = nextReviewAfterAnswer(
      { intervalDays: 4, easeFactor: 2.3, forgetCount: 0 },
      false,
      now
    );
    expect(next.intervalDays).toBeCloseTo(0.5, 5);
    expect(next.easeFactor).toBeLessThan(2.3);
    expect(next.forgetCount).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd /Applications/MAMP/htdocs/mltcenters && npx vitest run server/vocab/memory.test.js
```

Expected: FAIL (module not found)

- [ ] **Step 3: Implement `memory.js`**

```js
// server/vocab/memory.js
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * @typedef {{
 *  correctCount: number,
 *  wrongCount: number,
 *  avgResponseMs: number,
 *  medianResponseMs: number,
 *  hoursSinceLastReview: number,
 *  scheduledIntervalDays: number,
 *  forgetCount: number,
 *  avgConfidenceWhenCorrect: number,
 *  reviewDaysLast7: number,
 * }} MemoryInput
 */

/** @param {MemoryInput} input */
export function computeMemoryScore(input) {
  const total = input.correctCount + input.wrongCount;
  const accuracy = total === 0 ? 50 : (input.correctCount / total) * 100;

  const med = Math.max(1, input.medianResponseMs || 2500);
  const ratio = (input.avgResponseMs || med) / med;
  let speed = 100;
  if (ratio < 0.35) speed = 55; // suspiciously fast
  else if (ratio <= 1.2) speed = 100;
  else if (ratio <= 2) speed = 70;
  else speed = 40;

  const dueHours = (input.scheduledIntervalDays || 1) * 24;
  const overdue = Math.max(0, (input.hoursSinceLastReview || 0) - dueHours);
  const recency = clamp(100 - overdue * 2, 0, 100);

  const forgetPenalty = Math.min(100, (input.forgetCount || 0) * 15);
  const confidence = clamp(((input.avgConfidenceWhenCorrect || 3) / 5) * 100, 0, 100);
  const streakStability = clamp(((input.reviewDaysLast7 || 0) / 7) * 100, 0, 100);

  const score =
    0.35 * accuracy +
    0.15 * speed +
    0.2 * recency +
    0.15 * (100 - forgetPenalty) +
    0.1 * confidence +
    0.05 * streakStability;

  return Math.round(clamp(score, 0, 100));
}

export function masteryFromScore(score) {
  if (score < 20) return 0;
  if (score < 40) return 1;
  if (score < 60) return 2;
  if (score < 75) return 3;
  if (score < 85) return 4;
  return 5;
}

/**
 * @param {{ intervalDays: number, easeFactor: number, forgetCount: number }} prev
 * @param {boolean} isCorrect
 * @param {number} nowMs
 */
export function nextReviewAfterAnswer(prev, isCorrect, nowMs) {
  let intervalDays = prev.intervalDays ?? 0.5;
  let easeFactor = prev.easeFactor ?? 2.3;
  let forgetCount = prev.forgetCount ?? 0;

  if (isCorrect) {
    intervalDays = Math.max(0.5, intervalDays * easeFactor);
    easeFactor = Math.min(3.0, easeFactor + 0.05);
  } else {
    intervalDays = 0.5;
    easeFactor = Math.max(1.3, easeFactor * 0.85);
    forgetCount += 1;
  }

  const nextReviewAt = nowMs + intervalDays * 24 * 60 * 60 * 1000;
  return { intervalDays, easeFactor, forgetCount, nextReviewAt };
}
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
npx vitest run server/vocab/memory.test.js
```

- [ ] **Step 5: Commit**

```bash
git add server/vocab/memory.js server/vocab/memory.test.js
git commit -m "$(cat <<'EOF'
feat(vocab): add memory score and SRS helpers

EOF
)"
```

---

### Task 2: Dual-mode DB + file store + seed schema

**Files:**
- Create: `server/vocab/file-store.js`, `server/vocab/db.js`, `server/vocab/seed/level1-starter.json`, `server/vocab/seed-loader.js`
- Test: extend coverage in `server/vocab/service.test.js` later; add `server/vocab/seed-loader.test.js`

**Interfaces:**
- Produces: `initVocabDb()`, `getVocabDbMode()`, `getVocabFileStore()`, `getVocabPgPool()`, `loadStarterSeed(store)`

- [ ] **Step 1: Write seed validation test (failing)**

```js
// server/vocab/seed-loader.test.js
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateSeedWords } from './seed-loader.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('level1 seed', () => {
  it('has exactly 300 valid words', () => {
    const raw = JSON.parse(
      readFileSync(path.join(__dirname, 'seed/level1-starter.json'), 'utf8')
    );
    const result = validateSeedWords(raw);
    expect(result.ok).toBe(true);
    expect(result.count).toBe(300);
  });
});
```

- [ ] **Step 2: Create seed JSON (300 words)**

Create `server/vocab/seed/level1-starter.json` as an array of objects:

```json
{
  "id": "w_0001",
  "word": "hello",
  "ipa": "/həˈləʊ/",
  "pos": "interjection",
  "meaning_th": "สวัสดี",
  "difficulty": 1,
  "frequency": 100,
  "category": "greeting",
  "example_en": "Hello, how are you?",
  "example_th": "สวัสดี คุณเป็นอย่างไรบ้าง?",
  "tags": ["starter", "greeting"]
}
```

Populate **exactly 300** unique `word` values (high-frequency starter set: greetings, numbers, colors, family, food, school, verbs, adjectives, daily life). IDs `w_0001`…`w_0300`. All `difficulty` 1–3. Use a script if needed:

```bash
# optional helper while authoring — keep final committed JSON as source of truth
node -e "const w=require('./server/vocab/seed/level1-starter.json'); console.log(w.length)"
```

Expected: `300`

- [ ] **Step 3: Implement `seed-loader.js`**

```js
// server/vocab/seed-loader.js
const REQUIRED = [
  'id', 'word', 'ipa', 'pos', 'meaning_th', 'difficulty',
  'frequency', 'category', 'example_en', 'example_th',
];

export function validateSeedWords(words) {
  if (!Array.isArray(words)) return { ok: false, count: 0, error: 'not array' };
  const seen = new Set();
  for (const w of words) {
    for (const k of REQUIRED) {
      if (w[k] === undefined || w[k] === null || w[k] === '') {
        return { ok: false, count: words.length, error: `missing ${k} on ${w.id || '?'}` };
      }
    }
    const key = String(w.word).toLowerCase();
    if (seen.has(key)) return { ok: false, count: words.length, error: `dup ${key}` };
    seen.add(key);
  }
  return { ok: words.length === 300, count: words.length, error: words.length === 300 ? null : 'count' };
}

export async function loadStarterSeed(model) {
  const { readFileSync } = await import('fs');
  const path = await import('path');
  const { fileURLToPath } = await import('url');
  const dir = path.dirname(fileURLToPath(import.meta.url));
  const words = JSON.parse(readFileSync(path.join(dir, 'seed/level1-starter.json'), 'utf8'));
  const v = validateSeedWords(words);
  if (!v.ok) throw new Error(`Invalid seed: ${v.error}`);
  await model.upsertLevel({
    id: 'starter',
    code: 'starter',
    name_th: 'Starter',
    name_en: 'Starter',
    target_word_count: 300,
    sort_order: 1,
  });
  for (const w of words) {
    await model.upsertWord({
      ...w,
      level_id: 'starter',
      status: 'active',
      tags_json: JSON.stringify(w.tags || []),
    });
  }
  return { count: words.length };
}
```

- [ ] **Step 4: Implement file-store + db**

Mirror analytics patterns:

- `emptyDb()` collections: `profiles`, `levels`, `words`, `sessions`, `quiz_results`, `word_stats`, `review_schedule`, `generated_sentences`, `seq`
- `createVocabFileStore(filePath)` with debounced persist
- `initVocabDb()`:
  - Postgres → migrate tables matching model fields (see Task 3)
  - else → `server/data/vocab.json` (override `VOCAB_FILE_PATH`)
- On init (both modes): if word count for level `starter` is 0, call `loadStarterSeed`

Postgres tables (minimal MVP):

```sql
CREATE TABLE IF NOT EXISTS vocab_levels (
  id TEXT PRIMARY KEY, code TEXT UNIQUE, name_th TEXT, name_en TEXT,
  target_word_count INT, sort_order INT
);
CREATE TABLE IF NOT EXISTS vocab_words (
  id TEXT PRIMARY KEY, level_id TEXT, word TEXT, ipa TEXT, pos TEXT,
  meaning_th TEXT, difficulty INT, frequency INT, category TEXT,
  example_en TEXT, example_th TEXT, tags_json TEXT, status TEXT
);
CREATE TABLE IF NOT EXISTS vocab_profiles (
  id TEXT PRIMARY KEY, visitor_id TEXT UNIQUE, goal TEXT, current_level_id TEXT,
  xp INT DEFAULT 0, streak_days INT DEFAULT 0, last_active_date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS vocab_word_stats (
  id TEXT PRIMARY KEY, profile_id TEXT, word_id TEXT,
  seen_count INT, correct_count INT, wrong_count INT,
  forget_count INT, memory_score INT, mastery_level INT,
  status TEXT, learning_stage TEXT,
  interval_days REAL, ease_factor REAL,
  last_review_at BIGINT, next_review_at BIGINT,
  avg_response_ms INT, avg_confidence REAL,
  UNIQUE(profile_id, word_id)
);
CREATE TABLE IF NOT EXISTS vocab_sessions (
  id TEXT PRIMARY KEY, profile_id TEXT, mode TEXT,
  started_at BIGINT, ended_at BIGINT, words_count INT,
  correct_count INT, xp_earned INT
);
CREATE TABLE IF NOT EXISTS vocab_quiz_results (
  id TEXT PRIMARY KEY, session_id TEXT, profile_id TEXT, word_id TEXT,
  quiz_type TEXT, is_correct BOOLEAN, response_ms INT,
  confidence INT, user_answer TEXT, created_at BIGINT
);
CREATE TABLE IF NOT EXISTS vocab_generated_sentences (
  id TEXT PRIMARY KEY, profile_id TEXT, date_key TEXT,
  content_json TEXT, created_at BIGINT,
  UNIQUE(profile_id, date_key)
);
```

- [ ] **Step 5: Run seed test PASS**

```bash
npx vitest run server/vocab/seed-loader.test.js
```

- [ ] **Step 6: Commit**

```bash
git add server/vocab/
git commit -m "$(cat <<'EOF'
feat(vocab): dual-mode DB, file store, and 300-word starter seed

EOF
)"
```

---

### Task 3: Model + service (profile, learn pack, answer, review)

**Files:**
- Create: `server/vocab/model.js`, `server/vocab/service.js`, `server/vocab/service.test.js`

**Interfaces:**
- Consumes: `computeMemoryScore`, `masteryFromScore`, `nextReviewAfterAnswer`, file/pg accessors
- Produces (service):
  - `ensureProfile(visitorId, { goal?, levelId? })`
  - `getDashboard(profileId)`
  - `startSession(profileId, mode)` → `{ sessionId, items[] }`
  - `submitAnswer(profileId, sessionId, payload)` → `{ memoryScore, nextReviewAt, xpDelta, masteryLevel, isCorrect }`
  - `completeSession(profileId, sessionId)`
  - `getReviewQueue(profileId)`
  - `getRecommendToday(profileId)`

Answer payload:

```ts
{
  wordId: string;
  quizType: 'mcq' | 'type' | 'fill';
  userAnswer: string;
  responseMs: number;
  confidence: number; // 1-5
}
```

Grading rules:
- `mcq`: case-insensitive trim equality to correct word or meaning depending on prompt mode (store `expected` on quiz item)
- `type`: normalize lowercase, trim, accept exact word
- `fill`: same as type against target word

XP: +10 correct, +2 attempt wrong. Streak: bump if `last_active_date` is yesterday (UTC date string); set today; reset if gap > 1 day.

Learn pack: up to `VOCAB_NEW_WORDS_PER_DAY` (default 15) words with no stats or `status=new`, plus due review up to 20 in mixed session items.

Each learn item after reveal should include one quiz item (`mcq` preferred).

- [ ] **Step 1: Write service tests with temp file store**

```js
// server/vocab/service.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createVocabFileStore } from './file-store.js';
import { createVocabModel } from './model.js';
import { createVocabService } from './service.js';
import { loadStarterSeed } from './seed-loader.js';

let dir;
let service;

beforeEach(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocab-'));
  const store = createVocabFileStore(path.join(dir, 'vocab.json'));
  const model = createVocabModel({ mode: 'file', fileStore: store });
  await loadStarterSeed(model);
  service = createVocabService({ model });
});

afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe('vocab service', () => {
  it('creates profile and dashboard', async () => {
    const p = await service.ensureProfile('vis_1', { goal: 'general', levelId: 'starter' });
    const dash = await service.getDashboard(p.id);
    expect(dash.streakDays).toBe(0);
    expect(dash.levelId).toBe('starter');
    expect(dash.today.learnRemaining).toBeGreaterThan(0);
  });

  it('learn session grades mcq and updates memory', async () => {
    const p = await service.ensureProfile('vis_2', { goal: 'general', levelId: 'starter' });
    const session = await service.startSession(p.id, 'learn');
    expect(session.items.length).toBeGreaterThan(0);
    const item = session.items[0];
    const result = await service.submitAnswer(p.id, session.sessionId, {
      wordId: item.wordId,
      quizType: 'mcq',
      userAnswer: item.expected,
      responseMs: 1800,
      confidence: 4,
    });
    expect(result.isCorrect).toBe(true);
    expect(result.memoryScore).toBeGreaterThan(0);
    expect(result.xpDelta).toBe(10);
  });

  it('wrong answer schedules short review', async () => {
    const p = await service.ensureProfile('vis_3', { goal: 'general', levelId: 'starter' });
    const session = await service.startSession(p.id, 'learn');
    const item = session.items[0];
    const result = await service.submitAnswer(p.id, session.sessionId, {
      wordId: item.wordId,
      quizType: 'type',
      userAnswer: 'zzzz-not-a-word',
      responseMs: 5000,
      confidence: 1,
    });
    expect(result.isCorrect).toBe(false);
    expect(result.nextReviewAt).toBeLessThan(Date.now() + 24 * 3600 * 1000);
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (missing modules)

```bash
npx vitest run server/vocab/service.test.js
```

- [ ] **Step 3: Implement `model.js` + `service.js`**

Key service answer path (must call memory helpers):

```js
// inside submitAnswer after grading
const prev = await model.getWordStat(profileId, wordId) || {
  intervalDays: 0.5,
  easeFactor: 2.3,
  forgetCount: 0,
  correctCount: 0,
  wrongCount: 0,
  seenCount: 0,
  avgResponseMs: responseMs,
  avgConfidence: confidence,
};
const correctCount = prev.correctCount + (isCorrect ? 1 : 0);
const wrongCount = prev.wrongCount + (isCorrect ? 0 : 1);
const srs = nextReviewAfterAnswer(
  {
    intervalDays: prev.intervalDays,
    easeFactor: prev.easeFactor,
    forgetCount: prev.forgetCount,
  },
  isCorrect,
  Date.now()
);
const memoryScore = computeMemoryScore({
  correctCount,
  wrongCount,
  avgResponseMs: Math.round(((prev.avgResponseMs || responseMs) + responseMs) / 2),
  medianResponseMs: 2500,
  hoursSinceLastReview: 0,
  scheduledIntervalDays: srs.intervalDays,
  forgetCount: srs.forgetCount,
  avgConfidenceWhenCorrect: isCorrect
    ? ((prev.avgConfidence || confidence) + confidence) / 2
    : prev.avgConfidence || 3,
  reviewDaysLast7: 1,
});
const masteryLevel = masteryFromScore(memoryScore);
const status =
  masteryLevel >= 5 ? 'mastered' : isCorrect ? 'learning' : 'reviewing';
```

Dashboard shape:

```js
{
  profileId, goal, levelId, xp, streakDays,
  wordsLearned, accuracy7d,
  weakWords: [{ id, word, meaning_th, memoryScore }],
  strongWords: [{ id, word, meaning_th, memoryScore }],
  today: {
    learnRemaining, reviewDue, sentencesReady,
  },
  coachTip: string // static TH tip for MVP if no AI
}
```

MCQ distractors: 3 random other words’ `meaning_th` or `word` from same level.

- [ ] **Step 4: Tests PASS**

```bash
npx vitest run server/vocab/service.test.js
```

- [ ] **Step 5: Commit**

```bash
git add server/vocab/model.js server/vocab/service.js server/vocab/service.test.js
git commit -m "$(cat <<'EOF'
feat(vocab): profile, learn/review sessions, and answer grading

EOF
)"
```

---

### Task 4: AI daily sentences + HTTP router

**Files:**
- Create: `server/vocab/ai-sentences.js`, `server/vocab/controller.js`, `server/vocab/router.js`, `server/vocab/router.test.js`
- Modify: `server/index.js`, `.env.example`

**Interfaces:**
- `POST /api/vocab/ai/sentences` → `{ sentences: [{ en, th, wordIds[] }], cached: boolean }`
- Header required: `X-Visitor-Id: <uuid>`
- If `VOCAB_ENABLED` is `false`/`0`, router not mounted (404)

Routes:

| Method | Path | Handler |
|--------|------|---------|
| POST | `/profile` | ensure profile `{ goal, levelId }` |
| GET | `/dashboard` | dashboard |
| GET | `/levels` | levels list |
| GET | `/words/:id` | word detail + user stat |
| POST | `/sessions` | `{ mode: 'learn'|'review'|'quiz' }` |
| POST | `/sessions/:id/answer` | answer payload |
| POST | `/sessions/:id/complete` | complete |
| GET | `/review/queue` | due words |
| GET | `/recommend/today` | today pack |
| POST | `/ai/sentences` | generate/cached 5 sentences |

- [ ] **Step 1: Router test for profile + disabled flag**

```js
// server/vocab/router.test.js
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { createVocabFileStore } from './file-store.js';
import { createVocabModel } from './model.js';
import { createVocabService } from './service.js';
import { createVocabRouter } from './router.js';
import { loadStarterSeed } from './seed-loader.js';

async function withApp() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'vocab-r-'));
  const store = createVocabFileStore(path.join(dir, 'v.json'));
  const model = createVocabModel({ mode: 'file', fileStore: store });
  await loadStarterSeed(model);
  const service = createVocabService({ model, openai: null });
  const app = express();
  app.use(express.json());
  app.use('/api/vocab', createVocabRouter({ service }));
  return { app, dir };
}

describe('vocab router', () => {
  let app, dir;
  beforeEach(async () => {
    ({ app, dir } = await withApp());
  });
  afterEach(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('rejects missing visitor header', async () => {
    const res = await fetchApp(app, 'GET', '/api/vocab/dashboard');
    expect(res.status).toBe(400);
  });

  it('returns dashboard for visitor', async () => {
    await fetchApp(app, 'POST', '/api/vocab/profile', {
      headers: { 'X-Visitor-Id': 'v1', 'Content-Type': 'application/json' },
      body: JSON.stringify({ goal: 'toeic', levelId: 'starter' }),
    });
    const res = await fetchApp(app, 'GET', '/api/vocab/dashboard', {
      headers: { 'X-Visitor-Id': 'v1' },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.levelId).toBe('starter');
  });
});

// helper: use http + app.listen(0) or supertest-style manual listen
```

Implement `fetchApp` with ephemeral listen (same pattern as `analytics-router.test.js` if present).

- [ ] **Step 2: Implement AI sentences module**

```js
// server/vocab/ai-sentences.js
export function buildSentencesPrompt(knownWords) {
  const list = knownWords
    .slice(0, 40)
    .map((w) => `${w.word} (${w.meaning_th})`)
    .join(', ');
  return [
    {
      role: 'system',
      content:
        'You are an English tutor for Thai learners. Return ONLY JSON: {"sentences":[{"en":"...","th":"...","words":["word1"]}]} with exactly 5 items. Use ONLY the provided known words for English sentences. Keep sentences short (6-12 words).',
    },
    {
      role: 'user',
      content: `Known words: ${list}\nCreate 5 practice sentences.`,
    },
  ];
}

export function parseSentencesResponse(text) {
  const json = JSON.parse(text.replace(/^```json\n?|```$/g, '').trim());
  if (!Array.isArray(json.sentences) || json.sentences.length < 1) {
    throw new Error('bad sentences payload');
  }
  return json.sentences.slice(0, 5).map((s) => ({
    en: String(s.en || ''),
    th: String(s.th || ''),
    wordIds: [], // filled by service via word lookup
    words: Array.isArray(s.words) ? s.words.map(String) : [],
  }));
}
```

Service `getOrCreateDailySentences(profileId)`:
1. `dateKey = new Date().toISOString().slice(0, 10)`
2. If cached row exists → return `{ sentences, cached: true }`
3. Load known words (`memory_score >= 40` or `status in learning|reviewing|mastered`), fallback to first 20 starter words if empty
4. If no OpenAI client → template fallback: `"I can use the word {word}."` × 5 from known set (still cache)
5. Else call chat completions, parse, map words→ids, cache, return

Env: `VOCAB_AI_DAILY_SENTENCES=5` (informational; hard-cap 5).

- [ ] **Step 3: Mount in `server/index.js`**

After analytics init:

```js
import { initVocabDb } from './vocab/db.js';
import { createVocabRouter } from './vocab/router.js';
import { createVocabModel } from './vocab/model.js';
import { createVocabService } from './vocab/service.js';
import { getVocabDbMode, getVocabFileStore, getVocabPgPool } from './vocab/db.js';

const VOCAB_ENABLED =
  process.env.VOCAB_ENABLED !== 'false' && process.env.VOCAB_ENABLED !== '0';

// inside listen bootstrap:
if (VOCAB_ENABLED) {
  await initVocabDb();
  const model = createVocabModel({
    mode: getVocabDbMode(),
    fileStore: getVocabFileStore(),
    pgPool: getVocabPgPool(),
  });
  const vocabService = createVocabService({
    model,
    openai: AI_API_KEY
      ? new OpenAI({
          apiKey: AI_API_KEY,
          ...(AI_BASE_URL ? { baseURL: AI_BASE_URL } : {}),
        })
      : null,
    modelName: AI_MODEL,
  });
  app.use('/api/vocab', createVocabRouter({ service: vocabService }));
  console.info('[vocab] routes mounted at /api/vocab');
}
```

`.env.example` add:

```env
VOCAB_ENABLED=true
VOCAB_NEW_WORDS_PER_DAY=15
VOCAB_AI_DAILY_SENTENCES=5
# VOCAB_FILE_PATH=server/data/vocab.json
```

- [ ] **Step 4: Tests PASS + commit**

```bash
npx vitest run server/vocab/
git add server/vocab server/index.js .env.example
git commit -m "$(cat <<'EOF'
feat(vocab): mount /api/vocab with AI daily sentences

EOF
)"
```

---

### Task 5: Frontend API client + types + onboarding/dashboard

**Files:**
- Create: `src/vocab/types.ts`, `src/vocab/api.ts`, `src/vocab/useVocabProfile.ts`, `src/pages/vocab/VocabLayout.tsx`, `src/pages/vocab/VocabOnboardingPage.tsx`, `src/pages/vocab/VocabDashboardPage.tsx`
- Modify: `src/App.tsx`, `src/lib/i18n.tsx`

**Interfaces:**
- `vocabFetch(path, init)` attaches `X-Visitor-Id: getVisitorId()`
- Onboarding saves goal/level via `POST /api/vocab/profile`
- If profile missing goal → redirect `/vocab/onboarding`

- [ ] **Step 1: Types + API**

```ts
// src/vocab/types.ts
export type VocabGoal = 'general' | 'toeic' | 'travel' | 'business';
export type QuizType = 'mcq' | 'type' | 'fill';

export interface VocabDashboard {
  profileId: string;
  goal: VocabGoal;
  levelId: string;
  xp: number;
  streakDays: number;
  wordsLearned: number;
  accuracy7d: number;
  weakWords: Array<{ id: string; word: string; meaning_th: string; memoryScore: number }>;
  strongWords: Array<{ id: string; word: string; meaning_th: string; memoryScore: number }>;
  today: {
    learnRemaining: number;
    reviewDue: number;
    sentencesReady: boolean;
  };
  coachTip: string;
}
```

```ts
// src/vocab/api.ts
import { getVisitorId } from '@/analytics/track';

export async function vocabFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers || {});
  headers.set('X-Visitor-Id', getVisitorId());
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(`/api/vocab${path}`, { ...init, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `vocab ${res.status}`);
  }
  return res.json();
}
```

- [ ] **Step 2: Pages**

`VocabOnboardingPage`: choose goal (4 buttons) + confirm Starter level → `POST /profile` → navigate `/vocab`.

`VocabDashboardPage`: show streak, XP, learnRemaining, reviewDue, weak/strong chips, CTAs to `/vocab/learn`, `/vocab/review`, `/vocab/sentences`. Use existing card/button classes (`pastel-card`, primary buttons). Track `vocab_session_started` only when entering learn/review/quiz (Task 6).

`VocabLayout`: outlet + simple top progress label; hide main site footer density if needed (keep global Navbar).

- [ ] **Step 3: Routes in App.tsx**

```tsx
const VocabLayout = lazy(() => import("./pages/vocab/VocabLayout"));
const VocabDashboardPage = lazy(() => import("./pages/vocab/VocabDashboardPage"));
const VocabOnboardingPage = lazy(() => import("./pages/vocab/VocabOnboardingPage"));
// ... other vocab pages in Task 6

<Route path="/vocab" element={<VocabLayout />}>
  <Route index element={<VocabDashboardPage />} />
  <Route path="onboarding" element={<VocabOnboardingPage />} />
</Route>
```

- [ ] **Step 4: i18n `vocabPage` keys (TH+EN)** for nav label, onboarding, dashboard CTAs, empty states.

- [ ] **Step 5: Manual smoke** — `npm run dev`, open `/vocab/onboarding`, complete → dashboard renders.

- [ ] **Step 6: Commit**

```bash
git add src/vocab src/pages/vocab src/App.tsx src/lib/i18n.tsx
git commit -m "$(cat <<'EOF'
feat(vocab): onboarding and dashboard UI

EOF
)"
```

---

### Task 6: Learn, word detail, quiz, review, sentences UI + analytics

**Files:**
- Create: `VocabLearnPage.tsx`, `VocabWordDetailPage.tsx`, `VocabQuizPage.tsx`, `VocabReviewPage.tsx`, `VocabSentencesPage.tsx`
- Modify: `App.tsx` routes, `Navbar.tsx`, `server/seo-meta.js`, analytics call sites via `useAnalytics().track`

**Flows:**

1. **Learn** — `POST /sessions { mode:'learn' }` → for each item: show word card (reveal meaning) → inline quiz (mcq/type/fill from item) → `POST .../answer` → next → `complete` → toast XP
2. **Review** — same with `mode:'review'`; empty state if `reviewDue===0`
3. **Quiz hub shortcut** — `/vocab/quiz` starts `mode:'quiz'` (mix of due + recent)
4. **Word detail** — `GET /words/:id`
5. **Sentences** — `POST /ai/sentences` → list 5 EN+TH

Analytics:

```ts
track('vocab_session_started', { mode });
track('vocab_word_learned', { wordId });
track('vocab_quiz_answered', { wordId, quizType, isCorrect });
```

Navbar: add item `{ to: '/vocab', labelKey: 'nav.vocab' }` (or `vocabPage.nav`).

SEO: add `/vocab`, `/vocab/learn`, `/vocab/review`, `/vocab/sentences`, `/vocab/onboarding` to known paths + Thai/EN titles.

- [ ] **Step 1: Implement pages with loading/error states** (no blank screens)
- [ ] **Step 2: Wire navbar + seo-meta**
- [ ] **Step 3: Manual path**

```
/vocab/onboarding → /vocab → Learn 5 words → Review → Sentences
```

- [ ] **Step 4: `npm test` PASS**
- [ ] **Step 5: Commit**

```bash
git add src/pages/vocab src/App.tsx src/components/Navbar.tsx server/seo-meta.js
git commit -m "$(cat <<'EOF'
feat(vocab): learn, quiz, review, and AI sentences pages

EOF
)"
```

---

### Task 7: Docs + final verification

**Files:**
- Create: `docs/VOCAB.md`
- Modify: design spec status already approved; ensure `.env.example` complete

`docs/VOCAB.md` must include:
- Enable flag + env vars
- Guest identity (`X-Visitor-Id`)
- Dual-mode storage paths
- API table (MVP routes)
- How to re-seed / reset local `server/data/vocab.json`
- Out of scope pointer to full design spec

- [ ] **Step 1: Write docs**
- [ ] **Step 2: Full test suite**

```bash
cd /Applications/MAMP/htdocs/mltcenters && npm test
```

Expected: all green

- [ ] **Step 3: Commit**

```bash
git add docs/VOCAB.md .env.example docs/superpowers/specs/2026-07-22-ai-vocab-learning-design.md
git commit -m "$(cat <<'EOF'
docs(vocab): add MVP operator guide

EOF
)"
```

---

## Spec coverage (self-review)

| MVP requirement | Task |
|-----------------|------|
| Dashboard progress/streak/weak/strong | 3, 5 |
| Learn + word detail | 3, 6 |
| Quiz MCQ/Type/Fill | 3, 6 |
| Memory Score v1 + SRS | 1, 3 |
| Review queue | 3, 6 |
| Level 1 × 300 seed | 2 |
| AI 5 sentences/day + cache | 4, 6 |
| Analytics vocab_* events | 6 |
| Navbar + i18n + SEO | 5, 6 |
| Dual-mode DB | 2 |
| Guest visitorId | 3, 4, 5 |
| Docs | 7 |

Excluded (by spec): story, chat, weekly report, advanced quiz types, Level 2–3 — no tasks.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-22-ai-vocab-learning-mvp.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — run tasks in this session with checkpoints  

Which approach?

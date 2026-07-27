# TOEIC Millionaire Challenge (P1 Solo Board) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a separate Next.js app `toeic-millionaire/` with P1 Solo Board: 40 tiles, dice/move loop, TOEIC quizzes (700 seed), Thai translate button, AI hint/explanation, lucky/event cards, guest play + Supabase login merge, linked from MLTCENTERS Navbar.

**Architecture:** Feature-first Next.js 15 App Router app at `toeic-millionaire/`. Server-authoritative game state via Route Handlers + Prisma/Postgres (Supabase). Client Zustand FSM for animations; React Query for API. OpenAI-compatible LLM for translate/hint/explanation with DB cache.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind, Shadcn UI, Framer Motion, Zustand, TanStack Query, Supabase Auth, Prisma, PostgreSQL, OpenAI API (Groq-compatible), Zod, Vitest, Playwright.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-27-toeic-millionaire-design.md` (approved)
- Separate project folder: `toeic-millionaire/` (sibling to `runner-3d/`, not inside `src/`)
- P1 only — no property, multiplayer, shop, tournament
- Auth G3: guest play immediate; Supabase login optional for save/merge
- Board: exactly **40 tiles** from `board/tiles.json`
- Win: 2 laps OR 30 turns/player → highest coins
- Question seed P1: **700** (200 vocab, 200 grammar, 100 reading, 100 listening, 100 business)
- Cards P1: **40** lucky/event definitions
- Quiz UI: **ปุ่ม「แปลเป็นภาษาไทย」** free toggle; dual EN+TH display; cache in `QuestionTranslation`
- AI: translate/hint/explanation must NOT reveal correct answer before submit
- Server validates dice rolls and quiz answers
- Deploy: Vercel + Supabase; domain `toeic.mltcenters.com`
- MLTCENTERS: external Navbar link only (Task 12); keep `/vocab` unchanged
- Commits: conventional `feat(toeic): …` / `fix(toeic): …`
- Tests: Vitest unit + API integration; Playwright smoke for guest flow

---

## File Map

### New project root: `toeic-millionaire/`

| Path | Responsibility |
|------|----------------|
| `package.json`, `next.config.ts`, `tailwind.config.ts` | Next 15 app shell |
| `prisma/schema.prisma` | All P1 models |
| `prisma/seed.ts` | Cards + questions import |
| `prisma/data/questions/*.json` | Seed JSON by category |
| `prisma/data/cards.json` | 40 card definitions |
| `board/tiles.json` | 40 tile config |
| `features/game/fsm.ts` | Pure turn/tile resolver |
| `features/game/fsm.test.ts` | FSM unit tests |
| `features/game/scoring.ts` | Coins/EXP/adaptive difficulty |
| `features/quiz/grade.ts` | Answer grading |
| `features/quiz/translate-service.ts` | LLM translate + cache |
| `features/ai/openai-client.ts` | OpenAI/Groq client |
| `features/auth/guest-id.ts` | guestId localStorage helper |
| `app/api/game/start/route.ts` | Start session |
| `app/api/game/[id]/roll/route.ts` | Dice |
| `app/api/game/[id]/state/route.ts` | State snapshot |
| `app/api/quiz/next/route.ts` | Next question |
| `app/api/quiz/[questionId]/translation/route.ts` | Thai translation |
| `app/api/quiz/answer/route.ts` | Grade + rewards |
| `app/api/cards/draw/route.ts` | Lucky/event |
| `app/api/profile/merge/route.ts` | Guest merge |
| `app/(marketing)/page.tsx` | Landing |
| `app/(game)/play/page.tsx` | Lobby |
| `app/(game)/board/[sessionId]/page.tsx` | Board + modals |
| `features/board/BoardCanvas.tsx` | Board UI |
| `features/board/TokenAnimator.tsx` | Move animation |
| `features/quiz/QuizModal.tsx` | Quiz UI |
| `features/quiz/TranslateThButton.tsx` | Thai toggle |
| `features/quiz/QuestionThPanel.tsx` | Thai panel |
| `features/cards/CardDrawModal.tsx` | Card flip |
| `features/player/Hud.tsx` | Coins/EXP/turn |
| `README.md`, `docs/DEPLOY.md` | Ops docs |

### Modify (mltcenters repo)

| Path | Change |
|------|--------|
| `src/components/Navbar.tsx` | External link TOEIC game |
| `src/lib/i18n.tsx` | `nav.toeicGame` TH/EN |

---

### Task 1: Scaffold Next.js 15 project

**Files:**
- Create: `toeic-millionaire/` via `create-next-app`
- Create: `toeic-millionaire/.env.example`
- Create: `toeic-millionaire/vitest.config.ts`

**Interfaces:**
- Produces: runnable `npm run dev` on port 3001 (avoid clash with MLTCENTERS 3000)

- [ ] **Step 1: Create app**

```bash
cd /Applications/MAMP/htdocs/mltcenters
npx create-next-app@latest toeic-millionaire --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm
```

- [ ] **Step 2: Install deps**

```bash
cd toeic-millionaire
npm install zustand @tanstack/react-query framer-motion zod react-hook-form @hookform/resolvers lucide-react next-themes
npm install @prisma/client
npm install -D prisma vitest @vitejs/plugin-react jsdom @testing-library/react
npx shadcn@latest init -d
npx shadcn@latest add button card dialog toast skeleton badge progress
```

- [ ] **Step 3: `.env.example`**

```env
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.3-70b-versatile
NEXT_PUBLIC_APP_URL=http://localhost:3001
ADMIN_EMAIL_ALLOWLIST=admin@example.com
```

- [ ] **Step 4: `package.json` scripts**

```json
"dev": "next dev -p 3001",
"test": "vitest run",
"test:watch": "vitest",
"db:generate": "prisma generate",
"db:migrate": "prisma migrate dev",
"db:seed": "tsx prisma/seed.ts"
```

- [ ] **Step 5: Verify**

```bash
npm run dev
# Expected: Next.js on http://localhost:3001
```

- [ ] **Step 6: Commit**

```bash
git add toeic-millionaire/
git commit -m "$(cat <<'EOF'
feat(toeic): scaffold Next.js 15 app

EOF
)"
```

---

### Task 2: Prisma schema + migrations

**Files:**
- Create: `toeic-millionaire/prisma/schema.prisma`
- Create: `toeic-millionaire/src/shared/db/prisma.ts`

**Interfaces:**
- Produces: `prisma` singleton, enums `QuestionCategory`, `QuestionType`, `Difficulty`, `CardDeck`, `GameStatus`

- [ ] **Step 1: Write schema** (core models from spec §7–12)

```prisma
// toeic-millionaire/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum QuestionCategory {
  VOCABULARY GRAMMAR READING LISTENING BUSINESS_ENGLISH RANDOM
}

enum QuestionType {
  MCQ SENTENCE_COMPLETION ERROR_IDENTIFICATION
}

enum Difficulty {
  EASY MEDIUM HARD
}

enum CardDeck {
  LUCKY EVENT
}

enum GameStatus {
  ACTIVE COMPLETED ABANDONED
}

model PlayerProfile {
  id                String   @id @default(cuid())
  supabaseUserId    String?  @unique
  guestId           String?  @unique
  displayName       String
  coins             Int      @default(1500)
  diamonds          Int      @default(0)
  exp               Int      @default(0)
  level             Int      @default(1)
  title             String   @default("Rookie")
  vocabAccuracy     Float    @default(0)
  grammarAccuracy   Float    @default(0)
  readingAccuracy   Float    @default(0)
  listeningAccuracy Float    @default(0)
  gamesPlayed       Int      @default(0)
  gamesWon          Int      @default(0)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
}

model Question {
  id          String               @id @default(cuid())
  category    QuestionCategory
  type        QuestionType         @default(MCQ)
  difficulty  Difficulty
  stem        String
  passage     String?
  audioUrl    String?
  imageUrl    String?
  explanation String
  hint        String?
  stemTh      String?
  passageTh   String?
  active      Boolean              @default(true)
  choices     Choice[]
  translation QuestionTranslation?
  attempts    QuizAttempt[]
  createdAt   DateTime             @default(now())
}

model Choice {
  id         String   @id @default(cuid())
  questionId String
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  label      String
  isCorrect  Boolean  @default(false)
  sortOrder  Int
}

model QuestionTranslation {
  id         String   @id @default(cuid())
  questionId String   @unique
  question   Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  stemTh     String
  passageTh  String?
  choicesTh  Json
  source     String   @default("llm")
  createdAt  DateTime @default(now())
}

model CardDefinition {
  id     String   @id @default(cuid())
  deck   CardDeck
  title  String
  body   String
  effect Json
  weight Int      @default(1)
}

model GameSession {
  id           String       @id @default(cuid())
  status       GameStatus   @default(ACTIVE)
  difficulty   Difficulty   @default(MEDIUM)
  turnCount    Int          @default(0)
  maxTurns     Int          @default(30)
  lapsToWin    Int          @default(2)
  currentIndex Int          @default(0)
  players      GamePlayer[]
  turns        TurnLog[]
  attempts     QuizAttempt[]
  cardDraws    CardDraw[]
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}

model GamePlayer {
  id          String      @id @default(cuid())
  sessionId   String
  session     GameSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  profileId   String?
  profile     PlayerProfile? @relation(fields: [profileId], references: [id])
  displayName String
  isBot       Boolean     @default(false)
  position    Int         @default(0)
  lap         Int         @default(0)
  coins       Int         @default(1500)
  exp         Int         @default(0)
  skipNext    Boolean     @default(false)
  sortOrder   Int         @default(0)
}

model TurnLog {
  id        String      @id @default(cuid())
  sessionId String
  session   GameSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  playerId  String
  dice      Int
  fromPos   Int
  toPos     Int
  tileType  String
  createdAt DateTime    @default(now())
}

model QuizAttempt {
  id         String      @id @default(cuid())
  sessionId  String
  session    GameSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  playerId   String
  questionId String
  question   Question    @relation(fields: [questionId], references: [id])
  isCorrect  Boolean
  responseMs Int
  createdAt  DateTime    @default(now())
}

model CardDraw {
  id        String      @id @default(cuid())
  sessionId String
  session   GameSession @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  playerId  String
  cardId    String
  card      CardDefinition @relation(fields: [cardId], references: [id])
  createdAt DateTime    @default(now())
}
```

Add relation on `PlayerProfile`: `gamePlayers GamePlayer[]` and on `CardDefinition`: `draws CardDraw[]`.

- [ ] **Step 2: Migrate**

```bash
cd toeic-millionaire
npx prisma migrate dev --name init
npx prisma generate
```

- [ ] **Step 3: Commit**

```bash
git add toeic-millionaire/prisma toeic-millionaire/src/shared/db
git commit -m "$(cat <<'EOF'
feat(toeic): add Prisma schema for P1 game

EOF
)"
```

---

### Task 3: Board config + game FSM (pure)

**Files:**
- Create: `toeic-millionaire/board/tiles.json` (40 entries)
- Create: `toeic-millionaire/src/features/game/fsm.ts`
- Create: `toeic-millionaire/src/features/game/fsm.test.ts`
- Create: `toeic-millionaire/src/features/game/types.ts`

**Interfaces:**
- Produces:
  - `loadTiles(): TileDefinition[]`
  - `rollDice(): number` (1–6)
  - `advancePosition(current: number, steps: number, lap: number): { position: number; lap: number; passedStart: boolean }`
  - `resolveTile(tile: TileDefinition): TileAction`
  - `checkWin(players: PlayerState[], rules: WinRules): string | null` → winner playerId or null

- [ ] **Step 1: Failing tests**

```ts
// toeic-millionaire/src/features/game/fsm.test.ts
import { describe, it, expect } from 'vitest';
import { advancePosition, rollDice, checkWin } from './fsm';

describe('advancePosition', () => {
  it('wraps board and increments lap when passing START', () => {
    const r = advancePosition(38, 4, 0, 40);
    expect(r.position).toBe(2);
    expect(r.lap).toBe(1);
    expect(r.passedStart).toBe(true);
  });
});

describe('checkWin', () => {
  it('wins on 2 laps', () => {
    const winner = checkWin(
      [{ id: 'p1', lap: 2, coins: 1000, turns: 5 }],
      { lapsToWin: 2, maxTurnsPerPlayer: 30 }
    );
    expect(winner).toBe('p1');
  });
});
```

- [ ] **Step 2: Implement `fsm.ts` + `board/tiles.json`**

Tile JSON entry shape:

```json
{ "id": 1, "type": "VOCABULARY", "label": "Vocabulary", "labelTh": "คำศัพท์" }
```

Include all 40 types from spec §5 rotation.

- [ ] **Step 3: Run tests PASS**

```bash
npm test
```

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(toeic): board tiles config and game FSM

EOF
)"
```

---

### Task 4: Seed scripts (cards + starter questions)

**Files:**
- Create: `toeic-millionaire/prisma/data/cards.json` (40 cards)
- Create: `toeic-millionaire/prisma/data/questions/vocabulary.json` (start 50 for dev; expand to 200)
- Create: `toeic-millionaire/prisma/seed.ts`
- Create: `toeic-millionaire/prisma/validate-questions.ts`

**Interfaces:**
- Produces: `npm run db:seed` inserts cards + questions; validation ensures 4 choices, exactly 1 correct

Question JSON shape:

```json
{
  "category": "VOCABULARY",
  "difficulty": "EASY",
  "stem": "Choose the word that best completes the sentence: Hello, ___ are you?",
  "passage": null,
  "explanation": "'How' is used to ask about condition.",
  "hint": "Think about a question word for condition.",
  "choices": [
    { "label": "how", "isCorrect": true },
    { "label": "what", "isCorrect": false },
    { "label": "when", "isCorrect": false },
    { "label": "where", "isCorrect": false }
  ]
}
```

**Note:** Task 4 ships **50 questions per category (250 total)** for dev bootstrap; Task 4b (optional follow-up) expands to full 700 without blocking gameplay loop.

- [ ] **Step 1: Validation test**

```ts
// prisma/validate-questions.test.ts — assert each file valid
```

- [ ] **Step 2: `seed.ts` import all JSON**
- [ ] **Step 3: `npm run db:seed` succeeds**
- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(toeic): seed cards and starter question bank

EOF
)"
```

---

### Task 5: Game API (start, roll, state, end)

**Files:**
- Create: `app/api/game/start/route.ts`
- Create: `app/api/game/[id]/roll/route.ts`
- Create: `app/api/game/[id]/state/route.ts`
- Create: `app/api/game/[id]/end/route.ts`
- Create: `src/features/game/game-service.ts`
- Create: `src/features/game/game-service.test.ts`

**Interfaces:**
- Consumes: FSM from Task 3, Prisma from Task 2
- Produces:
  - `POST /api/game/start` body `{ guestId?, displayName, difficulty, botCount }` → `{ sessionId, state }`
  - `POST /api/game/[id]/roll` → `{ dice, newState, tileAction }`
  - `GET /api/game/[id]/state` → full snapshot

Bot AI P1: on bot turn, auto-roll after 800ms delay (client-triggered `POST roll?playerId=bot` with server accepting only current player)

- [ ] **Step 1: Service tests with test DB or mocked prisma**
- [ ] **Step 2: Implement routes with Zod validation**
- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(toeic): game session API start roll state end

EOF
)"
```

---

### Task 6: Quiz API + adaptive difficulty

**Files:**
- Create: `app/api/quiz/next/route.ts`
- Create: `app/api/quiz/answer/route.ts`
- Create: `src/features/quiz/grade.ts`
- Create: `src/features/quiz/quiz-service.ts`
- Create: `src/features/quiz/quiz-service.test.ts`

**Interfaces:**
- `GET /api/quiz/next?sessionId=&category=&difficulty=` → `{ questionId, stem, passage, audioUrl, choices: [{id, label}], quizType }` (**no isCorrect**)
- `POST /api/quiz/answer` body `{ sessionId, playerId, questionId, choiceId, responseMs }` → `{ isCorrect, coinsDelta, expDelta, explanation, streak }`

Adaptive rules (spec §7): track streak in session JSON or derive from last attempts; bump difficulty up/down.

Scoring P1:
- Correct: +150 coins, +25 exp (+300/+50 boss)
- Wrong: -75 coins (min 0), set `skipNext=true`

- [ ] **Step 1: TDD grade + adaptive**
- [ ] **Step 2: Routes**
- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(toeic): quiz next and answer API with adaptive difficulty

EOF
)"
```

---

### Task 7: Thai translation API + quiz UI components

**Files:**
- Create: `app/api/quiz/[questionId]/translation/route.ts`
- Create: `src/features/quiz/translate-service.ts`
- Create: `src/features/quiz/translate-service.test.ts`
- Create: `src/features/quiz/components/TranslateThButton.tsx`
- Create: `src/features/quiz/components/QuestionThPanel.tsx`
- Create: `src/features/quiz/QuizModal.tsx`

**Interfaces:**
- `GET /api/quiz/[questionId]/translation` → `{ stemTh, passageTh?, choicesTh: [{ choiceId, labelTh }] }`
- `translateQuestion(questionId): Promise<TranslationResult>` — cache-first, LLM fallback

LLM prompt (translate-service):

```ts
const SYSTEM = `You translate TOEIC exam content from English to Thai for learners.
Return ONLY JSON: {"stemTh":"...","passageTh":"...|null","choicesTh":[{"choiceId":"...","labelTh":"..."}]}
Do NOT reveal which choice is correct. Do NOT add explanations.`;
```

UI:
- Button top-right of QuizModal: 「🇹🇭 แปลเป็นภาษาไทย」
- Toggle shows `QuestionThPanel` below EN content
- Cache translation in React Query key `['translation', questionId]`

- [ ] **Step 1: Test cache hit path (mock prisma + mock LLM)**
- [ ] **Step 2: API route**
- [ ] **Step 3: UI components wired into QuizModal**
- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(toeic): Thai translate button and cached translation API

EOF
)"
```

---

### Task 8: AI hint + explanation

**Files:**
- Create: `src/features/ai/openai-client.ts`
- Create: `src/features/quiz/hint-service.ts`
- Modify: `app/api/quiz/answer/route.ts` (attach AI explanation enrich)
- Create: `app/api/quiz/hint/route.ts`

**Interfaces:**
- `POST /api/quiz/hint` `{ questionId, sessionId, playerId }` → `{ hint, coinsDelta: -5 }`
- Answer response includes `explanationTh` optional LLM enrich

Guardrails: strip/validate LLM output; never include correct choice letter.

- [ ] **Step 1: Implement with mock in tests**
- [ ] **Step 2: Wire QuizModal hint button + post-answer explanation panel**
- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(toeic): AI hint and explanation for quiz

EOF
)"
```

---

### Task 9: Card draw API + modal

**Files:**
- Create: `app/api/cards/draw/route.ts`
- Create: `src/features/cards/card-service.ts`
- Create: `src/features/cards/CardDrawModal.tsx`
- Create: `src/features/cards/effects.ts`

**Interfaces:**
- `POST /api/cards/draw` `{ sessionId, playerId, deck: 'LUCKY'|'EVENT' }` → `{ card, effectResult }`
- `applyCardEffect(session, player, effect): GameStatePatch`

- [ ] **Step 1: Effect unit tests (coins, skipTurn, move)**
- [ ] **Step 2: API + flip animation modal**
- [ ] **Step 3: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(toeic): lucky and event card draw system

EOF
)"
```

---

### Task 10: Board UI + game loop (frontend)

**Files:**
- Create: `app/(marketing)/page.tsx`
- Create: `app/(game)/play/page.tsx`
- Create: `app/(game)/board/[sessionId]/page.tsx`
- Create: `src/features/board/BoardCanvas.tsx`
- Create: `src/features/board/TokenAnimator.tsx`
- Create: `src/features/player/Hud.tsx`
- Create: `src/features/game/useGameStore.ts` (Zustand)
- Create: `src/features/game/useGameSession.ts` (React Query)

**Flow:**
1. Landing → Play as Guest (set guestId)
2. Lobby → difficulty + bot count → `POST /api/game/start` → redirect `/board/[sessionId]`
3. Board: Roll button → animate dice → move token → resolve tile → open QuizModal / CardDrawModal
4. End screen when win/turn cap

Animations: Framer Motion dice + token path; confetti on correct (canvas-confetti optional dep)

- [ ] **Step 1: Static board renders 40 tiles from JSON**
- [ ] **Step 2: Wire roll/quiz/card modals**
- [ ] **Step 3: Manual smoke localhost:3001**
- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(toeic): board UI and solo game loop

EOF
)"
```

---

### Task 11: Guest auth + Supabase merge

**Files:**
- Create: `src/features/auth/guest-id.ts`
- Create: `src/features/auth/supabase-client.ts`
- Create: `app/(auth)/login/page.tsx`
- Create: `app/api/profile/merge/route.ts`

**Interfaces:**
- `getGuestId(): string` — localStorage `toeic_guest_id`
- `POST /api/profile/merge` `{ guestId }` + Supabase session → merge PlayerProfile

Use `@supabase/ssr` for Next.js 15 cookie sessions.

- [ ] **Step 1: Guest profile created on game start if missing**
- [ ] **Step 2: Login page + merge after auth**
- [ ] **Step 3: End-game CTA "Login to save progress"**
- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(toeic): guest play and Supabase profile merge

EOF
)"
```

---

### Task 12: MLTCENTERS Navbar link

**Files:**
- Modify: `src/components/Navbar.tsx`
- Modify: `src/lib/i18n.tsx`

- [ ] **Step 1: Add nav item**

```tsx
import { Trophy } from 'lucide-react';
// ...
{ label: t.nav.toeicGame[lang], path: process.env.NEXT_PUBLIC_TOEIC_GAME_URL || 'https://toeic.mltcenters.com', icon: Trophy, external: true },
```

- [ ] **Step 2: i18n**

```ts
toeicGame: { th: 'TOEIC Millionaire', en: 'TOEIC Millionaire' },
```

- [ ] **Step 3: `.env.example` add `NEXT_PUBLIC_TOEIC_GAME_URL=http://localhost:3001`**
- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
feat(toeic): add TOEIC Millionaire link to MLTCENTERS navbar

EOF
)"
```

---

### Task 13: Admin CRUD + docs + deploy

**Files:**
- Create: `app/(admin)/questions/page.tsx`
- Create: `app/api/admin/questions/route.ts`
- Create: `toeic-millionaire/README.md`
- Create: `toeic-millionaire/docs/DEPLOY.md`
- Create: `e2e/guest-flow.spec.ts` (Playwright)

- [ ] **Step 1: Admin guard via Supabase email allowlist**
- [ ] **Step 2: List/create/edit questions (stem, choices, explanation)**
- [ ] **Step 3: README + DEPLOY (Vercel + Supabase steps)**
- [ ] **Step 4: Playwright smoke: guest → lobby → start (mock quiz if needed)**
- [ ] **Step 5: Commit**

```bash
git commit -m "$(cat <<'EOF'
docs(toeic): admin CRUD, README, and deployment guide

EOF
)"
```

---

## Spec Coverage (self-review)

| Spec requirement | Task |
|------------------|------|
| Separate Next.js app | 1 |
| 40 tiles board | 3, 10 |
| Solo vs AI | 5, 10 |
| TOEIC quiz categories | 4, 6 |
| Adaptive difficulty | 6 |
| Thai translate button | 7 |
| AI hint/explanation | 8 |
| Lucky/Event 40 cards | 4, 9 |
| 700 questions | 4 (250 bootstrap + expand note) |
| Guest G3 + merge | 11 |
| Coins/EXP/win rules | 3, 5, 6 |
| Glassmorphism UI/animations | 10 |
| Sound hooks | 10 (add `/public/sfx` placeholders) |
| Admin CRUD | 13 |
| MLTCENTERS Navbar | 12 |
| Deploy Vercel+Supabase | 13 |
| No property/multiplayer | excluded |

**Gap note:** Full 700 questions — Task 4 ships 250 for playable dev; add **Task 4b** before prod launch to reach 700 counts per spec §10.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-27-toeic-millionaire-p1.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks  
2. **Inline Execution** — run tasks in this session with checkpoints  

Which approach?

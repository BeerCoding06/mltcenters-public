# TOEIC Millionaire Challenge — Design Spec (Phase 1: Solo Board)

**วันที่:** 2026-07-27  
**สถานะ:** approved (2026-07-27)  
**โปรเจกต์:** แอป Next.js แยก (`toeic-millionaire/`) เชื่อมจาก MLTCENTERS  
**Phase:** P1 — Solo Board (Monopoly-style + TOEIC quiz loop, ไม่มี realtime)

---

## 1. Product Overview

### วิสัยทัศน์
**TOEIC Millionaire Challenge** — เกมกระดานแบบ Monopoly ที่ผู้เล่นทอยลูกเต๋า เดินบนกระดาน 40 ช่อง ตอบคำถาม TOEIC รับ coins/EXP เปิดการ์ด Lucky/Event และแข่งกับ AI หรือตัวเองเพื่อเป็น TOEIC Champion

### เป้าหมายการเรียนรู้
- Vocabulary, Grammar, Reading, Listening, Business English (Email/Meeting)
- Adaptive difficulty (Phase 1: rule-based; Phase 2+: ML)

### ตำแหน่งใน MLTCENTERS
| ระบบเดิม | ความสัมพันธ์ |
|---------|---------------|
| Navbar | เมนูใหม่ “TOEIC Millionaire” → external link (pattern เดียวกับ Runner) |
| `/vocab` | **เก็บไว้** Phase 1 — ไม่ลบ; อาจ redirect หรือ CTA ภายหลัง |
| `/assessment` | แนะนำ level เริ่มต้นใน onboarding เกม (optional Phase 1.1) |
| Analytics MLTCENTERS | ติดตาม `toeic_game_*` events บน landing ถ้าฝัง iframe ไม่ได้ |

### ผู้เล่นเป้าหมาย
- นักเรียน / นศ. ที่เตรียม TOEIC
- คนทำงานที่อยากฝึก Business English แบบสนุก

---

## 2. Decisions Locked

| หัวข้อ | การตัดสิน |
|--------|-----------|
| Integration | **A** — โปรเจกต์ Next.js แยก |
| MVP scope | **P1** — Solo Board |
| Auth | **G3 Hybrid** — เล่น guest ได้ทันที; login Supabase เพื่อ sync progress |
| Quiz UI | **ปุ่มแปลไทยในโจทย์** — toggle แปล stem/passage/choices เป็นภาษาไทย (cache + LLM fallback) |
| Stack | Next.js 15, React 19, TS, Tailwind, Shadcn, Framer Motion, Zustand, React Query, Supabase Auth+Realtime (P2), Prisma, PostgreSQL, OpenAI API, Zod, RHF, Lucide, PWA shell |

---

## 3. Phase 1 Scope

### รวม (P1)
- กระดาน **40 tiles** (START + 39 ช่องตาม spec หลัก — simplified behavior บางช่อง)
- **Solo vs AI** (1 ผู้เล่น + 1–3 AI bots ง่าย)
- ทอยลูกเต๋า → เคลื่อนที่ → event ตาม tile
- **Quiz spaces:** Vocabulary, Grammar, Reading, Listening, Business Email, Random Question, Boss Quiz (hard)
- **Special tiles:** Lucky Card, Event Card, Bonus, Tax, Rest (skip turn), Gold/Diamond Chest (bonus coins)
- **Mini placeholder:** Exam Center (bonus quiz), Library/English Camp (hint ฟรี 1 ครั้ง)
- Player: coins, EXP, level, title, badges พื้นฐาน, stats session
- **Lucky/Event cards:** seed **40 การ์ด** (ขยาย 200 ใน P2)
- Question bank seed **700 ข้อ** (ไม่ใช่ 3500 ใน P1 — ดู §10)
- AI: Explanation + Hint หลังตอบ (OpenAI/Groq compatible)
- **ปุ่ม「แปลเป็นภาษาไทย」ในโจทย์** — แปล stem / passage / ตัวเลือก แบบ toggle; cache ใน DB; ไม่เปิดเผยคำตอบ
- Guest profile + optional Supabase login merge
- Dark/Light mode, glassmorphism UI, dice/move animations
- Sound hooks (SFX toggle; BGM optional off by default)
- Admin ขั้นต่ำ: CRUD questions (protected route)
- README + deployment guide (Vercel + Supabase + Postgres)

### ไม่รวม (Phase 2+)
- Property purchase / rent / upgrade
- Online multiplayer / Tournament / Rank Match
- Shop (skins, dice, board themes)
- 200 Lucky cards เต็ม, 3500 questions เต็ม
- Friends leaderboard, missions season, inventory power cards
- Full admin dashboard charts

---

## 4. User Flow (P1)

### 4.1 Guest play
```
MLTCENTERS Navbar → toeic.mltcenters.com (or /game)
  → Landing / Play as Guest
  → Choose difficulty band (Easy / Medium / Hard)
  → Solo vs AI (1–3 bots)
  → Game board
  → Loop: Roll → Move → Tile event → (Quiz?) → Update coins/EXP
  → Win condition: first to pass START N laps OR highest coins at turn limit
  → End screen → CTA "Login to save progress"
```

### 4.2 Login merge (G3)
```
Guest มี guestId ใน localStorage
  → User signs in (Supabase Email/Google)
  → POST /api/profile/merge { guestId }
  → รวม coins, exp, stats, game history
```

### 4.3 Quiz tile loop
```
Land on Quiz tile
  → Fetch question (category + adaptive difficulty)
  → Timer optional (45s P1)
  → [Optional] กดปุ่ม「แปลเป็นภาษาไทย」→ แสดงคำแปลไทยใต้โจทย์ (toggle กลับ EN ได้)
  → Submit answer
  → Correct: +coins, +exp, streak++
  → Wrong: -coins (min 0), skip next turn OR penalty tile
  → AI explanation panel (expandable)
  → Resume board
```

---

## 5. Board Design (40 Tiles)

ลำดับแบบ Monopoly วน clockwise จาก START (index 0):

| Index | Tile Type | P1 Behavior |
|-------|-----------|-------------|
| 0 | START | เก็บ salary coins เมื่อผ่าน |
| 1–39 | Mixed | ดู mapping ด้านล่าง |

**Category rotation (39 spaces after START):**

```
Vocabulary → Grammar → Reading → Listening → Business Email →
Business Meeting → Airport → Hotel → Company → Promotion → Salary →
Library → English Camp → Exam Center → Lucky Card → Event Card →
Bonus → Tax → Rest → Mini Game → Boss Quiz → Challenge →
Random Question → Gold Chest → Diamond Chest → Treasure →
(repeat pattern with variation)
```

P1 implementation: **JSON board config** `board/tiles.json` — 40 entries `{ id, type, label, category?, quizWeight? }`

### Tile behaviors (P1)

| Type | Effect |
|------|--------|
| START | +200 coins เมื่อผ่าน |
| Quiz categories | Trigger quiz ของ category นั้น |
| Lucky Card | สุ่มจาก deck 40 |
| Event Card | สุ่ม event (positive/negative) |
| Bonus | +coins/EXP |
| Tax | -coins |
| Rest | Skip turn |
| Boss Quiz | Hard quiz, x2 reward |
| Chest/Treasure | Random bonus |
| Mini Game | Placeholder: quick 1-question streak |
| Airport/Hotel/Company/... | P1: **flavor tile** → Random Question หรือ Bonus (property ใน P2) |

---

## 6. Game Engine (Client + Server)

### Architecture
```
┌─────────────────────────────────────────────────────────┐
│ Next.js App (App Router)                                 │
│  ├─ features/board/     UI + animations                  │
│  ├─ features/game/      Zustand store, turn FSM          │
│  ├─ features/quiz/      Question UI, timer, submit      │
│  ├─ features/cards/     Lucky/Event deck                 │
│  ├─ features/player/    Coins, EXP, level               │
│  └─ features/auth/      Supabase + guest merge           │
└──────────────────────────┬──────────────────────────────┘
                           │ React Query
┌──────────────────────────▼──────────────────────────────┐
│ Next.js Route Handlers /api/*                            │
│  game/start, game/turn, game/quiz, game/card, game/end   │
│  questions/*, profile/merge, admin/*                       │
└──────────────────────────┬──────────────────────────────┘
                           │ Prisma
┌──────────────────────────▼──────────────────────────────┐
│ PostgreSQL (Supabase)                                    │
└─────────────────────────────────────────────────────────┘
                           │ OpenAI API
┌──────────────────────────▼──────────────────────────────┐
│ AI Service (explanation, hint)                           │
└─────────────────────────────────────────────────────────┘
```

### Turn state machine
```
WAIT_ROLL → ROLLING → MOVING → TILE_RESOLVING → (QUIZ_ACTIVE) → TURN_END → NEXT_PLAYER
```

Server authoritative สำหรับ P1 Solo: client แสดง animation แต่ **server validate** dice, position, answer (anti-cheat พื้นฐาน)

### Win conditions (P1)
- **Laps:** ผู้เล่นคนแรกครบ 2 รอบ START ชนะ  
- **Turn cap:** 30 turns/ผู้เล่น — ชนะจาก coins สูงสุด

---

## 7. Question System (P1)

### Types (P1 subset)

| Type | Format |
|------|--------|
| Vocabulary | MCQ 4 choices |
| Grammar | MCQ |
| Reading | Short passage + MCQ |
| Listening | Audio URL + MCQ |
| Business Email | MCQ (tone/grammar/vocab) |
| Sentence Completion | MCQ |
| Error Identification | MCQ (underline error) |

Image/Audio question: P1 รองรับ schema; seed 20% มี audio_url

### Difficulty
- Easy / Medium / Hard tags
- **Adaptive P1:** ถ้าถูก 3 ครั้งติด → ขึ้น 1 ระดับ; ผิด 2 ครั้งติด → ลง 1 ระดับ

### Question model
```prisma
model Question {
  id            String   @id @default(cuid())
  category      QuestionCategory
  type          QuestionType
  difficulty    Difficulty
  stem          String   // HTML/markdown safe
  passage       String?
  audioUrl      String?
  imageUrl      String?
  explanation   String
  hint          String?
  stemTh        String?  // optional pre-seeded Thai (admin/seed)
  passageTh     String?
  active        Boolean  @default(true)
  choices       Choice[]
  translation   QuestionTranslation?  // cached LLM Thai
  createdAt     DateTime @default(now())
}

model QuestionTranslation {
  id            String   @id @default(cuid())
  questionId    String   @unique
  stemTh        String
  passageTh     String?
  choicesTh     Json     // [{ choiceId, labelTh }]
  source        String   @default("llm") // llm | seed | admin
  createdAt     DateTime @default(now())
}

model Choice {
  id          String   @id @default(cuid())
  questionId  String
  label       String   // A/B/C/D text
  isCorrect   Boolean
  sortOrder   Int
}
```

---

## 8. Player & Progress (G3 Hybrid)

### Guest
- `guestId` (uuid) ใน localStorage
- Server สร้าง `GuestProfile` หรือ `User` แบบ `isGuest=true`
- Progress: coins, exp, level, stats เก็บ DB ผูก guestId

### Authenticated
- Supabase Auth (Email + Google OAuth)
- `User` record ผูก `supabaseUserId`
- Merge: copy guest stats → user, deactivate guest

### Player stats (P1)
```prisma
model PlayerProfile {
  id              String   @id @default(cuid())
  userId          String?  @unique
  guestId         String?  @unique
  displayName     String
  coins           Int      @default(1500)
  diamonds        Int      @default(0)
  exp             Int      @default(0)
  level           Int      @default(1)
  title           String   @default("Rookie")
  vocabAccuracy   Float    @default(0)
  grammarAccuracy Float    @default(0)
  readingAccuracy Float    @default(0)
  listeningAccuracy Float  @default(0)
  gamesPlayed     Int      @default(0)
  gamesWon        Int      @default(0)
}
```

---

## 9. Card System (P1: 40 cards)

### Deck types
- **LuckyCard** — ส่วนใหญ่ positive
- **EventCard** — mixed

### Schema
```prisma
model CardDefinition {
  id          String   @id @default(cuid())
  deck        CardDeck // LUCKY | EVENT
  title       String
  body        String
  effect      Json     // { type: "coins", amount: 200 } etc.
  weight      Int      @default(1)
}
```

### Sample effects
- `{ type: "coins", amount: 300 }`
- `{ type: "exp", amount: 50 }`
- `{ type: "move", steps: 3 }`
- `{ type: "skipTurn" }`
- `{ type: "bonusQuiz", category: "grammar" }`

---

## 10. Question Bank Seed (P1 targets)

| Category | P1 Count | Full (later) |
|----------|----------|--------------|
| Vocabulary | 200 | 1000 |
| Grammar | 200 | 1000 |
| Reading | 100 | 500 |
| Listening | 100 | 500 |
| Business English | 100 | 500 |
| **Total** | **700** | **3500** |

Seed script: `prisma/seed.ts` + JSON importers + validation (exactly 4 choices, 1 correct)

---

## 11. AI Features (P1)

| Feature | P1 |
|---------|-----|
| **Translate to Thai (in-quiz button)** | ✅ ปุ่มใน modal โจทย์ — แปล stem, passage, ตัวเลือก A–D |
| AI Explanation | ✅ หลังตอบ — ขยายจาก `question.explanation` + LLM |
| AI Hint | ✅ ก่อนตอบ (1 hint/ข้อ, -5 coins) |
| AI Tutor chat | ❌ P2 |
| AI Study Plan | ❌ P2 |
| AI Weakness Analysis | ❌ P2 (เก็บ stats พื้นฐาน P1) |

### 11.1 ปุ่ม「แปลเป็นภาษาไทย」(P1 — required)

**UX**
- ปุ่มใน Quiz modal มุมขวาบนใต้ timer: **「🇹🇭 แปลเป็นภาษาไทย」** / toggle **「EN」** กลับภาษาอังกฤษ
- แสดงคำแปลใต้ข้อความ EN ต้นฉบับ (ไม่แทนที่ — dual display เพื่อเรียนรู้)
- แปล: `stem`, `passage` (ถ้ามี), ข้อความตัวเลือก A–D (ไม่เปลี่ยน label A/B/C/D)
- Loading skeleton ขณะเรียก API; error แสดง toast + ปุ่ม retry
- **ฟรี** ใน P1 (ไม่หัก coins) — ช่วยผู้เรียนไทยเข้าใจโจทย์ก่อนตอบ
- Analytics: `quiz_translate_th_clicked`, `quiz_translate_th_success`

**Logic**
1. กดปุ่ม → `GET /api/quiz/[questionId]/translation?lang=th`
2. ถ้ามี `QuestionTranslation` หรือ `stemTh` ใน DB → คืนทันที
3. ถ้าไม่มี → เรียก LLM แปล (Groq/OpenAI) → บันทึก cache → คืน client
4. Toggle ปิด = ซ่อน panel ไทย (state ใน client; ไม่เรียก API ซ้ำ)

**LLM guardrails**
- System prompt: แปลเท่านั้น ห้ามเฉลย ห้ามบอกว่าข้อไหนถูก
- รักษาโครงสร้าง TOEIC (blank, underline error ยังเห็นในต้นฉบับ EN)
- ภาษาไทยเป็นทางการ-เข้าใจง่าย เหมาะกับนักเรียนไทย

**API**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/quiz/[questionId]/translation` | `{ stemTh, passageTh?, choicesTh[] }` |

**Component**
- `features/quiz/components/TranslateThButton.tsx`
- `features/quiz/components/QuestionThPanel.tsx`

Prompt guardrails (explanation/hint): ไม่ให้ LLM เปลี่ยนคำตอบที่ถูก; อธิบายสั้น 2–4 ประโยค ไทย+EN

Env: `OPENAI_API_KEY` or Groq-compatible `OPENAI_BASE_URL`

---

## 12. Database Schema (P1 tables)

```
User / GuestProfile (via PlayerProfile)
Question, Choice
CardDefinition
GameSession (solo vs ai)
GamePlayer (position, coins, lap, isBot)
TurnLog (dice, from, to, tile)
QuizAttempt (questionId, correct, timeMs)
CardDraw (cardId, sessionId)
CoinTransaction (delta, reason)
Achievement, PlayerAchievement (minimal P1: 5 badges)
```

**ไม่มีใน P1:** Property, PlayerProperty, GameRoom realtime, Inventory, Shop

---

## 13. API Routes (P1)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/game/start` | สร้าง session solo vs AI |
| POST | `/api/game/[id]/roll` | ทอยลูกเต๋า server-side |
| POST | `/api/game/[id]/move` | resolve position |
| GET | `/api/game/[id]/state` | board + players |
| GET | `/api/quiz/next` | `{ sessionId, category, difficulty }` |
| GET | `/api/quiz/[questionId]/translation` | คำแปลไทย (cache / LLM) |
| POST | `/api/quiz/answer` | grade + coins + log |
| POST | `/api/cards/draw` | lucky/event |
| POST | `/api/game/[id]/end` | finalize stats |
| POST | `/api/profile/merge` | guest → user |
| GET/POST | `/api/admin/questions` | CRUD (admin role) |

---

## 14. Frontend Structure (Feature-First)

```
toeic-millionaire/
├── app/
│   ├── (marketing)/page.tsx
│   ├── (game)/play/page.tsx
│   ├── (game)/board/[sessionId]/page.tsx
│   ├── (auth)/login/page.tsx
│   └── api/...
├── features/
│   ├── board/       components, hooks, types
│   ├── game/        store, services, fsm
│   ├── quiz/
│   ├── cards/
│   ├── player/
│   ├── auth/
│   └── admin/
├── shared/          ui wrappers, utils
├── prisma/
└── public/          sfx, board assets
```

---

## 15. UI / UX (P1)

### Visual direction — Who Wants to Be a Millionaire (TH) tone
อ้างอิงโทนจากเกมโชว์ **ใครอยากเป็นเศรษฐี** (dark studio + silver pill UI):

| Token | Hex | ใช้ที่ |
|-------|-----|--------|
| `--bg-deep` | `#05070F` → `#0A1628` | พื้นหลังเกม / studio |
| `--bg-panel` | `#000000` | กล่องโจทย์ / ตัวเลือก |
| `--border-silver` | `#C0C8D4` / `#E5E7EB` | ขอบโลหะบางรอบ pill |
| `--text-primary` | `#FFFFFF` | ข้อความโจทย์ / ตัวเลือก |
| `--accent-cyan` | `#5BC0FF` / `#7DD3FC` | ไฟ bokeh / highlight |
| `--accent-gold` | `#FBBF24` / `#EAB308` | lifeline icons, coins, titles |
| `--correct` | `#10B981` | ตอบถูก (glow green) |
| `--wrong` | `#EF4444` | ตอบผิด / lifeline used (X) |
| `--stage-glow` | soft cyan radial | ambient light behind board |

**UI shapes (quiz)**
- Question: กล่อง **pill** ยาว (มุมโค้งครึ่งวงกลม) พื้นดำ + ขอบเงินบาง
- Answers: pill 4 ช่อง จัด 2×2 ใต้โจทย์ — ตัวเลข `1.`–`4.` ชิดซ้าย
- Lifelines / helper icons: สี่เหลี่ยมขอบทอง มุมขวาบน (แปลไทย / hint / 50:50 ภายหลัง)
- Board HUD: dark glass + silver hairline; ไม่ใช้ pastel แบบเว็บหลัก

**Modes**
- **Default = Dark Millionaire** (primary P1 look)
- Light mode optional (ลด contrast) — ไม่บังคับใน P1 board screen

**Responsive:** mobile board zoom/pan; desktop full board

### Key screens
1. Landing — CTA Play Guest / Login (dark hero + cyan glow)
2. Lobby — difficulty, AI count, start
3. Board — tiles, avatars, dice, HUD (coins, exp, turn)
4. Quiz modal — pill Q&A, timer, **ปุ่มแปลไทย**, hint, explanation
5. Card draw — flip animation
6. End game — stats, login CTA, play again

### Animations (Framer Motion)
- Dice roll (3D CSS or sprite)
- Token move along path
- Coins pop + confetti on correct
- Card flip
- Answer select: silver border → gold/cyan pulse; correct = green fill

### Accessibility
- Keyboard: 1–4 เลือก choice, Enter submit
- `aria-live` สำหรับ turn changes
- Reduced motion respect
- Contrast: white on black meets WCAG AA

---

## 16. Sound (P1)

| Event | File |
|-------|------|
| Dice | `/sfx/dice.mp3` |
| Correct | `/sfx/correct.mp3` |
| Wrong | `/sfx/wrong.mp3` |
| Coins | `/sfx/coins.mp3` |
| Victory | `/sfx/victory.mp3` |

Mute toggle ใน settings; BGM off default

---

## 17. MLTCENTERS Integration

### Navbar change (mltcenters repo)
```tsx
{ label: t.nav.toeicGame[lang], path: 'https://toeic.mltcenters.com', icon: Trophy, external: true }
```

i18n: `nav.toeicGame` — TH: "TOEIC Millionaire" / EN: "TOEIC Millionaire"

### Optional `/vocab` banner
- CTA "ลองเกม TOEIC Millionaire" → external link (P1.1)

---

## 18. Deployment

| Layer | Target |
|-------|--------|
| App | Vercel (Next.js 15) |
| DB + Auth | Supabase (Postgres + Auth) |
| ORM | Prisma migrate |
| Storage | Supabase Storage (audio/images) |
| Domain | `toeic.mltcenters.com` CNAME → Vercel |

Env: `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `OPENAI_BASE_URL` (optional)

---

## 19. Security (P1)

- Server-side dice + answer validation
- Rate limit `/api/quiz/*`, `/api/game/*`
- Admin routes: Supabase role `admin` หรือ allowlist email
- RLS Supabase: user อ่านได้เฉพาะ profile ตัวเอง
- Zod validate ทุก API body

---

## 20. Testing (P1)

- Unit: game FSM, tile resolver, scoring
- Integration: API game loop with test DB
- E2E (Playwright): guest start → roll → quiz → end
- Seed validation script

---

## 21. Roadmap After P1

| Phase | Focus |
|-------|--------|
| P2 | Property system, 200 cards, 1500+ questions |
| P3 | Online multiplayer (Supabase Realtime), rooms |
| P4 | Tournament, rank match, shop, full admin dashboard |
| P5 | Full 3500 questions, missions season, PWA offline shell |

---

## 22. Success Metrics (P1)

| Metric | Target |
|--------|--------|
| Session completion rate | ≥ 50% |
| Avg quiz accuracy | tracked |
| Guest → login conversion | ≥ 10% |
| Avg session length | ≥ 8 min |

---

## 23. Risks

1. **Scope creep** — P1 ต้องไม่ใส่ property/multiplayer  
2. **700 questions quality** — ต้องมี editorial pipeline  
3. **Board UX บน mobile** — ต้อง pan/zoom ดี  
4. **Two repos deploy** — MLTCENTERS + toeic-millionaire  

---

## ขั้นตอนถัดไป

1. รีวิว spec นี้ → ตอบ **`spec approved`**  
2. เขียน implementation plan (scaffold Next.js → DB → board → quiz → AI → deploy)  
3. สร้าง repo `toeic-millionaire/` + แก้ Navbar MLTCENTERS  

---

**กรุณารีวิวแล้วตอบ `spec approved` หรือบอกจุดที่ต้องการแก้**

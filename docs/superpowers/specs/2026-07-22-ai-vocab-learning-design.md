# ระบบจำคำศัพท์ AI (AI Vocabulary Learning Platform) — Design Spec

**วันที่:** 2026-07-22  
**สถานะ:** approved (2026-07-22)  
**โปรเจกต์:** ฝังใน MLTCENTERS (ตัวเลือก A)  
**แนวทาง:** Module ใน React + Express เดิม เส้นทาง `/vocab/*`

---

## 1. Product Overview

### วิสัยทัศน์
สร้าง **AI Personal English Tutor** สำหรับท่องศัพท์ ไม่ใช่แค่แฟลชการ์ด — ระบบต้องสอน ทดสอบ วิเคราะห์ความจำ ทำนายคำที่ลืม สร้างประโยค/เรื่องราว/แชท และปรับแผนเรียนอัตโนมัติ

### กลุ่มเป้าหมาย
| กลุ่ม | ความต้องการหลัก |
|------|------------------|
| นักเรียน / นศ. | ศัพท์พื้นฐาน → สอบ / สื่อสาร |
| คนทำงาน | Business / ใช้จริงในงาน |
| TOEIC learners | เป้าหมายคะแนน + คำ high-frequency |
| ผู้เรียนทั่วไป | จำได้นาน เรียนสนุก มีสตรีค |

### คุณค่าหลัก (Value Proposition)
1. **จำได้นาน** — Spaced Repetition + Memory Score  
2. **ใช้เป็น** — ประโยค/เรื่อง/แชทจากคำที่จำแล้วเท่านั้น  
3. **รู้จุดอ่อน** — Weak/Strong + แผนรีวิวอัตโนมัติ  
4. **มองเห็นความก้าวหน้า** — Dashboard + ประมาณคะแนน TOEIC  

### ตำแหน่งใน MLTCENTERS
| ระบบเดิม | ความสัมพันธ์ |
|---------|---------------|
| `/assessment` | ประเมิน speaking → แนะนำ Level คำศัพท์เริ่มต้น |
| `/runner-app` | เกมฝึกอ่าน → ดึงคำจาก bank เดียวกันได้ในอนาคต |
| Analytics | ติดตาม `vocab_*` events |
| i18n TH/EN | UI รองรับสองภาษา (เนื้อหาคำ = EN + ความหมาย TH) |

---

## 2. User Flow

### 2.1 First-time learner
```
เข้า /vocab
  → Onboarding (เป้าหมาย: General / TOEIC / Travel)
  → เลือก Level เริ่ม (หรือ AI แนะนำจาก Assessment)
  → Placement mini-quiz (20 ข้อ ทางเลือก)
  → สร้าง Learning Plan วันนี้
  → เข้า Dashboard
```

### 2.2 Daily loop (หลัก)
```
Dashboard
  → เรียนคำใหม่ (Learn)
  → Quiz ทันที (Active Recall)
  → Smart Review (คำที่ใกล้ลืม)
  → AI Sentence ของวัน (5 ประโยค)
  → (ทางเลือก) Story / Chat / Challenge
  → อัปเดต XP, Streak, Memory Score
```

### 2.3 Review loop
```
Notification / Dashboard “ต้องรีวิว N คำ”
  → Review Session (คละประเภทควิซ)
  → บันทึกผล → คำนวณ Next Review
  → ถ้าลืมซ้ำ → ลด Mastery + เพิ่มคิวเรียนใหม่
```

### 2.4 AI Chat loop
```
ผู้ใช้ถามภาษาไทย
  → AI ตอบภาษาอังกฤษด้วย known vocab เป็นหลัก
  → ถ้าต้องใช้คำใหม่ → highlight + อธิบาย + ใส่ learning queue
  → บันทึก chat_history + vocab ที่ใช้
```

---

## 3. Information Architecture

```
/vocab                          Dashboard
/vocab/onboarding               ตั้งเป้าหมาย / Level
/vocab/learn                    เรียนคำใหม่
/vocab/learn/:wordId            รายละเอียดคำ
/vocab/review                   Smart Review
/vocab/quiz                     เลือก/เริ่มควิซ
/vocab/quiz/:sessionId          ระหว่างทำควิซ
/vocab/sentences                AI Sentences วันนี้
/vocab/stories                  AI Stories
/vocab/chat                     AI Chat Tutor
/vocab/stats                    สถิติละเอียด
/vocab/report/weekly            รายงานสัปดาห์
/vocab/levels                   แผนที่ Level
/vocab/achievements             เหรียญ / ภารกิจ
/vocab/settings                 เป้าหมาย, โหมดมืด, แจ้งเตือน
```

---

## 4. Sitemap

```
MLTCENTERS
└── Vocab (AI Tutor)
    ├── Dashboard
    ├── Learn
    │   ├── Card / Detail
    │   └── Session complete
    ├── Review (SRS)
    ├── Quiz Hub
    │   ├── MCQ / Fill / Listen / Type / Match / Arrange / Image / AI Convo
    │   └── Results
    ├── AI Content
    │   ├── Sentences
    │   ├── Stories
    │   └── Chat
    ├── Progress
    │   ├── Stats
    │   ├── Weekly Report
    │   └── Levels
    └── Gamification
        ├── Achievements
        ├── Missions
        └── Leaderboard (optional phase 2)
```

---

## 5. Feature Breakdown

### 5.1 Dashboard
| องค์ประกอบ | แหล่งข้อมูล |
|-----------|-------------|
| Today's progress | learning_sessions + quiz_results วันนี้ |
| Words learned | user_word_statistics status ∈ {learning, reviewing, mastered} |
| Accuracy | correct/(correct+wrong) ช่วง 7 วัน |
| Weak / Strong | memory_score ต่ำ/สูง + forget_count |
| Streak | streaks table |
| Current Level | users.current_level_id |
| Estimated TOEIC | AI module TOEIC Prediction |
| Weekly / Monthly charts | aggregates |

### 5.2 Vocabulary Learning
ฟิลด์คำศัพท์: word, ipa, pos, meaning_th, image_url, audio_url, synonyms, antonyms, example_en, example_th, difficulty, category_id, tags[], frequency, level_id

โหมดเรียน:
- **Reveal card** (คำ → ความหมาย → ตัวอย่าง)
- **Listen first**
- **Image first**
- หลังการ์ดทุกใบ → micro-quiz 1 ข้อ (บังคับ Active Recall)

### 5.3 Quiz System
| ประเภท | คีย์ API | โน้ต |
|--------|----------|------|
| Multiple Choice | `mcq` | 4 ตัวเลือก |
| Fill in the Blank | `fill` | ประโยคตัวอย่าง |
| Listening | `listen` | เล่น audio → เลือก/พิมพ์ |
| Typing | `type` | พิมพ์คำให้ถูก |
| Match Pair | `match` | คำ ↔ ความหมาย |
| Arrange Sentence | `arrange` | เรียงคำในประโยค |
| Image Quiz | `image` | เลือกรูปที่ตรงคำ |
| AI Conversation Quiz | `ai_convo` | คุยสั้น ใช้คำเป้าหมาย |

ทุกคำตอบเก็บใน `quiz_results` + อัปเดต `user_word_statistics` + `review_schedule`

### 5.4–5.11
ครอบคลุมตาม Objectives: Memory Analysis, Smart Review (SRS), Sentence/Story Generator, Chat, Recommendation, Statistics, Weekly Report — รายละเอียดอัลกอริทึมอยู่ในหมวด 9–11

---

## 6. Database ER Diagram (แนวคิด)

```
users 1──* user_word_statistics *──1 vocabulary_words
vocabulary_levels 1──* vocabulary_words
categories 1──* vocabulary_words
vocabulary_words 1──* examples
vocabulary_words 1──* word_media (audio/images)
users 1──* learning_sessions 1──* quiz_results
users 1──* review_schedule
users 1──* generated_sentences
users 1──* generated_stories
users 1──* chat_history
users 1──* weekly_reports
users 1──* user_achievements *──1 achievements
users 1──1 streaks
users 1──* daily_missions
```

### ตารางหลัก (สรุปคอลัมน์สำคัญ)

**users** (ขยายจาก identity ที่มี หรือตาราง `vocab_profiles`)  
id, display_name, current_level_id, goal (`general|toeic|travel|business`), xp, coins, estimated_toeic, timezone, theme, created_at

**vocabulary_levels**  
id, code (`starter|basic|toeic|…`), name_th, name_en, target_word_count, sort_order

**vocabulary_words**  
id, level_id, word, ipa, pos, meaning_th, difficulty (1–5), frequency, category_id, tags_json, status (`active|draft`)

**categories**  
id, slug, name_th, name_en (verb/noun/adj/business/travel/food/emotion/technology/…)

**examples**  
id, word_id, sentence_en, sentence_th, grammar_note

**word_media**  
id, word_id, type (`audio|image`), url, source

**learning_sessions**  
id, user_id, mode (`learn|review|quiz|chat`), started_at, ended_at, words_count, correct_count, xp_earned

**quiz_results**  
id, session_id, user_id, word_id, quiz_type, is_correct, response_ms, confidence (1–5), user_answer, created_at

**user_word_statistics** (User Word Profile)  
id, user_id, word_id,  
seen_count, correct_count, wrong_count, accuracy,  
confidence, review_count, forget_count,  
learning_time_ms, avg_response_ms,  
memory_score, difficulty_score, mastery_level (0–5),  
status (`new|learning|reviewing|mastered|suspended`),  
learning_stage (`introduce|practice|recall|fluent`),  
last_review_at, next_review_at, updated_at  
UNIQUE(user_id, word_id)

**review_schedule**  
id, user_id, word_id, due_at, interval_days, ease_factor, priority, reason (`srs|weak|ai_predict`)

**generated_sentences** / **generated_stories**  
id, user_id, content_en, content_th, grammar_note, word_ids_json, difficulty, date_key, meta_json

**chat_history**  
id, user_id, role, content, word_ids_used_json, new_words_json, created_at

**weekly_reports**  
id, user_id, week_start, summary_th, weak_points_json, plan_json, toeic_delta, created_at

**achievements / badges / streaks / daily_missions**  
ตาม gamification มาตรฐาน (code, title, criteria_json, progress)

### Dual-mode storage (สอดคล้อง analytics)
- มี `DATABASE_URL` → PostgreSQL  
- ไม่มี → JSON/file store ชั่วคราวสำหรับ MVP local (ไม่แนะนำ production ระยะยาวสำหรับ vocab)

---

## 7. API Design

Base: `/api/vocab`

| Method | Path | คำอธิบาย |
|--------|------|----------|
| GET | `/dashboard` | สรุปแดชบอร์ด |
| GET | `/levels` | รายการ level |
| GET | `/words` | ค้นหา/กรองคำ (level, category, q) |
| GET | `/words/:id` | รายละเอียดคำ |
| POST | `/sessions` | เริ่ม session `{mode}` |
| POST | `/sessions/:id/answer` | ส่งคำตอบควิซ |
| POST | `/sessions/:id/complete` | จบ session |
| GET | `/review/queue` | คิวรีวิววันนี้ |
| GET | `/recommend/today` | แพ็กคำแนะนำวันนี้ |
| POST | `/ai/sentences` | สร้าง 5 ประโยค |
| POST | `/ai/stories` | สร้างเรื่องสั้น |
| POST | `/ai/chat` | แชทติวเตอร์ |
| GET | `/stats` | สถิติ daily/weekly/monthly/yearly |
| GET | `/reports/weekly` | รายงานสัปดาห์ล่าสุด |
| POST | `/reports/weekly/generate` | สั่งสร้างรายงาน |
| GET | `/achievements` | เหรียญ/ภารกิจ |
| POST | `/progress/sync` | sync หลังออฟไลน์ (อนาคต) |

### ตัวอย่าง payload คำตอบ
```json
{
  "wordId": "w_1024",
  "quizType": "mcq",
  "isCorrect": false,
  "responseMs": 4200,
  "confidence": 2,
  "userAnswer": "accept"
}
```

Response อัปเดต: `{ memoryScore, nextReviewAt, xpDelta, masteryLevel }`

---

## 8. AI Architecture

```
┌─────────────────────────────────────────┐
│ Presentation (React /vocab)             │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│ Vocab API Gateway (Express server/vocab)│
└─────────────────┬───────────────────────┘
       ┌──────────┼──────────┐
       ▼          ▼          ▼
┌──────────┐ ┌─────────┐ ┌──────────────┐
│ Learning │ │ Memory  │ │ AI Orchestr. │
│ Engine   │ │ Engine  │ │ (Groq/OpenAI)│
└──────────┘ └─────────┘ └──────┬───────┘
                                │
        ┌───────────────┬───────┴────────┬────────────┐
        ▼               ▼                ▼            ▼
   Recommend      Sentence/Story      Chat Tutor   Analytics/
   Engine         Generator           + highlight  TOEIC Predict
```

### AI Modules
| Module | หน้าที่ | Input หลัก |
|--------|---------|------------|
| Vocabulary Recommendation | คำใหม่/รีวิว/ชาเลนจ์วันนี้ | weak topics, due queue, goal |
| Sentence Generation | 5 ประโยค/วัน จาก known words | mastered∪reviewing high score |
| Story Generation | เรื่องสั้น/บทสนทนา | known words + difficulty |
| Conversation | แชท EN จำกัดคำศัพท์ | chat history + known set |
| Learning Analytics | สรุปพฤติกรรม | quiz_results aggregates |
| Memory Prediction | คำที่เสี่ยงลืม | memory curve features |
| Adaptive Review | จัดคิว + ประเภทควิซ | forget_count, response_ms |
| TOEIC Prediction | ประมาณคะแนน | vocab size × accuracy × level |
| Learning Coach | แผนรายวัน/สัปดาห์ | ทั้งหมดด้านบน |

### Guardrails
- Generated content ต้องแนบ `word_ids` ที่ใช้อ้างอิง  
- ห้ามใช้คำนอก known set เกินเกณฑ์ (เช่น >10% ใน story) โดยไม่ highlight  
- Cache ประโยค/เรื่องรายวันต่อ user+date เพื่อประหยัดค่า AI  

---

## 9. Learning Algorithm

### Stage machine ต่อคำ
`new → introduce → practice → recall → fluent (mastered)`

| Stage | เงื่อนไขเข้า | กิจกรรม |
|-------|-------------|---------|
| introduce | เห็นครั้งแรก | การ์ด + 1 MCQ |
| practice | correct ≥ 1 ใน 24ชม. | fill/type/listen |
| recall | accuracy ≥ 70% และ review ≥ 2 | SRS ระยะห่างเพิ่ม |
| fluent | memory_score ≥ 85 และ forget_count ต่ำ | บำรุงรักษา นานขึ้น |

### Daily budget (ปรับได้)
- คำใหม่: 10–20 (ตาม goal)  
- รีวิว due: ทุกคำที่ `next_review_at <= now` สูงสุด 50  
- AI sentences: 5  
- Story: 1 ทุก 2–3 วัน  

---

## 10. Memory Algorithm (Memory Score 0–100)

### สูตรแนวทาง (เวอร์ชันผลิต ปรับน้ำหนักได้)
```
memory_score =
  0.35 * accuracy_score +
  0.15 * speed_score +
  0.20 * recency_interval_score +
  0.15 * (100 - forget_penalty) +
  0.10 * confidence_score +
  0.05 * streak_stability
```

| องค์ประกอบ | การคำนวณย่อ |
|-----------|--------------|
| accuracy_score | `correct/(correct+wrong)*100` (ถ่วงน้ำหนัก 10 ครั้งล่าสุดมากขึ้น) |
| speed_score | เทียบกับ median response ของคำนั้น (เร็วพอดี = สูง, เดาเร็วผิดปกติ = ลด) |
| recency_interval_score | ถ้าทบทวนตามกำหนดและยังถูก = สูง; เลยกำหนด = ลดตามชั่วโมงที่เกิน |
| forget_penalty | `min(100, forget_count * 15)` |
| confidence_score | ค่าเฉลี่ย confidence เมื่อตอบถูก |
| streak_stability | ความสม่ำเสมอของการรีวิว 7 วัน |

### Mastery Level 0–5
| Level | Memory Score | ความหมาย |
|-------|--------------|----------|
| 0 | <20 | เพิ่งเจอ |
| 1 | 20–39 | จำสั้น |
| 2 | 40–59 | กำลังจำ |
| 3 | 60–74 | ใช้ได้ |
| 4 | 75–84 | แข็ง |
| 5 | ≥85 | Mastered |

### Next Review (SRS แบบ SM-2 ปรับแล้ว)
- ตอบถูก: `interval' = interval * ease_factor` (ease เริ่ม 2.3)  
- ตอบผิด: `interval = 0.5 day`, `ease *= 0.85`, `forget_count++`  
- AI Prediction สามารถดึง due เร็วขึ้นถ้า detected weak topic  

---

## 11. Recommendation Algorithm

### Today Pack = รวม 5 คิว
1. **Review due** — priority = `overdue_hours * (1 - memory_score/100)`  
2. **Weak rescue** — memory_score < 40 หรือ forget_count ≥ 2  
3. **New words** — ตาม level + category ที่อ่อน + frequency สูง  
4. **Story/Sentence fuel** — คำ borderline (60–80) เพื่อย้ำใช้จริง  
5. **Challenge** — คำยากขึ้น 1 ขั้น (ไม่เกิน 20% ของเซสชัน)  

### Category affinity
ถ่วงน้ำหนักหมวดที่ accuracy ต่ำในช่วง 14 วัน ให้ปรากฏในคำใหม่มากขึ้น

---

## 12. Dashboard Design

### Layout (Desktop)
```
┌──────────────────────────────────────────────┐
│ Header: Level · Streak · XP · TOEIC estimate │
├─────────────┬────────────────────────────────┤
│ Today Pack  │ Progress rings (learn/review)  │
│ CTA buttons │ Weekly sparkline               │
├─────────────┴────────────────────────────────┤
│ Weak words chips     │ Strong words chips    │
├──────────────────────┴───────────────────────┤
│ AI Coach tip (1 ประโยค) + Weekly report CTA  │
└──────────────────────────────────────────────┘
```

### Mobile
เรียงแนวตั้ง: Streak/XP → Today CTA ใหญ่ → Progress → Weak → Coach

---

## 13. UI Wireframe (หน้าหลัก)

### Learn Card
```
[Image]
Word          /IPA/
(pos) · difficulty
─────────────
[ แสดงความหมาย ]
ตัวอย่าง EN
คำแปล TH
[ Audio ] [ รู้แล้ว ] [ ยังไม่ชัวร์ ]
```

### Quiz
```
ความคืบหน้า ████░░ 4/10
คำถาม...
ตัวเลือก / ช่องพิมพ์
[ ส่งคำตอบ ]
```

### Chat
```
ข้อความผู้ใช้ (TH)
ข้อความ AI (EN)  คำใหม่อยู่ใน highlight
[ความหมายสั้น] [เพิ่มเข้าคิว]
```

---

## 14. UX Flow (หลักการ)

1. **หนึ่งเป้าหมายต่อหน้าจอ** — วันนี้ทำอะไรต่อชัดเจน  
2. **ตอบแล้วรู้ผลทันที** — feedback < 300ms หลังตรวจ  
3. **ไม่ลงโทษเกิน** — ผิดแล้วได้รีวิว ไม่ลด streak ทันทีถ้าเข้าแอป  
4. **AI โปร่งใส** — บอกว่าใช้คำที่จำได้กี่คำ  
5. **เข้าถึงด้วยนิ้วเดียวบนมือถือ** — CTA หลักใหญ่  

---

## 15. Design System

### ทิศทางภาพ
Modern · Minimal · โทนเดียวกับ MLTCENTERS (ฟ้า `#5BC0FF` / เขียวมิ้นต์ `#6EE7B7`) + ความรู้สึก Duolingo (ความก้าวหน้า) + Notion (ความชัด) + ChatGPT (แชท)

### Tokens (ร่าง)
| Token | ค่าแนะนำ |
|-------|----------|
| Font | Poppins + Noto Sans Thai (ของเดิม) |
| Radius | 12 / 16 / 24 |
| Spacing | 4-point grid (8, 12, 16, 24, 32) |
| Primary | `#5BC0FF` |
| Success | `#6EE7B7` |
| Warning | `#FBBF24` |
| Danger | `#F43F5E` |
| Surface light | `#F8FAFC` |
| Surface dark | `#0F172A` |

### Components
Button, Card, ProgressRing, StatPill, WordChip, QuizOption, AudioButton, StreakFlame, XPToast, BottomNav (mobile vocab), Chart (Recharts)

### Dark / Light
ใช้ CSS variables / class `dark` ตามที่โปรเจกต์รองรับ — Vocab pages ต้องผ่านทั้งสองโหมด

---

## 16. Development Roadmap

| Phase | ระยะ | งาน |
|-------|------|-----|
| **P0 MVP** | 2–3 สัปดาห์ | Schema + Learn + MCQ/Type + SRS พื้นฐาน + Dashboard บางส่วน + Level 1 bank (300) |
| **P1** | 3–4 สัปดาห์ | Quiz ครบชุดหลัก, Smart Review, Sentences/วัน, Stats, Streak/XP |
| **P2** | 3–4 สัปดาห์ | Story, Chat, Weekly Report, TOEIC estimate, Level 2 bank |
| **P3** | ต่อเนื่อง | Level 3 TOEIC, Leaderboard, Offline, Business/IELTS tracks |

---

## 17. MVP Scope (ต้องชิปก่อน)

**รวม**
- `/vocab` Dashboard (progress, streak, weak/strong อย่างง่าย)
- Learn flow + รายละเอียดคำ
- Quiz: MCQ, Typing, Fill
- `user_word_statistics` + Memory Score เวอร์ชัน 1
- Review queue แบบ interval คงที่/SM-2 ย่อ
- Level 1 Starter 300 คำ (seed)
- AI: สร้างตัวอย่างประโยค 5/วัน (known words)
- Analytics events: `vocab_session_started`, `vocab_word_learned`, `vocab_quiz_answered`

**ไม่รวมใน MVP**
- Match/Arrange/Image/AI Convo quiz  
- Full story generator  
- Chat tutor  
- Leaderboard  
- Weekly AI report เต็มรูปแบบ  
- Level 2–3 content ครบ  

---

## 18. Future Features

- Business / IELTS / Academic tracks  
- Import คำจากไฟล์ผู้ใช้  
- แจ้งเตือน push / Line  
- โหมดคู่ (ครู–นักเรียน สำหรับเวิร์กช็อป)  
- Offline-first PWA สำหรับรีวิว  
- Voice quiz เชื่อม speech pipeline เดิม  
- Personalization จากผล `/assessment`  

---

## 19. Tech Stack Recommendation

| ชั้น | เทคโนโลยี | เหตุผล |
|------|-----------|--------|
| Frontend | React + Vite + Tailwind (ของเดิม) | หนึ่ง design system |
| Routing | `/vocab/*` ใน App.tsx | IA ชัด |
| Backend | Express `server/vocab/` | ร่วม process กับ assess/mail |
| DB | PostgreSQL (prod) + file/JSON ได้ใน local | สอดคล้อง analytics dual-mode |
| AI | Groq/OpenAI ผ่าน client เดิม | ลด ops |
| Audio | เก็บ URL / TTS สำรอง | ต้นทุนต่ำช่วงแรก |
| Images | CDN / static seed | |
| Charts | Recharts | มีในโปรเจกต์ |
| Auth (ระยะถัดไป) | session/JWT ผู้เรียน | MVP ใช้ guest profile + local id ก่อนได้ |

### Guest profile (MVP)
`visitorId` จาก analytics + `vocab_profiles` ผูก device — อัปเกรดเป็น user login ทีหลังโดยไม่ทิ้ง progress

---

## 20. Deployment Architecture

```
Dokploy / Docker (Dockerfile.prod เดิม)
└── node server
    ├── static dist (รวมหน้า /vocab)
    ├── /api/assess
    ├── /api/analytics
    ├── /api/vocab          ← ใหม่
    ├── /api/register
    └── PHPMailer
         │
         ├─ DATABASE_URL → Postgres (แนะนำเมื่อ vocab โต)
         └─ หรือ file store ช่วงทดลอง
```

### Env เพิ่ม (ร่าง)
```env
VOCAB_ENABLED=true
VOCAB_AI_DAILY_SENTENCES=5
VOCAB_NEW_WORDS_PER_DAY=15
# ใช้ OPENAI_* / AI_GATEWAY_* เดิม
```

### Observability
- ล็อก AI latency / token  
- Analytics: funnel Learn → Quiz → Review  
- Error budget สำหรับ gen content  

---

## ความสอดคล้องกับ MLTCENTERS

| จุดเชื่อม | รายละเอียด |
|----------|------------|
| Navbar | เพิ่มเมนู “ศัพท์ / Vocab” |
| Assessment เสร็จ | CTA “เริ่มท่องศัพท์ตามระดับของคุณ” |
| Design | pastel-card, heading-gradient, primary เดิม |
| i18n | คีย์ `vocabPage.*` |

---

## ความเสี่ยงและข้อจำกัด

1. **คุณภาพคลังคำ 300/1500/5000** — ต้องมี editorial/seed ที่ตรวจ IPA/ความหมาย  
2. **ต้นทุน AI** — cache รายวัน + rate limit ต่อผู้ใช้  
3. **Guest → Account merge** — ออกแบบ mapping ตั้งแต่ MVP  
4. **Speech quiz** — พึ่ง pipeline เดิม ระวังคำซ้ำ (มี dedupe แล้ว)  

---

## Success Metrics

| Metric | เป้าช่วงแรก |
|--------|-------------|
| D1 retention | ≥ 35% |
| Words reviewed / day / user | ≥ 15 |
| 7-day accuracy trend | ขาขึ้น |
| % sessions จบครบ | ≥ 60% |

---

## ขั้นตอนถัดไปหลังอนุมัติ spec

1. เขียน implementation plan (MVP P0)  
2. Seed Level 1 (300 words)  
3. Scaffold `/vocab` + `server/vocab` + schema  
4. Learn + MCQ + Memory Score v1 + Dashboard  

---

**กรุณารีวิวไฟล์นี้แล้วตอบ `spec approved` หรือบอกจุดที่ต้องการแก้**

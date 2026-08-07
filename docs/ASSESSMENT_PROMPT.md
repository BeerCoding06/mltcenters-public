# English Assessment – AI Prompt & Architecture

## OpenAI integration

- **Endpoint:** Backend `POST /api/assess` (see `server/index.js`).
- **API key:** Set `OPENAI_API_KEY` in `server/.env`. Never expose it in the frontend.
- **Flow:** Frontend sends `{ messages: [{ role, content }, ...] }`. Backend appends system prompt and calls OpenAI; returns `{ reply, scores, level }`.

## System prompt (used in server)

The AI is instructed to:

1. Act as a certified English assessor for ages 15–22.
2. Ask **one** short question per turn; be conversational and encouraging.
3. After each student reply, respond with **only** a JSON object:
   - `reply`: string (friendly message and next question or goodbye).
   - `scores`: `{ grammar, vocabulary, fluency, coherence }` (0–100).
   - `level`: `"Beginner" | "Intermediate" | "Advanced"`.
4. Use 5–8 questions total; progress from easier to harder.
5. Level bands: Beginner 0–59, Intermediate 60–79, Advanced 80–100.

## Scoring

- **Grammar / Vocabulary / Fluency / Coherence** come from the AI’s JSON per turn.
- Frontend accumulates `scoresHistory` and at the end computes:
  - Average per skill.
  - Overall = average of the four averages.
  - Level from overall (same bands as above).
- Result is stored in `localStorage` and passed to the dashboard.

## Voice

- **Input (production):** `MediaRecorder` + Web Audio VAD → `POST /api/transcribe` (Whisper).
  Independent of browser Web Speech API flakiness.
- **Output:** `SpeechSynthesis` with watchdog so `onend` cannot hang the turn.
- **Fallback:** If mic unsupported, mic button hidden; user types only.
- **Flow:** AI speaks → short gap → listen → silence cut → Whisper → `/api/assess` → TTS.

## Gamification

- **XP:** Base 20 per answer + extra for longer replies; combo multiplier (e.g. 1.2×) after 2+ answers.
- **Progress bar:** Filled by number of exchanges toward 5–8 turns.
- **Badges:** First Response, 5 Answers Completed, Advanced Vocabulary (vocab ≥75), Confident Speaker (fluency ≥70).
- **Persistence:** Last result and XP history in `localStorage` (keys in code).

## Safe deployment

- Run the **backend** (Express) on your server with `OPENAI_API_KEY` in env. Frontend calls `/api`; in production, either host the API on the same origin or set `VITE_API_URL` and proxy/rewrite to the backend so the key is never in the client.

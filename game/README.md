# English Runner Game

AI-powered endless runner where answering English questions boosts your speed.

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React, Vite, Phaser 3, TailwindCSS |
| Backend | FastAPI, Python 3.12 |
| AI | LangChain + Ollama or OpenAI/Groq |

## Features

- Auto-running character with obstacles
- AI-generated beginner multiple-choice questions
- Correct answer → speed boost + score + streak bonus
- Wrong answer → HP loss + speed penalty
- Adaptive difficulty (beginner → elementary → intermediate)
- Explanation after each answer
- Mobile-friendly UI overlay

## Structure

```
game/
├── backend/
│   ├── app/
│   │   ├── api/routes.py          # REST endpoints
│   │   ├── core/config.py
│   │   ├── schemas/game.py
│   │   ├── services/
│   │   │   ├── game_service.py    # Game state + scoring
│   │   │   └── llm_service.py     # Question generation
│   │   └── prompts/questions.py
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── game/RunnerScene.ts    # Phaser runner
│   │   ├── components/            # HUD, questions, canvas
│   │   └── hooks/useGameSession.ts
│   └── Dockerfile
└── docker-compose.yml
```

## API

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/game/new` | Start new session |
| POST | `/api/v1/generate-question` | AI question for session |
| POST | `/api/v1/check-answer` | Validate answer, update state |
| GET | `/api/v1/game-state/{id}` | Current state |
| POST | `/api/v1/game/reset/{id}` | Reset session |

## Quick start

```bash
cd game
cp backend/.env.example backend/.env

# Docker
docker compose up --build
# → http://localhost:5190

# Local dev
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8002
cd frontend && npm install && npm run dev
# → http://localhost:5190
```

## LLM config

**Ollama (default):**
```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

**OpenAI / Groq:**
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your-key
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.3-70b-versatile
```

## Game mechanics

| Event | Effect |
|-------|--------|
| Correct answer | +100 score, +streak bonus, +40 speed |
| Wrong answer | -20 HP, -50 speed, streak reset |
| HP = 0 | Game over |
| 3+ streak | elementary difficulty |
| 5+ streak + 80% accuracy | intermediate difficulty |

## Production notes

- Game state is in-memory; use Redis for horizontal scaling
- No separate API domain needed — Nginx proxies `/api` to backend
- Fallback question bank used if LLM is unavailable

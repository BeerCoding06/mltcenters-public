# AI English Tutor with Realistic Talking Avatar

Production-ready English conversation tutor with a persistent on-screen avatar (Emma), voice I/O, streaming LLM replies, CEFR evaluation, and optional MuseTalk GPU lip-sync.

## Architecture

```
User → Microphone → faster-whisper (STT)
                 ↓
              FastAPI + WebSocket
                 ↓
              LangChain → Ollama / OpenAI
                 ↓
              Edge-TTS (speech + visemes)
                 ↓
         MuseTalk (optional) or viseme overlay
                 ↓
              React UI (avatar always visible)
```

## Tech stack

| Layer | Stack |
|-------|--------|
| Frontend | React, Vite, TailwindCSS |
| Backend | FastAPI, Python 3.12 |
| AI | LangChain, Ollama, OpenAI-compatible APIs |
| STT | faster-whisper |
| TTS | edge-tts (free) |
| Avatar | Viseme lip-sync (default) + MuseTalk (optional GPU) |
| Database | PostgreSQL |
| Auth | JWT |

## Features

- Natural English conversation with streaming responses
- Voice input (mic) and voice output (TTS)
- Realistic avatar: blink, idle breathing, subtle head movement, smile on greeting
- Lip-sync from Edge-TTS word boundaries (viseme mode) or MuseTalk video
- Interrupt when user starts speaking
- Conversation history + dashboard
- CEFR evaluation, grammar corrections, vocabulary suggestions after N turns
- JWT authentication

## Folder structure

```
tutor/
├── backend/
│   ├── app/
│   │   ├── api/routes.py       # REST + WebSocket
│   │   ├── core/               # config, security
│   │   ├── database/           # SQLAlchemy session
│   │   ├── models/             # User, Session, Message, Evaluation
│   │   ├── prompts/            # Tutor system prompts
│   │   ├── services/           # STT, TTS, LLM, Avatar
│   │   └── main.py
│   ├── assets/tutor-portrait.jpg
│   ├── Dockerfile
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/TutorAvatar.tsx
│   │   ├── hooks/
│   │   ├── pages/
│   │   └── services/api.ts
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
├── .env.example
└── README.md
```

## Quick start (Docker)

```bash
cd tutor
cp backend/.env.example backend/.env
# Edit backend/.env — set LLM_PROVIDER and API keys / Ollama URL

docker compose up --build
```

- Frontend: http://localhost:5180
- API: http://localhost:8001
- API docs: http://localhost:8001/docs

## Local development

### Backend

```bash
cd tutor/backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Start PostgreSQL (or use docker compose up postgres -d)
uvicorn app.main:app --reload --port 8001
```

### Frontend

```bash
cd tutor/frontend
npm install
npm run dev
# http://localhost:5180
```

### Ollama

```bash
ollama pull llama3.2
ollama serve
```

Set `LLM_PROVIDER=ollama` and `OLLAMA_BASE_URL=http://localhost:11434`.

### OpenAI / Groq

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=your-key
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=llama-3.3-70b-versatile
```

## Avatar pipeline

1. **Portrait** — default `assets/tutor-portrait.jpg` or upload via `POST /api/v1/avatar/upload-portrait`
2. **Face detection** — OpenCV Haar cascade
3. **TTS** — Edge-TTS generates MP3 + viseme timeline
4. **Lip-sync**
   - **viseme** (default): React SVG mouth overlay synced to audio
   - **MuseTalk** (optional): GPU service returns MP4; enable with `MUSETALK_ENABLED=true`
5. **Render** — avatar stays on screen; idle animations when not speaking

## API overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Current user |
| POST | `/api/v1/sessions/start` | Start tutor session + greeting |
| GET | `/api/v1/sessions/{id}` | Session history |
| GET | `/api/v1/dashboard` | User dashboard |
| POST | `/api/v1/stt` | Speech-to-text upload |
| WS | `/api/v1/ws/{session_id}` | Streaming chat |

WebSocket messages:

```json
{ "type": "user_message", "text": "Hello!" }
{ "type": "interrupt" }
```

Responses: `token`, `assistant_complete`, `interrupted`.

## MuseTalk (optional)

Requires NVIDIA GPU:

```bash
docker compose --profile musetalk up --build
```

Set in `backend/.env`:

```env
MUSETALK_ENABLED=true
MUSETALK_URL=http://musetalk:7860
```

## License

Open-source components only. Portrait from Unsplash (replace with your own licensed image for production).

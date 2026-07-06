# English Conversation Assessment Platform

AI-powered English conversation assessment with FastAPI, LangChain, OpenAI, PostgreSQL, and React.

## Architecture

```
frontend/          React + Tailwind + Vite
backend/           FastAPI + SQLAlchemy + LangChain + JWT
docker-compose.assessment.yml   Postgres + API + UI
```

## Features

- JWT authentication (register / login)
- Natural AI tutor conversations (7 topics)
- Auto evaluation after 10 user turns
- CEFR scoring + skill breakdown
- User dashboard with progress charts
- Admin overview + JSON export

## Quick start (Docker)

```bash
cp backend/.env.example backend/.env
# Set OPENAI_API_KEY in backend/.env

docker compose -f docker-compose.assessment.yml up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:8000
- API docs: http://localhost:8000/docs

Seed admin user:

```bash
docker compose -f docker-compose.assessment.yml exec backend python -m app.database.seed
# admin@mltcenters.com / Admin123!
```

## Local development

### Backend

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Start Postgres (or use docker compose postgres service)
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173 (proxies /api → :8000)
```

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/auth/register` | Register |
| POST | `/api/v1/auth/login` | Login |
| GET | `/api/v1/auth/me` | Current user |
| POST | `/api/v1/conversations` | Start conversation |
| POST | `/api/v1/conversations/{id}/messages` | Send message |
| GET | `/api/v1/conversations` | List history |
| GET | `/api/v1/dashboard` | User dashboard |
| GET | `/api/v1/admin/overview` | Admin stats |
| GET | `/api/v1/admin/export` | Export report |

## Database schema

- `users` — accounts + admin flag
- `conversations` — topic, status, turn_count
- `messages` — user/assistant messages
- `evaluations` — scores, CEFR, feedback JSON

## Project structure

```
backend/app/
  api/           REST routes + dependencies
  services/      Business logic
  repositories/  Data access
  models/        SQLAlchemy entities
  schemas/       Pydantic DTOs
  core/          Config, security, exceptions
  prompts/       Prompt templates
  ai/            LangChain + OpenAI integration
  database/      Session + seed

frontend/src/
  pages/         Login, Register, Chat, Dashboard, Admin
  components/    Layout
  hooks/         useAuth
  services/      API client
```

## Tests

```bash
cd backend
pytest
```

## Environment variables

See `backend/.env.example`.

## Note on existing MLTCENTERS site

The root `src/` workshop site and Express `server/` remain unchanged. This platform lives in `backend/` + `frontend/` and runs via `docker-compose.assessment.yml`.

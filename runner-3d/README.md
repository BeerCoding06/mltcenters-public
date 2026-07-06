# 3D Cartoon English Learning Runner

React + Three.js endless runner with Ready Player Me avatars, Mixamo animations, and AI-generated English questions.

## Stack

| Layer | Technology |
|-------|------------|
| 3D | Three.js, React Three Fiber, Drei |
| UI | React, Vite, TailwindCSS |
| Backend | FastAPI, LangChain, Ollama/OpenAI |
| Avatar | Ready Player Me (glTF) |
| Animations | Mixamo → glTF (run, idle, jump, win, lose) |

## Features

- Cartoon 3D race track with obstacles
- RPM avatar with Mixamo animation clips
- Third-person follow camera
- AI beginner English questions (A/B/C)
- Correct → speed boost + jump/win animation
- Wrong → speed penalty + lose animation
- Adaptive difficulty
- `/evaluate-performance` AI report at game over

## Structure

```
runner-3d/
├── backend/app/
│   ├── api/routes.py
│   ├── services/game_service.py
│   └── services/llm_service.py
├── frontend/src/
│   ├── three/AvatarCharacter.tsx   # RPM + Mixamo
│   ├── three/GameScene.tsx
│   ├── three/FollowCamera.tsx
│   ├── three/ObstacleTrack.tsx
│   └── components/HUD.tsx
└── docker-compose.yml
```

## Quick start

```bash
cd runner-3d
cp backend/.env.example backend/.env
docker compose up --build
# → http://localhost:5195
```

Local dev:
```bash
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload --port 8003
cd frontend && npm install && npm run dev
```

## Avatar setup

1. Create avatar at [readyplayer.me](https://readyplayer.me)
2. Copy `.glb` URL to `frontend/.env`:
   ```env
   VITE_RPM_AVATAR_URL=https://models.readyplayer.me/YOUR_ID.glb
   ```

## Mixamo animations

1. Upload the same RPM rig to [Mixamo](https://www.mixamo.com)
2. Download: **Idle**, **Running**, **Jump**, **Victory**, **Defeat** (or similar)
3. Convert FBX → GLB (Blender or online converter)
4. Place in `frontend/public/models/animations/`:
   - `idle.glb`, `run.glb`, `jump.glb`, `win.glb`, `lose.glb`

Without Mixamo files, the avatar uses procedural bobbing as fallback.

## API

| Endpoint | Description |
|----------|-------------|
| `POST /api/v1/game/new` | New session |
| `POST /api/v1/generate-question` | AI question (3 options) |
| `POST /api/v1/check-answer` | Check + update speed/HP |
| `POST /api/v1/evaluate-performance` | AI performance report |
| `GET /api/v1/game-state/{id}` | Current state |

## Production

- No separate API domain needed — Nginx proxies `/api`
- Use Redis for game sessions at scale
- Preload RPM avatar URL in CDN for faster loads

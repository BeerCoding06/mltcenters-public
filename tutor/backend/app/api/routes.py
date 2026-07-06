import asyncio
import logging
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, Header, HTTPException, UploadFile, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.security import create_token, decode_token, hash_password, verify_password
from app.database.session import AsyncSessionLocal, get_db
from app.models.entities import TutorEvaluation, TutorMessage, TutorSession, User
from app.services.avatar_service import AvatarService
from app.services.llm_service import LLMService
from app.services.stt_service import STTService

logger = logging.getLogger(__name__)
router = APIRouter()
stt = STTService()
avatar = AvatarService()
llm = LLMService()

active_streams: dict[str, asyncio.Event] = {}


class RegisterBody(BaseModel):
    email: EmailStr
    full_name: str = Field(min_length=2)
    password: str = Field(min_length=8)


class LoginBody(BaseModel):
    email: EmailStr
    password: str


class StartSessionBody(BaseModel):
    topic: str = "สนทนาทั่วไป"


async def current_user(
    authorization: str | None = Header(None),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="กรุณาเข้าสู่ระบบ")
    uid = decode_token(authorization.removeprefix("Bearer ").strip())
    if not uid:
        raise HTTPException(status_code=401, detail="กรุณาเข้าสู่ระบบ")
    result = await db.execute(select(User).where(User.id == uuid.UUID(uid)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="กรุณาเข้าสู่ระบบ")
    return user


@router.post("/auth/register")
async def register(body: RegisterBody, db: AsyncSession = Depends(get_db)):
    exists = await db.execute(select(User).where(User.email == body.email))
    if exists.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="อีเมลนี้ถูกใช้งานแล้ว")
    user = User(
        email=body.email,
        full_name=body.full_name,
        hashed_password=hash_password(body.password),
    )
    db.add(user)
    await db.flush()
    return {"access_token": create_token(str(user.id)), "user": {"id": str(user.id), "email": user.email, "full_name": user.full_name}}


@router.post("/auth/login")
async def login(body: LoginBody, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="อีเมลหรือรหัสผ่านไม่ถูกต้อง")
    return {"access_token": create_token(str(user.id)), "user": {"id": str(user.id), "email": user.email, "full_name": user.full_name}}


@router.get("/auth/me")
async def me(user: User = Depends(current_user)):
    return {"id": str(user.id), "email": user.email, "full_name": user.full_name}


@router.get("/dashboard")
async def dashboard(user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TutorSession)
        .options(selectinload(TutorSession.evaluation))
        .where(TutorSession.user_id == user.id)
        .order_by(TutorSession.created_at.desc())
        .limit(50)
    )
    sessions = result.scalars().all()
    completed = [s for s in sessions if s.status == "completed"]
    avg_cefr = None
    if completed:
        levels = [s.evaluation.payload.get("cefr") for s in completed if s.evaluation]
        avg_cefr = levels[-1] if levels else None
    return {
        "total_sessions": len(sessions),
        "completed_sessions": len(completed),
        "latest_cefr": avg_cefr,
        "sessions": [
            {
                "id": str(s.id),
                "topic": s.topic,
                "turn_count": s.turn_count,
                "status": s.status,
                "created_at": s.created_at.isoformat(),
                "cefr": s.evaluation.payload.get("cefr") if s.evaluation else None,
            }
            for s in sessions
        ],
    }


@router.get("/sessions/{session_id}")
async def get_session(session_id: str, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(TutorSession)
        .options(selectinload(TutorSession.messages), selectinload(TutorSession.evaluation))
        .where(TutorSession.id == uuid.UUID(session_id), TutorSession.user_id == user.id)
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="ไม่พบเซสชัน")
    return {
        "id": str(session.id),
        "topic": session.topic,
        "turn_count": session.turn_count,
        "status": session.status,
        "messages": [
            {"role": m.role, "content": m.content, "meta": m.meta, "created_at": m.created_at.isoformat()}
            for m in session.messages
        ],
        "evaluation": session.evaluation.payload if session.evaluation else None,
    }


@router.post("/sessions/start")
async def start_session(body: StartSessionBody, user: User = Depends(current_user), db: AsyncSession = Depends(get_db)):
    session = TutorSession(user_id=user.id, topic=body.topic)
    db.add(session)
    await db.flush()
    greeting = "สวัสดีค่ะ! ดิฉันชื่อเอ็มม่า ครูสอนภาษาอังกฤษของคุณค่ะ ยินดีที่ได้รู้จักนะคะ วันนี้เป็นอย่างไรบ้างคะ?"
    msg = TutorMessage(session_id=session.id, role="assistant", content=greeting)
    db.add(msg)
    render = await avatar.render_speech(greeting, greeting=True)
    return {"session_id": str(session.id), "greeting": greeting, "avatar": render}


@router.post("/stt")
async def speech_to_text(file: UploadFile = File(...)):
  data = await file.read()
  text = await asyncio.to_thread(stt.transcribe_bytes, data, Path(file.filename or "audio.webm").suffix)
  return {"text": text}


@router.post("/avatar/upload-portrait")
async def upload_portrait(file: UploadFile = File(...)):
    settings = get_settings()
    dest = Path(settings.avatar_portrait_path)
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(await file.read())
    face = avatar.detect_face(str(dest))
    return {"ok": face["ok"], "face": face.get("box")}


@router.websocket("/ws/{session_id}")
async def tutor_ws(websocket: WebSocket, session_id: str):
    await websocket.accept()
    stream_id = session_id
    cancel = asyncio.Event()
    active_streams[stream_id] = cancel
    settings = get_settings()

    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(
                select(TutorSession)
                .options(selectinload(TutorSession.messages))
                .where(TutorSession.id == uuid.UUID(session_id))
            )
            session = result.scalar_one_or_none()
            if not session:
                await websocket.send_json({"type": "error", "message": "Session not found"})
                return

            while True:
                payload = await websocket.receive_json()
                if payload.get("type") == "interrupt":
                    cancel.set()
                    await websocket.send_json({"type": "interrupted"})
                    continue

                if payload.get("type") != "user_message":
                    continue

                user_text = (payload.get("text") or "").strip()
                if not user_text:
                    continue

                cancel.clear()
                session.turn_count += 1
                db.add(TutorMessage(session_id=session.id, role="user", content=user_text))
                await db.commit()
                await db.refresh(session, ["messages"])

                history = [{"role": m.role, "content": m.content} for m in session.messages]

                full_reply = ""
                async for token in llm.stream_reply(history):
                    if cancel.is_set():
                        break
                    full_reply += token
                    await websocket.send_json({"type": "token", "text": token})

                if cancel.is_set():
                    continue

                render = await avatar.render_speech(full_reply)
                db.add(
                    TutorMessage(
                        session_id=session.id,
                        role="assistant",
                        content=full_reply,
                        meta=render,
                    )
                )

                evaluation = None
                if session.turn_count >= settings.evaluation_turn_threshold and session.status != "completed":
                    transcript = "\n".join(f"{m.role}: {m.content}" for m in session.messages)
                    transcript += f"\nassistant: {full_reply}"
                    evaluation = await llm.evaluate(transcript)
                    db.add(TutorEvaluation(session_id=session.id, payload=evaluation))
                    session.status = "completed"

                await db.commit()

                await websocket.send_json(
                    {
                        "type": "assistant_complete",
                        "text": full_reply,
                        "avatar": render,
                        "turn_count": session.turn_count,
                        "evaluation": evaluation,
                    }
                )
    except WebSocketDisconnect:
        logger.info("WS disconnected %s", session_id)
    finally:
        active_streams.pop(stream_id, None)

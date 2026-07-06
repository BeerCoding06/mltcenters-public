import logging
import uuid
from pathlib import Path

import cv2
import httpx

from app.core.config import get_settings
from app.services.tts_service import TTSService

logger = logging.getLogger(__name__)


class AvatarService:
    """
    Avatar pipeline:
    portrait → face detect → TTS audio → lip-sync (viseme or MuseTalk) → render payload

    Default: viseme timeline + portrait URL (React renders mouth overlay).
    Optional: MuseTalk GPU service when MUSETALK_ENABLED=true.
    """

    def __init__(self) -> None:
        self.settings = get_settings()
        self.tts = TTSService()
        Path(self.settings.video_cache_dir).mkdir(parents=True, exist_ok=True)

    def detect_face(self, portrait_path: str | None = None) -> dict:
        path = portrait_path or self.settings.avatar_portrait_path
        img = cv2.imread(path)
        if img is None:
            return {"ok": False, "box": None}
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        faces = cascade.detectMultiScale(gray, 1.1, 5, minSize=(80, 80))
        if len(faces) == 0:
            return {"ok": False, "box": None}
        x, y, w, h = faces[0]
        return {"ok": True, "box": {"x": int(x), "y": int(y), "w": int(w), "h": int(h)}}

    async def render_speech(
        self,
        text: str,
        *,
        greeting: bool = False,
    ) -> dict:
        file_id = uuid.uuid4().hex
        audio_path, visemes = await self.tts.synthesize(text, file_id)

        if greeting and visemes:
            visemes.insert(0, {"t": 0.0, "shape": "smile", "duration": 0.6})

        if self.settings.musetalk_enabled and self.settings.musetalk_url:
            video = await self._musetalk_render(audio_path)
            if video:
                return {
                    "engine": "musetalk",
                    "audio_url": f"/media/audio/{file_id}.mp3",
                    "video_url": video,
                    "visemes": visemes,
                    "expression": "smile" if greeting else "neutral",
                }

        return {
            "engine": "viseme",
            "audio_url": f"/media/audio/{file_id}.mp3",
            "video_url": None,
            "visemes": visemes,
            "expression": "smile" if greeting else "neutral",
            "portrait_url": "/media/portrait",
        }

    async def _musetalk_render(self, audio_path: str) -> str | None:
        try:
            async with httpx.AsyncClient(timeout=120.0) as client:
                with open(audio_path, "rb") as audio_f, open(
                    self.settings.avatar_portrait_path, "rb"
                ) as img_f:
                    files = {
                        "portrait": img_f,
                        "audio": audio_f,
                    }
                    r = await client.post(
                        f"{self.settings.musetalk_url.rstrip('/')}/render",
                        files=files,
                    )
                if r.status_code == 200:
                    vid_id = uuid.uuid4().hex
                    out = Path(self.settings.video_cache_dir) / f"{vid_id}.mp4"
                    out.write_bytes(r.content)
                    return f"/media/video/{vid_id}.mp4"
        except Exception as e:
            logger.warning("MuseTalk unavailable, fallback to viseme: %s", e)
        return None

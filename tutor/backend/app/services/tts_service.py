import logging
from pathlib import Path

import edge_tts

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class TTSService:
    """Free neural TTS via Microsoft Edge (edge-tts)."""

    def __init__(self) -> None:
        self.settings = get_settings()
        Path(self.settings.audio_cache_dir).mkdir(parents=True, exist_ok=True)

    async def synthesize(self, text: str, file_id: str) -> tuple[str, list[dict]]:
        """
        Returns (audio_path, visemes) where visemes are mouth keyframes:
        [{ "t": seconds, "shape": "A"|"E"|"I"|"O"|"U"|"closed"|"smile" }, ...]
        """
        out = Path(self.settings.audio_cache_dir) / f"{file_id}.mp3"
        communicate = edge_tts.Communicate(text, self.settings.edge_tts_voice)
        visemes: list[dict] = []
        offset_ms = 0.0

        with open(out, "wb") as f:
            async for chunk in communicate.stream():
                if chunk["type"] == "audio":
                    f.write(chunk["data"])
                elif chunk["type"] == "WordBoundary":
                    start = chunk["offset"] / 10_000_000
                    duration = chunk["duration"] / 10_000_000
                    shape = _word_to_viseme(chunk.get("text", ""))
                    visemes.append({"t": start, "shape": shape, "duration": duration})
                    offset_ms = start + duration

        if not visemes:
            visemes = _fallback_visemes(text, estimated_duration=max(1.0, len(text) * 0.06))

        return str(out), visemes


def _word_to_viseme(word: str) -> str:
    w = word.lower()
    vowels = {"a": "A", "e": "E", "i": "I", "o": "O", "u": "U"}
    for ch in w:
        if ch in vowels:
            return vowels[ch]
    return "closed"


def _fallback_visemes(text: str, estimated_duration: float) -> list[dict]:
    words = text.split()
    if not words:
        return [{"t": 0.0, "shape": "smile", "duration": 0.5}]
    step = estimated_duration / max(len(words), 1)
    visemes = [{"t": 0.0, "shape": "smile", "duration": 0.35}]
    for i, word in enumerate(words):
        visemes.append(
            {
                "t": 0.35 + i * step,
                "shape": _word_to_viseme(word),
                "duration": step * 0.85,
            }
        )
    return visemes

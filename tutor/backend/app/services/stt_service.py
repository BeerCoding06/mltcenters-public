import logging
import tempfile
from pathlib import Path

from faster_whisper import WhisperModel

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class STTService:
    """Open-source speech-to-text via faster-whisper."""

    _model: WhisperModel | None = None

    def __init__(self) -> None:
        self.settings = get_settings()

    def _get_model(self) -> WhisperModel:
        if STTService._model is None:
            logger.info(
                "Loading Whisper model=%s device=%s",
                self.settings.whisper_model,
                self.settings.whisper_device,
            )
            STTService._model = WhisperModel(
                self.settings.whisper_model,
                device=self.settings.whisper_device,
                compute_type=self.settings.whisper_compute_type,
            )
        return STTService._model

    def transcribe_bytes(self, audio_bytes: bytes, suffix: str = ".webm") -> str:
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        try:
            model = self._get_model()
            segments, _ = model.transcribe(tmp_path, language="th")
            return " ".join(s.text.strip() for s in segments).strip()
        finally:
            Path(tmp_path).unlink(missing_ok=True)

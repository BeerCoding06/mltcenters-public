from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "ครูสอนภาษาอังกฤษ AI"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"
    secret_key: str = "change-me"
    jwt_secret_key: str = "change-me-jwt"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 120

    database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/ai_tutor"
    )

    llm_provider: str = "ollama"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    openai_api_key: str = ""
    openai_base_url: str = ""
    openai_model: str = "gpt-4o-mini"

    whisper_model: str = "base"
    whisper_device: str = "cpu"
    whisper_compute_type: str = "int8"
    edge_tts_voice: str = "th-TH-PremwadeeNeural"

    avatar_portrait_path: str = "assets/tutor-portrait.jpg"
    avatar_engine: str = "viseme"
    musetalk_url: str = ""
    musetalk_enabled: bool = False
    audio_cache_dir: str = "data/audio"
    video_cache_dir: str = "data/video"

    cors_origins: str = "http://localhost:5180"
    evaluation_turn_threshold: int = 10

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

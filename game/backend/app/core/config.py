from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "English Runner Game API"
    debug: bool = False
    api_v1_prefix: str = "/api/v1"

    llm_provider: str = "ollama"
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    openai_api_key: str = ""
    openai_base_url: str = ""
    openai_model: str = "gpt-4o-mini"

    cors_origins: str = "http://localhost:5190"

    initial_hp: int = 100
    initial_speed: int = 200
    max_speed: int = 500
    min_speed: int = 80
    correct_speed_boost: int = 40
    wrong_speed_penalty: int = 50
    correct_score: int = 100
    streak_bonus: int = 25

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

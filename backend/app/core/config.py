from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "English Assessment Platform"
    app_env: str = "development"
    debug: bool = True
    secret_key: str = "change-me"
    api_v1_prefix: str = "/api/v1"

    database_url: str = (
        "postgresql+asyncpg://postgres:postgres@localhost:5432/english_assessment"
    )

    jwt_secret_key: str = "change-me-jwt"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    openai_api_key: str = ""
    openai_base_url: str = ""
    openai_model: str = "gpt-4o"
    ai_gateway_api_key: str = ""
    ai_gateway_base_url: str = ""
    ai_model: str = ""

    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    evaluation_turn_threshold: int = 10

    @property
    def llm_api_key(self) -> str:
        return self.openai_api_key or self.ai_gateway_api_key

    @property
    def llm_base_url(self) -> str | None:
        url = self.openai_base_url or self.ai_gateway_base_url
        return url or None

    @property
    def llm_model(self) -> str:
        return self.openai_model or self.ai_model or "gpt-4o"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()

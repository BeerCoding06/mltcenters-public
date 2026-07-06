import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.routes import router
from app.core.config import get_settings
from app.database.session import Base, engine

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    settings = get_settings()
    Path(settings.audio_cache_dir).mkdir(parents=True, exist_ok=True)
    Path(settings.video_cache_dir).mkdir(parents=True, exist_ok=True)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title=settings.app_name, lifespan=lifespan)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(router, prefix=settings.api_v1_prefix)

    @app.get("/health")
    async def health():
        return {"status": "ok", "avatar_engine": settings.avatar_engine}

    @app.get("/media/portrait")
    async def portrait():
        path = Path(settings.avatar_portrait_path)
        if path.exists():
            return FileResponse(path)
        return FileResponse(Path("assets/tutor-portrait.jpg"))

    audio_dir = Path(settings.audio_cache_dir)
    video_dir = Path(settings.video_cache_dir)
    app.mount("/media/audio", StaticFiles(directory=audio_dir), name="audio")
    app.mount("/media/video", StaticFiles(directory=video_dir), name="video")

    return app


app = create_app()

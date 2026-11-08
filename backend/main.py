import logging
import os
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.database import close_database, connect_database
from backend.routes import achievements, auth, education, messages, profile, projects, skills

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO").upper())
logger = logging.getLogger(__name__)

DEFAULT_CORS_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"


def get_cors_origins() -> list[str]:
    configured_origins = os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS)
    return [origin.strip().rstrip("/") for origin in configured_origins.split(",") if origin.strip()]


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    connect_database()
    try:
        yield
    finally:
        close_database()


app = FastAPI(
    title="Portfolio API",
    description="Local API for managing portfolio profile and content.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, error: Exception) -> JSONResponse:
    logger.error(
        "Unhandled API error for %s %s",
        request.method,
        request.url.path,
        exc_info=(type(error), error, error.__traceback__),
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "An unexpected server error occurred."},
    )


@app.get("/api/health", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok"}


for router in (
    auth.router,
    profile.router,
    skills.router,
    projects.router,
    education.router,
    achievements.router,
    messages.router,
):
    app.include_router(router, prefix="/api")

import logging

from fastapi import HTTPException

logger = logging.getLogger(__name__)


def database_unavailable(message: str, error: Exception) -> HTTPException:
    logger.error(
        "Database request failed: %s",
        message,
        exc_info=(type(error), error, error.__traceback__),
    )
    return HTTPException(status_code=503, detail=message)

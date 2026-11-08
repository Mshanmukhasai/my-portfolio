import logging
from collections import defaultdict, deque
from threading import Lock
from time import monotonic

from fastapi import HTTPException, status

logger = logging.getLogger(__name__)
SUBMISSION_LIMIT = 5
SUBMISSION_WINDOW_SECONDS = 10 * 60
_submission_times: dict[str, deque[float]] = defaultdict(deque)
_submission_lock = Lock()


def check_submission_limit(client_ip: str) -> None:
    now = monotonic()
    cutoff = now - SUBMISSION_WINDOW_SECONDS
    with _submission_lock:
        for known_ip in list(_submission_times):
            timestamps = _submission_times[known_ip]
            while timestamps and timestamps[0] <= cutoff:
                timestamps.popleft()
            if not timestamps:
                del _submission_times[known_ip]

        timestamps = _submission_times[client_ip]
        if len(timestamps) >= SUBMISSION_LIMIT:
            retry_after = max(1, int(SUBMISSION_WINDOW_SECONDS - (now - timestamps[0])))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many messages were submitted. Please try again later.",
                headers={"Retry-After": str(retry_after)},
            )
        timestamps.append(now)


def database_unavailable(message: str, error: Exception) -> HTTPException:
    logger.error(
        "Database request failed: %s",
        message,
        exc_info=(type(error), error, error.__traceback__),
    )
    return HTTPException(status_code=503, detail=message)

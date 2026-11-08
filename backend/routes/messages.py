from collections import defaultdict, deque
from datetime import datetime, timezone
from threading import Lock
from time import monotonic

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from pymongo.errors import PyMongoError

from backend.auth import require_admin
from backend.database import create_message, delete_entity, list_entities, update_entity
from backend.models import MessageCreate, MessageUpdate
from backend.routes.utils import database_unavailable

router = APIRouter(prefix="/messages", tags=["messages"])
SUBMISSION_LIMIT = 5
SUBMISSION_WINDOW_SECONDS = 10 * 60
_submission_times: dict[str, deque[float]] = defaultdict(deque)
_submission_lock = Lock()


def _check_submission_limit(client_ip: str) -> None:
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


@router.get("")
def get_messages(_: str = Depends(require_admin)) -> list[dict]:
    try:
        return list_entities("messages", newest_first=True)
    except PyMongoError as error:
        raise database_unavailable("Messages are temporarily unavailable.", error) from error


@router.post("", status_code=status.HTTP_201_CREATED)
def post_message(payload: MessageCreate, request: Request) -> dict:
    _check_submission_limit(request.client.host if request.client else "unknown")
    if payload.company_website:
        return {"accepted": True}

    try:
        return create_message(
            {
                **payload.model_dump(exclude={"company_website"}),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "is_read": False,
            }
        )
    except PyMongoError as error:
        raise database_unavailable("Your message could not be saved. Please try again later.", error) from error


@router.patch("/{item_id}")
def update_message(
    item_id: str,
    payload: MessageUpdate,
    _: str = Depends(require_admin),
) -> dict:
    try:
        message = update_entity("messages", item_id, payload.model_dump())
    except ValueError as error:
        raise HTTPException(status_code=400, detail="Invalid message ID.") from error
    except PyMongoError as error:
        raise database_unavailable("The message could not be updated.", error) from error
    if message is None:
        raise HTTPException(status_code=404, detail="Message not found.")
    message.setdefault("is_read", False)
    return message


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_message(item_id: str, _: str = Depends(require_admin)) -> Response:
    try:
        deleted = delete_entity("messages", item_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail="Invalid message ID.") from error
    except PyMongoError as error:
        raise database_unavailable("The message could not be deleted.", error) from error
    if not deleted:
        raise HTTPException(status_code=404, detail="Message not found.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

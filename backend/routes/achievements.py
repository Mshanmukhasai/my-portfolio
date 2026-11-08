from fastapi import APIRouter, Depends, HTTPException, Response, status
from pymongo.errors import PyMongoError

from backend.auth import require_admin
from backend.database import create_entity, delete_entity, list_entities, update_entity
from backend.models import AchievementCreate, AchievementUpdate
from backend.routes.utils import database_unavailable

router = APIRouter(prefix="/achievements", tags=["achievements"])


@router.get("")
def get_achievements() -> list[dict]:
    try:
        return list_entities("achievements")
    except PyMongoError as error:
        raise database_unavailable("Achievements are temporarily unavailable.", error) from error


@router.post("", status_code=status.HTTP_201_CREATED)
def post_achievement(payload: AchievementCreate, _: str = Depends(require_admin)) -> dict:
    try:
        return create_entity("achievements", payload.model_dump())
    except PyMongoError as error:
        raise database_unavailable("The achievement could not be created.", error) from error


@router.put("/{item_id}")
def put_achievement(item_id: str, payload: AchievementUpdate, _: str = Depends(require_admin)) -> dict:
    try:
        result = update_entity("achievements", item_id, payload.model_dump(exclude_unset=True))
    except ValueError as error:
        raise HTTPException(status_code=400, detail="Invalid achievement ID.") from error
    except PyMongoError as error:
        raise database_unavailable("The achievement could not be updated.", error) from error
    if result is None:
        raise HTTPException(status_code=404, detail="Achievement not found.")
    return result


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_achievement(item_id: str, _: str = Depends(require_admin)) -> Response:
    try:
        deleted = delete_entity("achievements", item_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail="Invalid achievement ID.") from error
    except PyMongoError as error:
        raise database_unavailable("The achievement could not be deleted.", error) from error
    if not deleted:
        raise HTTPException(status_code=404, detail="Achievement not found.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

from fastapi import APIRouter, Depends, HTTPException, Response, status
from pymongo.errors import PyMongoError

from backend.auth import require_admin
from backend.database import create_entity, delete_entity, list_entities, update_entity
from backend.models import SkillCreate, SkillUpdate
from backend.routes.utils import database_unavailable

router = APIRouter(prefix="/skills", tags=["skills"])


@router.get("")
def get_skills() -> list[dict]:
    try:
        return list_entities("skills")
    except PyMongoError as error:
        raise database_unavailable("Skills are temporarily unavailable.", error) from error


@router.post("", status_code=status.HTTP_201_CREATED)
def post_skill(payload: SkillCreate, _: str = Depends(require_admin)) -> dict:
    try:
        return create_entity("skills", payload.model_dump())
    except PyMongoError as error:
        raise database_unavailable("The skill could not be created.", error) from error


@router.put("/{item_id}")
def put_skill(item_id: str, payload: SkillUpdate, _: str = Depends(require_admin)) -> dict:
    try:
        result = update_entity("skills", item_id, payload.model_dump(exclude_unset=True))
    except ValueError as error:
        raise HTTPException(status_code=400, detail="Invalid skill ID.") from error
    except PyMongoError as error:
        raise database_unavailable("The skill could not be updated.", error) from error
    if result is None:
        raise HTTPException(status_code=404, detail="Skill not found.")
    return result


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_skill(item_id: str, _: str = Depends(require_admin)) -> Response:
    try:
        deleted = delete_entity("skills", item_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail="Invalid skill ID.") from error
    except PyMongoError as error:
        raise database_unavailable("The skill could not be deleted.", error) from error
    if not deleted:
        raise HTTPException(status_code=404, detail="Skill not found.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

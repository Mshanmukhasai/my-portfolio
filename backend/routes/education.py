from fastapi import APIRouter, Depends, HTTPException, Response, status
from pymongo.errors import PyMongoError

from backend.auth import require_admin
from backend.database import create_entity, delete_entity, list_entities, update_entity
from backend.models import EducationCreate, EducationUpdate
from backend.routes.utils import database_unavailable

router = APIRouter(prefix="/education", tags=["education"])


@router.get("")
def get_education() -> list[dict]:
    try:
        return list_entities("education")
    except PyMongoError as error:
        raise database_unavailable("Education records are temporarily unavailable.", error) from error


@router.post("", status_code=status.HTTP_201_CREATED)
def post_education(payload: EducationCreate, _: str = Depends(require_admin)) -> dict:
    try:
        return create_entity("education", payload.model_dump())
    except PyMongoError as error:
        raise database_unavailable("The education record could not be created.", error) from error


@router.put("/{item_id}")
def put_education(item_id: str, payload: EducationUpdate, _: str = Depends(require_admin)) -> dict:
    try:
        result = update_entity("education", item_id, payload.model_dump(exclude_unset=True))
    except ValueError as error:
        raise HTTPException(status_code=400, detail="Invalid education record ID.") from error
    except PyMongoError as error:
        raise database_unavailable("The education record could not be updated.", error) from error
    if result is None:
        raise HTTPException(status_code=404, detail="Education record not found.")
    return result


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_education(item_id: str, _: str = Depends(require_admin)) -> Response:
    try:
        deleted = delete_entity("education", item_id)
    except ValueError as error:
        raise HTTPException(status_code=400, detail="Invalid education record ID.") from error
    except PyMongoError as error:
        raise database_unavailable("The education record could not be deleted.", error) from error
    if not deleted:
        raise HTTPException(status_code=404, detail="Education record not found.")
    return Response(status_code=status.HTTP_204_NO_CONTENT)

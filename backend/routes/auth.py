from fastapi import APIRouter, Depends

from backend.auth import require_admin

router = APIRouter(prefix="/auth", tags=["authentication"])


@router.get("/me")
def read_admin_session(email: str = Depends(require_admin)) -> dict[str, str]:
    return {"email": email}

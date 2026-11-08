from io import BytesIO
import logging

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from PIL import Image, ImageOps, UnidentifiedImageError
from pymongo.errors import PyMongoError

from backend.auth import require_admin
from backend.database import read_profile, update_profile
from backend.models import ProfileUpdate
from backend.profile_photo_storage import delete_profile_photo, upload_profile_photo
from backend.routes.utils import database_unavailable

router = APIRouter(prefix="/profile", tags=["profile"])
logger = logging.getLogger(__name__)
MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024
MAX_PROFILE_PHOTO_PIXELS = 20_000_000
SUPPORTED_PHOTO_TYPES = {
    "JPEG": ("image/jpeg", "jpg"),
    "PNG": ("image/png", "png"),
    "WEBP": ("image/webp", "webp"),
}


@router.get("")
def get_profile() -> dict:
    try:
        return read_profile()
    except PyMongoError as error:
        raise database_unavailable("Profile data is temporarily unavailable.", error) from error


@router.put("")
def put_profile(payload: ProfileUpdate, _: str = Depends(require_admin)) -> dict:
    try:
        return update_profile(payload.model_dump(exclude_unset=True))
    except PyMongoError as error:
        raise database_unavailable("Profile data could not be updated.", error) from error


@router.post("/photo")
def post_profile_photo(
    file: UploadFile = File(...),
    _: str = Depends(require_admin),
) -> dict:
    if file.content_type not in {content_type for content_type, _ in SUPPORTED_PHOTO_TYPES.values()}:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Choose a JPEG, PNG, or WebP image.",
        )

    try:
        content = file.file.read(MAX_PROFILE_PHOTO_SIZE + 1)
    finally:
        file.file.close()

    if not content:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="The selected image is empty.")
    if len(content) > MAX_PROFILE_PHOTO_SIZE:
        raise HTTPException(
            status_code=413,
            detail="Profile photos must be 5 MB or smaller.",
        )

    extension, content_type, normalized_content = _validate_profile_photo(content, file.content_type)
    try:
        current_profile = read_profile()
    except PyMongoError as error:
        raise database_unavailable("Profile data is temporarily unavailable.", error) from error

    photo_url = upload_profile_photo(normalized_content, content_type, extension)
    try:
        updated_profile = update_profile({"photo_url": photo_url})
    except PyMongoError as error:
        try:
            delete_profile_photo(photo_url)
        except HTTPException:
            logger.exception("Could not clean up an uploaded profile photo after the database update failed.")
        raise database_unavailable("The profile photo could not be saved to the profile.", error) from error

    try:
        delete_profile_photo(current_profile.get("photo_url"))
    except HTTPException:
        logger.exception("The profile photo was replaced, but its previous stored file could not be removed.")
    return updated_profile


@router.delete("/photo")
def remove_profile_photo(_: str = Depends(require_admin)) -> dict:
    try:
        current_profile = read_profile()
        updated_profile = update_profile({"photo_url": None})
    except PyMongoError as error:
        raise database_unavailable("The profile photo could not be removed from the profile.", error) from error

    try:
        delete_profile_photo(current_profile.get("photo_url"))
    except HTTPException as error:
        logger.exception("The profile photo reference was removed, but its stored file could not be deleted.")
        raise HTTPException(
            status_code=error.status_code,
            detail="The profile photo was removed, but its stored file could not be cleaned up.",
        ) from error
    return updated_profile


def _validate_profile_photo(content: bytes, claimed_content_type: str) -> tuple[str, str, bytes]:
    try:
        with Image.open(BytesIO(content)) as image:
            image_format = image.format
            if image_format not in SUPPORTED_PHOTO_TYPES:
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail="Choose a JPEG, PNG, or WebP image.",
                )
            content_type, extension = SUPPORTED_PHOTO_TYPES[image_format]
            if content_type != claimed_content_type:
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail="The selected image type does not match its file contents.",
                )
            if image.width * image.height > MAX_PROFILE_PHOTO_PIXELS:
                raise HTTPException(
                    status_code=413,
                    detail="Profile photos must be 20 megapixels or smaller.",
                )
            if getattr(image, "n_frames", 1) != 1:
                raise HTTPException(
                    status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                    detail="Animated images are not supported for profile photos.",
                )
            image.verify()

        with Image.open(BytesIO(content)) as image:
            image.load()
            normalized = BytesIO()
            save_options = {}
            if image_format == "JPEG":
                save_options["optimize"] = True
                save_options["quality"] = 90
            elif image_format == "PNG":
                save_options["optimize"] = True
            if image_format == "WEBP":
                save_options["method"] = 6
                save_options["quality"] = 90
            ImageOps.exif_transpose(image).save(normalized, format=image_format, **save_options)
    except Image.DecompressionBombError as error:
        raise HTTPException(
            status_code=413,
            detail="Profile photos must be 20 megapixels or smaller.",
        ) from error
    except (UnidentifiedImageError, OSError, ValueError) as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The selected file is not a valid image.",
        ) from error

    if normalized.tell() > MAX_PROFILE_PHOTO_SIZE:
        raise HTTPException(
            status_code=413,
            detail="The processed profile photo exceeds the 5 MB limit.",
        )
    return extension, content_type, normalized.getvalue()

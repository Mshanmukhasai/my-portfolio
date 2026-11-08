import logging
import os
import re
from urllib.error import HTTPError, URLError
from urllib.parse import quote, unquote, urlsplit
from urllib.request import Request, urlopen
from uuid import uuid4

from fastapi import HTTPException, status

logger = logging.getLogger(__name__)
STORAGE_TIMEOUT_SECONDS = 15
PHOTO_PATH_PATTERN = re.compile(r"profile/[0-9a-f]{32}\.(?:jpg|png|webp)")


def _storage_settings() -> tuple[str, str, str]:
    supabase_url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    bucket = os.getenv("SUPABASE_STORAGE_BUCKET", "portfolio-assets").strip()
    if not supabase_url or not service_role_key or not bucket:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Profile photo storage is not configured on the server.",
        )
    return supabase_url, service_role_key, bucket


def upload_profile_photo(content: bytes, content_type: str, extension: str) -> str:
    supabase_url, service_role_key, bucket = _storage_settings()
    object_path = f"profile/{uuid4().hex}.{extension}"
    encoded_path = quote(f"{bucket}/{object_path}", safe="/")
    request = Request(
        f"{supabase_url}/storage/v1/object/{encoded_path}",
        data=content,
        headers={
            "Authorization": f"Bearer {service_role_key}",
            "apikey": service_role_key,
            "Content-Type": content_type,
            "Cache-Control": "public, max-age=31536000, immutable",
            "x-upsert": "false",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=STORAGE_TIMEOUT_SECONDS):
            pass
    except HTTPError as error:
        logger.error("Supabase rejected profile photo upload with status %s.", error.code)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The profile photo could not be uploaded to storage.",
        ) from error
    except (URLError, TimeoutError, OSError) as error:
        logger.error("Profile photo storage is unavailable: %s", error)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Profile photo storage is temporarily unavailable.",
        ) from error

    return f"{supabase_url}/storage/v1/object/public/{encoded_path}"


def delete_profile_photo(photo_url: str | None) -> None:
    if not photo_url:
        return

    supabase_url, service_role_key, bucket = _storage_settings()
    configured_origin = urlsplit(supabase_url)
    parsed_photo_url = urlsplit(photo_url)
    object_prefix = f"/storage/v1/object/public/{bucket}/"
    if (
        parsed_photo_url.scheme != configured_origin.scheme
        or parsed_photo_url.netloc != configured_origin.netloc
        or not parsed_photo_url.path.startswith(object_prefix)
    ):
        logger.warning("Skipped deleting a profile photo outside the configured storage bucket.")
        return

    object_path = unquote(parsed_photo_url.path[len(object_prefix):])
    if not PHOTO_PATH_PATTERN.fullmatch(object_path):
        logger.warning("Skipped deleting a profile photo with an unexpected storage path.")
        return

    encoded_path = quote(f"{bucket}/{object_path}", safe="/")
    request = Request(
        f"{supabase_url}/storage/v1/object/{encoded_path}",
        headers={
            "Authorization": f"Bearer {service_role_key}",
            "apikey": service_role_key,
        },
        method="DELETE",
    )
    try:
        with urlopen(request, timeout=STORAGE_TIMEOUT_SECONDS):
            pass
    except HTTPError as error:
        if error.code == 404:
            return
        logger.error("Supabase rejected profile photo deletion with status %s.", error.code)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="The profile photo could not be removed from storage.",
        ) from error
    except (URLError, TimeoutError, OSError) as error:
        logger.error("Profile photo storage is unavailable: %s", error)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Profile photo storage is temporarily unavailable.",
        ) from error

import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

bearer_scheme = HTTPBearer(auto_error=False)
AUTH_TIMEOUT_SECONDS = 5


def require_admin(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> str:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication is required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials

    supabase_url = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
    supabase_anon_key = os.getenv("SUPABASE_ANON_KEY", "").strip()
    admin_emails = {
        email.strip().casefold()
        for email in os.getenv("SUPABASE_ADMIN_EMAILS", "").split(",")
        if email.strip()
    }
    if not supabase_url or not supabase_anon_key or not admin_emails:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase admin authentication is not configured.",
        )

    request = Request(
        f"{supabase_url}/auth/v1/user",
        headers={
            "apikey": supabase_anon_key,
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        },
    )
    try:
        with urlopen(request, timeout=AUTH_TIMEOUT_SECONDS) as response:
            user = json.load(response)
    except HTTPError as error:
        if error.code >= 500:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Supabase authentication is temporarily unavailable.",
            ) from error
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session is invalid or expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from error
    except (URLError, TimeoutError, OSError) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not verify your session with Supabase.",
        ) from error
    except (json.JSONDecodeError, UnicodeDecodeError) as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase returned an invalid authentication response.",
        ) from error

    email = user.get("email") if isinstance(user, dict) else None
    if not isinstance(email, str) or not email.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session does not include a verified email address.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.get("email_confirmed_at") and not user.get("confirmed_at"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Confirm your email address before accessing the admin dashboard.",
        )

    if email.strip().casefold() not in admin_emails:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is not authorized to access the admin dashboard.",
        )
    return email.strip()

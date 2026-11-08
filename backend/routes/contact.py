import logging
import os
import smtplib
import ssl
from email.message import EmailMessage

from fastapi import APIRouter, HTTPException, Request, status

from backend.models import ContactSubmission
from backend.routes.utils import check_submission_limit

logger = logging.getLogger(__name__)
router = APIRouter(tags=["contact"])


@router.post("/contact", status_code=status.HTTP_200_OK)
def send_contact_message(payload: ContactSubmission, request: Request) -> dict[str, str]:
    check_submission_limit(request.client.host if request.client else "unknown")
    if payload.company_website:
        return {"message": "Message sent successfully!"}

    username = os.getenv("MAIL_USERNAME", "").strip()
    password = os.getenv("MAIL_PASSWORD", "")
    recipient = os.getenv("MAIL_TO", "").strip()
    if not username or not password or not recipient:
        logger.error("Contact email delivery is unavailable because mail settings are incomplete.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Contact email delivery is not configured.",
        )

    email = EmailMessage()
    email["Subject"] = f"Portfolio contact: {payload.subject}"
    email["From"] = username
    email["To"] = recipient
    email["Reply-To"] = str(payload.email)
    email.set_content(
        f"Name: {payload.name}\n"
        f"Email: {payload.email}\n"
        f"Subject: {payload.subject}\n\n"
        f"{payload.message}"
    )

    try:
        with smtplib.SMTP_SSL(
            "smtp.gmail.com",
            465,
            context=ssl.create_default_context(),
            timeout=15,
        ) as smtp:
            smtp.login(username, password)
            smtp.send_message(email)
    except (OSError, smtplib.SMTPException) as error:
        logger.exception("Contact email delivery failed.")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to send your message. Please try again.",
        ) from error

    return {"message": "Message sent successfully!"}

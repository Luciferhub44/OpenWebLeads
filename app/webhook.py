import httpx

from app.config import settings


def dispatch_webhook(payload: dict):
    url = settings.WEBHOOK_URL
    if not url:
        return
    try:
        httpx.post(url, json=payload, timeout=10.0)
    except Exception:
        pass  # ponytail: fire-and-forget, add retry queue if delivery matters

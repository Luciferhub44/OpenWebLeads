import base64
import os
import uuid
import logging

from sqlalchemy.orm import Session

from app.config import settings
from app.models import ApiKey

log = logging.getLogger(__name__)

_HAS_ENCRYPTION = bool(settings.ENCRYPTION_MASTER_KEY and len(settings.ENCRYPTION_MASTER_KEY) == 64)


def _get_cipher():
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    return AESGCM(bytes.fromhex(settings.ENCRYPTION_MASTER_KEY))


def encrypt(plaintext: str) -> bytes:
    if not _HAS_ENCRYPTION:
        # ponytail: base64 fallback when no master key — not secure, just encoding
        log.warning("ENCRYPTION_MASTER_KEY not set — storing keys base64-encoded (NOT encrypted)")
        return b"PLAIN:" + base64.b64encode(plaintext.encode())
    nonce = os.urandom(12)
    ct = _get_cipher().encrypt(nonce, plaintext.encode(), None)
    return nonce + ct


def decrypt(blob: bytes) -> str:
    if blob.startswith(b"PLAIN:"):
        return base64.b64decode(blob[6:]).decode()
    if not _HAS_ENCRYPTION:
        raise RuntimeError("Cannot decrypt — ENCRYPTION_MASTER_KEY not set but key was encrypted")
    nonce, ct = blob[:12], blob[12:]
    return _get_cipher().decrypt(nonce, ct, None).decode()


def vault_available() -> bool:
    return _HAS_ENCRYPTION


def store_key(session: Session, provider: str, api_key: str, label: str = "", model: str | None = None) -> ApiKey:
    encrypted = encrypt(api_key)
    row = ApiKey(provider=provider, encrypted_key=encrypted, label=label or provider, model_override=model)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def get_key(session: Session, provider: str) -> tuple[str, str]:
    """Returns (api_key, model). Tries vault first, then env var defaults."""
    try:
        row = session.query(ApiKey).filter_by(provider=provider, is_active=True).order_by(ApiKey.created_at.desc()).first()
        if row:
            return decrypt(row.encrypted_key), row.model_override or ""
    except Exception:
        pass

    if settings.DEFAULT_LLM_API_KEY and (provider == settings.DEFAULT_LLM_PROVIDER or not provider):
        return settings.DEFAULT_LLM_API_KEY, settings.DEFAULT_LLM_MODEL

    raise ValueError(f"No API key for '{provider}'. Set DEFAULT_LLM_API_KEY env var or store one via POST /api/v1/vault/keys")


def list_keys(session: Session) -> list[ApiKey]:
    return session.query(ApiKey).order_by(ApiKey.created_at.desc()).all()


def delete_key(session: Session, key_id: uuid.UUID) -> bool:
    row = session.get(ApiKey, key_id)
    if not row:
        return False
    session.delete(row)
    session.commit()
    return True

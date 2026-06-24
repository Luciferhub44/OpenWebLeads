import os
import uuid

from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from sqlalchemy.orm import Session

from app.config import settings
from app.models import ApiKey


def _get_cipher() -> AESGCM:
    key_hex = settings.ENCRYPTION_MASTER_KEY
    if not key_hex or len(key_hex) != 64:
        raise RuntimeError("ENCRYPTION_MASTER_KEY must be a 64-char hex string (32 bytes). Generate with: python -c \"import secrets; print(secrets.token_hex(32))\"")
    return AESGCM(bytes.fromhex(key_hex))


def encrypt(plaintext: str) -> bytes:
    nonce = os.urandom(12)
    ct = _get_cipher().encrypt(nonce, plaintext.encode(), None)
    return nonce + ct  # 12-byte nonce || ciphertext+tag


def decrypt(blob: bytes) -> str:
    nonce, ct = blob[:12], blob[12:]
    return _get_cipher().decrypt(nonce, ct, None).decode()


def store_key(session: Session, provider: str, api_key: str, label: str = "", model: str | None = None) -> ApiKey:
    encrypted = encrypt(api_key)
    row = ApiKey(provider=provider, encrypted_key=encrypted, label=label or provider, model_override=model)
    session.add(row)
    session.commit()
    session.refresh(row)
    return row


def get_key(session: Session, provider: str) -> tuple[str, str]:
    """Returns (decrypted_api_key, model) for the given provider. Falls back to env var defaults."""
    row = session.query(ApiKey).filter_by(provider=provider, is_active=True).order_by(ApiKey.created_at.desc()).first()
    if row:
        return decrypt(row.encrypted_key), row.model_override or ""
    if provider == settings.DEFAULT_LLM_PROVIDER and settings.DEFAULT_LLM_API_KEY:
        return settings.DEFAULT_LLM_API_KEY, settings.DEFAULT_LLM_MODEL
    raise ValueError(f"No API key found for provider '{provider}'. Store one via POST /api/v1/vault/keys")


def list_keys(session: Session) -> list[ApiKey]:
    return session.query(ApiKey).order_by(ApiKey.created_at.desc()).all()


def delete_key(session: Session, key_id: uuid.UUID) -> bool:
    row = session.get(ApiKey, key_id)
    if not row:
        return False
    session.delete(row)
    session.commit()
    return True

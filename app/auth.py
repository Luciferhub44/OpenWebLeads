import hashlib
import secrets
import uuid
from datetime import datetime, timezone, timedelta

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db import SyncSession
from app.models import User, UserSession

_bearer = HTTPBearer(auto_error=False)


def hash_password(password: str, salt: str) -> str:
    return hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 100_000).hex()


def create_user(session: Session, email: str, password: str, role: str = "member") -> "User":
    salt = secrets.token_hex(16)
    hashed = hash_password(password, salt)
    user = User(email=email, password_hash=hashed, salt=salt, role=role)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


def authenticate(session: Session, email: str, password: str) -> "User | None":
    user = session.query(User).filter_by(email=email, is_active=True).first()
    if not user:
        return None
    if hash_password(password, user.salt) != user.password_hash:
        return None
    return user


def create_session(session: Session, user_id: uuid.UUID) -> str:
    token = secrets.token_urlsafe(48)
    expires = datetime.now(timezone.utc) + timedelta(days=7)
    user_session = UserSession(user_id=user_id, token=token, expires_at=expires)
    session.add(user_session)
    session.commit()
    return token


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> "User":
    if not credentials:
        raise HTTPException(401, "Authentication required")

    session = SyncSession()
    try:
        user_session = session.query(UserSession).filter_by(token=credentials.credentials).first()
        if not user_session or user_session.expires_at < datetime.now(timezone.utc):
            raise HTTPException(401, "Invalid or expired token")
        user = session.get(User, user_session.user_id)
        if not user or not user.is_active:
            raise HTTPException(401, "User disabled")
        return user
    finally:
        session.close()


def require_role(*roles: str):
    def checker(user: User = Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(403, f"Requires role: {', '.join(roles)}")
        return user
    return checker

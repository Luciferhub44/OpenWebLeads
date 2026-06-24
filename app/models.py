import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, LargeBinary, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def _utcnow():
    return datetime.utcnow()


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(unique=True, index=True)
    password_hash: Mapped[str]
    salt: Mapped[str]
    role: Mapped[str] = mapped_column(default="member")  # admin, member, viewer
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(default=_utcnow, server_default=func.now())

    sessions: Mapped[list["UserSession"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class UserSession(Base):
    __tablename__ = "user_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    token: Mapped[str] = mapped_column(unique=True, index=True)
    expires_at: Mapped[datetime]
    created_at: Mapped[datetime] = mapped_column(default=_utcnow, server_default=func.now())

    user: Mapped["User"] = relationship(back_populates="sessions")


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    domain: Mapped[str] = mapped_column(unique=True, index=True)
    legal_name: Mapped[str | None] = mapped_column(default=None)
    industry: Mapped[str | None] = mapped_column(default=None)
    employee_count: Mapped[int | None] = mapped_column(default=None)
    estimated_tech_stack: Mapped[list] = mapped_column(ARRAY(Text), server_default="{}")
    funding_stage: Mapped[str | None] = mapped_column(default=None)
    summary: Mapped[str | None] = mapped_column(Text, default=None)
    raw_html: Mapped[str | None] = mapped_column(Text, default=None)
    email_patterns: Mapped[list] = mapped_column(ARRAY(Text), server_default="{}")
    created_at: Mapped[datetime] = mapped_column(default=_utcnow, server_default=func.now())
    updated_at: Mapped[datetime | None] = mapped_column(onupdate=_utcnow, default=None)

    leads: Mapped[list["Lead"]] = relationship(back_populates="company", cascade="all, delete-orphan")
    jobs: Mapped[list["Job"]] = relationship(back_populates="company")


class Lead(Base):
    __tablename__ = "leads"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("companies.id"))
    first_name: Mapped[str]
    last_name: Mapped[str]
    corporate_email: Mapped[str | None] = mapped_column(default=None)
    job_title: Mapped[str]
    linkedin_url: Mapped[str | None] = mapped_column(default=None)
    confidence_score: Mapped[float] = mapped_column(default=0.0)
    lead_metadata: Mapped[dict] = mapped_column(JSON, default=dict)
    created_at: Mapped[datetime] = mapped_column(default=_utcnow, server_default=func.now())

    company: Mapped["Company"] = relationship(back_populates="leads")


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    status: Mapped[str] = mapped_column(default="pending")
    job_type: Mapped[str] = mapped_column(default="enrich")
    target_domain: Mapped[str]
    company_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("companies.id"), default=None)
    error_message: Mapped[str | None] = mapped_column(Text, default=None)
    llm_provider: Mapped[str | None] = mapped_column(default=None)
    tokens_in: Mapped[int] = mapped_column(default=0)
    tokens_out: Mapped[int] = mapped_column(default=0)
    started_at: Mapped[datetime | None] = mapped_column(default=None)
    completed_at: Mapped[datetime | None] = mapped_column(default=None)
    created_at: Mapped[datetime] = mapped_column(default=_utcnow, server_default=func.now())

    company: Mapped["Company | None"] = relationship(back_populates="jobs")


class ApiKey(Base):
    __tablename__ = "api_keys"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider: Mapped[str] = mapped_column(index=True)
    encrypted_key: Mapped[bytes] = mapped_column(LargeBinary)
    label: Mapped[str] = mapped_column(default="")
    model_override: Mapped[str | None] = mapped_column(default=None)
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(default=_utcnow, server_default=func.now())

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


# --- Enrichment ---

class EnrichRequest(BaseModel):
    domain: str
    provider: str = ""


class EnrichResponse(BaseModel):
    job_id: uuid.UUID
    status: str


# --- Jobs ---

class JobResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    status: str
    job_type: str
    target_domain: str
    company_id: uuid.UUID | None
    llm_provider: str | None
    tokens_in: int
    tokens_out: int
    error_message: str | None
    created_at: datetime


# --- Companies ---

class CompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    domain: str
    legal_name: str | None
    industry: str | None
    employee_count: int | None
    estimated_tech_stack: list[str]
    funding_stage: str | None
    summary: str | None
    email_patterns: list[str]
    created_at: datetime


# --- Leads ---

class LeadResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    company_id: uuid.UUID
    first_name: str
    last_name: str
    corporate_email: str | None
    job_title: str
    linkedin_url: str | None
    confidence_score: float
    lead_metadata: dict
    created_at: datetime


# --- Vault ---

class ApiKeyCreate(BaseModel):
    provider: str
    api_key: str
    label: str = ""
    model_override: str | None = None


class ApiKeyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    provider: str
    label: str
    model_override: str | None
    is_active: bool
    created_at: datetime


class ProvidersResponse(BaseModel):
    providers: list[str]
    default: str


# --- Webhook ---

class WebhookConfigRequest(BaseModel):
    url: str


# --- Dedup ---

class DedupResponse(BaseModel):
    duplicates: list[dict]


# --- Scoring ---

class ScoreResponse(BaseModel):
    updated: int

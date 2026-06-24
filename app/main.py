import uuid

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.db import get_db, SyncSession
from app.llm import PROVIDERS
from app.models import Company, Job, Lead, User
from app.auth import get_current_user, require_role, create_user, authenticate, create_session
from app.schemas import (
    RegisterRequest, LoginRequest, LoginResponse, UserResponse,
    EnrichRequest, EnrichResponse, JobResponse, CompanyResponse, LeadResponse,
    ApiKeyCreate, ApiKeyResponse, ProvidersResponse,
    WebhookConfigRequest, DedupResponse, ScoreResponse,
    SalesforcePushRequest, HubSpotPushRequest, PipedrivePushRequest,
    GoogleSheetsPushRequest, NotionPushRequest,
)

app = FastAPI(title="OpenEnrich OS", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Auth ---

@app.post("/api/v1/auth/register", response_model=UserResponse)
async def register(req: RegisterRequest):
    session = SyncSession()
    try:
        if session.query(User).filter_by(email=req.email).first():
            raise HTTPException(409, "Email already registered")
        # First user gets admin role
        is_first = session.query(User).count() == 0
        user = create_user(session, req.email, req.password, role="admin" if is_first else "member")
        return user
    finally:
        session.close()


@app.post("/api/v1/auth/login", response_model=LoginResponse)
async def login(req: LoginRequest):
    session = SyncSession()
    try:
        user = authenticate(session, req.email, req.password)
        if not user:
            raise HTTPException(401, "Invalid credentials")
        token = create_session(session, user.id)
        return LoginResponse(token=token, user_id=user.id, email=user.email, role=user.role)
    finally:
        session.close()


@app.get("/api/v1/auth/me", response_model=UserResponse)
async def me(user: User = Depends(get_current_user)):
    return user


@app.get("/api/v1/auth/users", response_model=list[UserResponse])
async def list_users(user: User = Depends(require_role("admin"))):
    session = SyncSession()
    try:
        return session.query(User).order_by(User.created_at.desc()).all()
    finally:
        session.close()


# --- Health ---

@app.get("/api/v1/health")
async def health():
    return {"status": "ok"}


@app.get("/api/v1/stats")
async def stats(db: AsyncSession = Depends(get_db)):
    companies = await db.scalar(select(func.count(Company.id)))
    leads = await db.scalar(select(func.count(Lead.id)))
    jobs_total = await db.scalar(select(func.count(Job.id)))
    jobs_completed = await db.scalar(select(func.count(Job.id)).where(Job.status == "completed"))
    jobs_failed = await db.scalar(select(func.count(Job.id)).where(Job.status == "failed"))
    tokens_in = await db.scalar(select(func.coalesce(func.sum(Job.tokens_in), 0)))
    tokens_out = await db.scalar(select(func.coalesce(func.sum(Job.tokens_out), 0)))
    return {
        "companies": companies, "leads": leads,
        "jobs_total": jobs_total, "jobs_completed": jobs_completed, "jobs_failed": jobs_failed,
        "total_tokens_in": tokens_in, "total_tokens_out": tokens_out,
    }


# --- Enrichment ---

@app.post("/api/v1/enrich", response_model=EnrichResponse)
async def enrich(req: EnrichRequest, db: AsyncSession = Depends(get_db)):
    domain = req.domain.strip().lower().removeprefix("http://").removeprefix("https://").split("/")[0]
    provider = req.provider or settings.DEFAULT_LLM_PROVIDER

    if provider not in PROVIDERS:
        raise HTTPException(400, f"Unknown provider '{provider}'. Supported: {list(PROVIDERS.keys())}")

    job = Job(target_domain=domain, llm_provider=provider)
    db.add(job)
    await db.commit()
    await db.refresh(job)

    from app.tasks import enrich_company
    enrich_company.delay(str(job.id), domain, provider)

    return EnrichResponse(job_id=job.id, status=job.status)


# --- Jobs ---

@app.get("/api/v1/jobs", response_model=list[JobResponse])
async def list_jobs(
    status: str | None = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    query = select(Job).order_by(Job.created_at.desc()).offset(offset).limit(limit)
    if status:
        query = query.where(Job.status == status)
    result = await db.execute(query)
    return result.scalars().all()


@app.get("/api/v1/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    job = await db.get(Job, job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


# --- Companies ---

@app.get("/api/v1/companies", response_model=list[CompanyResponse])
async def list_companies(
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Company).order_by(Company.created_at.desc()).offset(offset).limit(limit))
    return result.scalars().all()


@app.get("/api/v1/companies/{company_id}", response_model=CompanyResponse)
async def get_company(company_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    company = await db.get(Company, company_id)
    if not company:
        raise HTTPException(404, "Company not found")
    return company


@app.get("/api/v1/companies/{company_id}/leads", response_model=list[LeadResponse])
async def get_leads(company_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Lead).where(Lead.company_id == company_id))
    return result.scalars().all()


# --- Export ---

@app.get("/api/v1/export/companies.csv")
async def export_companies_csv():
    from app.export import companies_to_csv
    session = SyncSession()
    try:
        csv_data = companies_to_csv(session)
        return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=companies.csv"})
    finally:
        session.close()


@app.get("/api/v1/export/leads.csv")
async def export_leads_csv(company_id: uuid.UUID | None = None):
    from app.export import leads_to_csv
    session = SyncSession()
    try:
        csv_data = leads_to_csv(session, company_id)
        return Response(content=csv_data, media_type="text/csv", headers={"Content-Disposition": "attachment; filename=leads.csv"})
    finally:
        session.close()


# --- Lead Scoring ---

@app.post("/api/v1/scoring/run", response_model=ScoreResponse)
async def run_scoring(company_id: uuid.UUID | None = None):
    from app.scoring import score_all_leads
    session = SyncSession()
    try:
        return ScoreResponse(updated=score_all_leads(session, company_id))
    finally:
        session.close()


# --- Dedup ---

@app.get("/api/v1/companies/{company_id}/duplicates", response_model=DedupResponse)
async def find_company_duplicates(company_id: uuid.UUID, threshold: float = Query(default=0.85, ge=0.5, le=1.0)):
    from app.dedup import find_duplicates
    session = SyncSession()
    try:
        company = session.get(Company, company_id)
        if not company:
            raise HTTPException(404, "Company not found")
        return DedupResponse(duplicates=find_duplicates(session, company, threshold))
    finally:
        session.close()


# --- CRM Push ---

@app.post("/api/v1/crm/salesforce")
async def crm_salesforce(req: SalesforcePushRequest):
    from app.crm import push_to_salesforce
    session = SyncSession()
    try:
        return push_to_salesforce(session, req.company_id, req.instance_url, req.access_token)
    finally:
        session.close()


@app.post("/api/v1/crm/hubspot")
async def crm_hubspot(req: HubSpotPushRequest):
    from app.crm import push_to_hubspot
    session = SyncSession()
    try:
        return push_to_hubspot(session, req.company_id, req.api_key)
    finally:
        session.close()


@app.post("/api/v1/crm/pipedrive")
async def crm_pipedrive(req: PipedrivePushRequest):
    from app.crm import push_to_pipedrive
    session = SyncSession()
    try:
        return push_to_pipedrive(session, req.company_id, req.api_token)
    finally:
        session.close()


# --- Egress ---

@app.post("/api/v1/egress/google-sheets")
async def egress_gsheets(req: GoogleSheetsPushRequest):
    from app.egress import push_to_google_sheets
    session = SyncSession()
    try:
        return push_to_google_sheets(session, req.company_id, req.spreadsheet_id, req.access_token, req.sheet_name)
    finally:
        session.close()


@app.post("/api/v1/egress/notion")
async def egress_notion(req: NotionPushRequest):
    from app.egress import push_to_notion
    session = SyncSession()
    try:
        return push_to_notion(session, req.company_id, req.database_id, req.api_key)
    finally:
        session.close()


# --- Vault ---

@app.get("/api/v1/providers", response_model=ProvidersResponse)
async def list_providers():
    return ProvidersResponse(providers=list(PROVIDERS.keys()), default=settings.DEFAULT_LLM_PROVIDER)


@app.post("/api/v1/vault/keys", response_model=ApiKeyResponse)
async def create_api_key(req: ApiKeyCreate):
    if req.provider not in PROVIDERS:
        raise HTTPException(400, f"Unknown provider '{req.provider}'. Supported: {list(PROVIDERS.keys())}")
    from app.vault import store_key
    session = SyncSession()
    try:
        return store_key(session, req.provider, req.api_key, req.label, req.model_override)
    finally:
        session.close()


@app.get("/api/v1/vault/keys", response_model=list[ApiKeyResponse])
async def list_api_keys():
    from app.vault import list_keys
    session = SyncSession()
    try:
        return list_keys(session)
    finally:
        session.close()


@app.delete("/api/v1/vault/keys/{key_id}")
async def delete_api_key(key_id: uuid.UUID):
    from app.vault import delete_key
    session = SyncSession()
    try:
        if not delete_key(session, key_id):
            raise HTTPException(404, "Key not found")
        return {"status": "deleted"}
    finally:
        session.close()


# --- Webhook ---

@app.get("/api/v1/webhook")
async def get_webhook():
    return {"url": settings.WEBHOOK_URL}


@app.put("/api/v1/webhook")
async def set_webhook(req: WebhookConfigRequest):
    settings.WEBHOOK_URL = req.url
    return {"url": settings.WEBHOOK_URL}

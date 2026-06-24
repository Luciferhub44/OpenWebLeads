# OpenEnrich OS — Product Requirements Document

> Open-source B2B lead enrichment platform: scrape the web, enrich with AI agents, export clean leads.

---

## 1. Executive Summary & Core Philosophy

**Mission:** Democratize B2B data extraction and enrichment with a robust, transparent, and scalable open-source Python engine.

**Core Philosophy — BYOK (Bring Your Own Key):** Data brokers charge immense markups. Users plug in their own API keys (LLMs, scraping APIs, proxies) and pay only the raw cost of compute and API usage. No vendor lock-in, total data privacy, ultimate extensibility.

**What it replaces:** Apollo, ZoomInfo, Clearbit — with a self-hostable alternative users control end-to-end.

---

## 2. System Architecture

### 2.1 Core Stack

| Layer              | Technology                                                                 |
|--------------------|---------------------------------------------------------------------------|
| **API**            | FastAPI (Python 3.11+, async REST + WebSocket)                            |
| **Task Queue**     | Celery + Redis broker                                                     |
| **Database**       | PostgreSQL (SQLAlchemy/SQLModel) + pgvector                               |
| **Scraping**       | Playwright (headless, stealth, containerized) + Apify/Firecrawl adapters  |
| **AI/Agents**      | Pydantic AI (multi-vendor LLM support via BYOK)                           |
| **Data Validation**| Pydantic (strict schema enforcement, hallucination mitigation)            |
| **Frontend**       | Next.js (Phase 3)                                                         |

### 2.2 Architecture Diagram

```
[User Request / Frontend]
        │
        ▼
  (FastAPI Endpoint)
        │
        ▼
  [Push Task to Redis]
        │
        ▼
  [Celery Worker Cluster]
  ┌─────────┼─────────────┐
  ▼         ▼             ▼
[Scraping   [BYOK        [AI Agent
 Pipeline]   Key Vault]    Pipeline]
(Playwright  (AES-256     (Pydantic AI
 /Proxies)   Decryption)   / LLMs)
```

### 2.3 The Pipeline Flow

1. **Ingestion** — User inputs bare URLs, business names, or location/category queries (e.g., "plumbers in Berlin")
2. **Discovery (Scraping)** — Engine crawls targets (Google Maps, websites, LinkedIn), extracts raw DOM content, caches it
3. **Sanitization** — Pydantic models extract base text and normalize standard fields (emails, phones, addresses)
4. **Agentic Enrichment** — Raw text passed to LLMs (via user's BYOK keys). Agents determine: industry, funding stage, decision-makers, buying intent
5. **Delivery** — Webhook dispatch, CSV export, or direct CRM integration (HubSpot/Salesforce)

---

## 3. Core Backend Components

### 3.1 BYOK Secure Secret Vault

Secure storage of multi-vendor API keys for LLM providers and scraping services.

- **Encryption:** AES-256-GCM symmetric encryption in PostgreSQL
- **Key Decoupling:** Master encryption key injected at runtime via `ENCRYPTION_MASTER_KEY` env var — never stored in DB
- **Supported Adapters:** OpenAI, Anthropic, Mistral, Google Gemini, Firecrawl, Jina AI, ScrapeOps, custom proxy gateways

### 3.2 Proxy Management

- Built-in middleware to rotate user-provided proxies (residential/datacenter) to prevent IP bans during scraping
- Configurable rate limits per domain to prevent aggressive scraping and ensure compliance with target site constraints

### 3.3 Security Sandboxing

- **Default-Deny Networking:** Sandbox the agentic execution environment so third-party Python packages or LLM outputs cannot execute malicious code over the network

---

## 4. Data Architecture & Schema Definitions

Pydantic models enforce validation at every layer — scraper output, AI agent output, and API responses — so no hallucinated data contaminates lead exports.

### 4.1 Data Models

```python
from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, EmailStr, HttpUrl
from enum import Enum


class JobStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class CompanyBase(BaseModel):
    """CompanyModel: domain, legal name, employee count, industry, tech stack, social links."""
    domain: str = Field(..., description="Primary web domain of the corporate target")
    legal_name: Optional[str] = None
    industry: Optional[str] = None
    employee_count: Optional[int] = None
    estimated_tech_stack: List[str] = []
    funding_stage: Optional[str] = None
    summary: Optional[str] = None


class LeadBase(BaseModel):
    """LeadModel: name, title, LinkedIn, predicted email, confidence score."""
    first_name: str
    last_name: str
    corporate_email: Optional[EmailStr] = None
    job_title: str
    linkedin_url: Optional[HttpUrl] = None
    confidence_score: float = Field(default=0.0, ge=0.0, le=1.0)
    metadata: Dict[str, Any] = {}


class CampaignRunLog(BaseModel):
    """RunLogModel: cost-tracking per run — tokens, proxy bandwidth, total spend."""
    id: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    status: JobStatus
    total_tokens_consumed: int = 0
    estimated_cost_usd: float = 0.0
    proxy_bandwidth_bytes: int = 0
```

---

## 5. Infrastructure, Deployment & Security

### 5.1 Local Development (docker-compose)

Single-command spin-up. Accessible for solo developers on a laptop.

| Service          | Description                                              |
|------------------|----------------------------------------------------------|
| `web-api`        | FastAPI application exposed on port 8000                 |
| `celery-worker`  | Micro-container with Playwright dependencies pre-baked   |
| `postgres-db`    | PostgreSQL with pgvector extension                       |
| `redis-broker`   | Redis Alpine optimized for high memory throughput        |

### 5.2 Enterprise Production Scale

Kubernetes cluster deployment with:

- **Pod Scaling:** HPA scales celery-worker pods based on Redis queue depth
- **Network Segregation:** NetworkPolicies isolate worker pods — scraping runs on isolated network segments

---

## 6. Monetization Model & Product Plans

COSS (Commercial Open Source Software) strategy. Core code is MIT/Apache 2.0 licensed forever.

| Feature               | Community (OSS)            | Cloud Managed (SaaS)          | Enterprise                          |
|-----------------------|---------------------------|-------------------------------|-------------------------------------|
| Core Architecture     | Full source code access   | Managed cloud infrastructure  | Managed or airgapped VPC            |
| BYOK Integrations     | Unlimited (self-managed)  | Unlimited (vault hosted)      | Managed vault + custom APIs         |
| Seat Limits           | Single instance / local   | Multi-user / collaborative    | SSO, SAML, RBAC controls            |
| Export Engines        | CSV, JSON Lines           | CSV, GSheets, Webhooks        | Direct CRM sync (Salesforce/HubSpot)|
| Cost Dashboard        | Basic run logs            | Predictive billing analytics  | Enterprise budget caps & guardrails |
| Support               | GitHub Issues / Discord   | Email & ticket support        | Dedicated SLA & solutions architect |
| Pricing               | **Free (forever)**        | $49 – $149/mo                 | Custom enterprise agreement         |

---

## 7. Implementation Roadmap

```
Phase 1: Foundation   (Weeks 1–4)   ══> Core Scraper, Database Engine, Local Compose
Phase 2: Intelligence (Weeks 5–8)   ══> BYOK Vault, Micro-Agent Layer, Pydantic Verification
Phase 3: Experience   (Weeks 9–12)  ══> Next.js Dashboard, Cost Tracking Analytics
Phase 4: Scale        (Weeks 13+)   ══> Enterprise RBAC, CRM Connectors, Vector Dedup
```

### Phase 1: Core Foundation & Scraper Pipeline (Weeks 1–4)

- Define standard Pydantic schemas for Leads and Companies
- Build FastAPI backend and Celery task queue
- Implement URL-to-HTML scraping with Playwright (stealth, containerized)
- First LLM enrichment pipeline (extract basic firmographics from text)
- Async database migrations with Alembic; baseline PostgreSQL schemas
- Ship initial `docker-compose.yml`

### Phase 2: Agentic Integration & BYOK Secret Management (Weeks 5–8)

- AES-256-GCM encryption pipeline for the BYOK vault (secure API key storage)
- Multi-agent AI orchestration — split tasks between specialized agents (Email Pattern Finder, Company Summarizer, Company Sizer)
- Proxy rotation and retry logic for failed scrapes
- Token metrics counters for per-task cost tracking

### Phase 3: Dashboard Interface & Egress Connectors (Weeks 9–12)

- React/Next.js UI for visual pipeline definitions and campaign management
- Ingestion profiles: text uploads, domain dumps, CSV imports
- Egress hooks: Google Sheets, Notion, generic Webhooks
- Cost Dashboard — exact API spend visibility per campaign

### Phase 4: Enterprise Scale & CRM Pipelines (Weeks 13+)

- CRM sync: Salesforce, HubSpot, Pipedrive
- Vector database integration (pgvector/ChromaDB) for semantic lead matching and duplicate suppression
- Lead Scoring models
- Multi-tenant architecture with SSO security controls
- Launch managed cloud version for non-technical users

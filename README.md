# OpenEnrich OS

Open-source B2B lead enrichment engine. Scrape the web, enrich with AI agents, export clean leads.

**BYOK (Bring Your Own Key)** — plug in your own LLM and scraping API keys. Pay only raw API costs. No vendor lock-in.

## Supported LLM Providers

OpenAI, Anthropic, Google Gemini, Grok (xAI), Mistral, Groq, DeepSeek — or any OpenAI-compatible endpoint.

## One-Step Install

```bash
git clone https://github.com/Luciferhub44/OpenWebLeads.git && cd OpenWebLeads && python3 setup.py
```

The interactive wizard walks you through provider selection, key configuration, and launches everything.

**Or use the Web UI wizard** after starting: open `http://localhost:8000/setup`

## Manual Quick Start

```bash
# 1. Clone and configure
git clone https://github.com/Luciferhub44/OpenWebLeads.git && cd OpenWebLeads
cp .env.example .env
# Edit .env — set at minimum: DEFAULT_LLM_API_KEY

# 2. Start everything (encryption key and LLM key are optional at boot)
docker compose up --build

# 3. Run database migrations
docker compose exec web alembic upgrade head

# 4. Open the setup wizard
open http://localhost:8000/setup

# 5. Or register manually
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "changeme"}'
```

**Services:**

| Service  | URL                    |
|----------|------------------------|
| API      | http://localhost:8000  |
| Frontend | http://localhost:3000  |
| Postgres | localhost:5432         |
| Redis    | localhost:6379         |

## API Usage

### Enrich a domain

```bash
# Start enrichment job
curl -X POST http://localhost:8000/api/v1/enrich \
  -H "Content-Type: application/json" \
  -d '{"domain": "stripe.com", "provider": "openai"}'

# Poll job status
curl http://localhost:8000/api/v1/jobs/{job_id}

# Get enriched company
curl http://localhost:8000/api/v1/companies/{company_id}

# Get extracted leads
curl http://localhost:8000/api/v1/companies/{company_id}/leads
```

### BYOK Vault — Store API Keys

```bash
# Store an API key (encrypted with AES-256-GCM)
curl -X POST http://localhost:8000/api/v1/vault/keys \
  -H "Content-Type: application/json" \
  -d '{"provider": "anthropic", "api_key": "sk-ant-...", "label": "my claude key"}'

# List stored keys (never shows plaintext)
curl http://localhost:8000/api/v1/vault/keys
```

### Export

```bash
curl http://localhost:8000/api/v1/export/companies.csv -o companies.csv
curl http://localhost:8000/api/v1/export/leads.csv -o leads.csv
```

### CRM Push

```bash
# Salesforce
curl -X POST http://localhost:8000/api/v1/crm/salesforce \
  -H "Content-Type: application/json" \
  -d '{"company_id": "...", "instance_url": "https://yourorg.salesforce.com", "access_token": "..."}'

# HubSpot
curl -X POST http://localhost:8000/api/v1/crm/hubspot \
  -H "Content-Type: application/json" \
  -d '{"company_id": "...", "api_key": "..."}'

# Pipedrive
curl -X POST http://localhost:8000/api/v1/crm/pipedrive \
  -H "Content-Type: application/json" \
  -d '{"company_id": "...", "api_token": "..."}'
```

### Egress Connectors

```bash
# Google Sheets
curl -X POST http://localhost:8000/api/v1/egress/google-sheets \
  -H "Content-Type: application/json" \
  -d '{"company_id": "...", "spreadsheet_id": "...", "access_token": "..."}'

# Notion
curl -X POST http://localhost:8000/api/v1/egress/notion \
  -H "Content-Type: application/json" \
  -d '{"company_id": "...", "database_id": "...", "api_key": "..."}'
```

## Architecture

```
User → FastAPI → Redis → Celery Workers → [Scraper + LLM Agents] → PostgreSQL
                                                                  → Webhook
                                                                  → CRM / Sheets / Notion
```

**Enrichment Pipeline (per domain):**
1. Playwright scrapes the website (with proxy rotation + per-domain rate limiting)
2. Agent 1: Extract firmographics (industry, size, funding, tech stack)
3. Agent 2: Find email patterns and addresses
4. Agent 3: Extract contacts → create Lead records
5. Lead scoring (completeness-based)
6. pgvector embedding for duplicate detection
7. Webhook dispatch on completion

## Auth & RBAC

- `POST /api/v1/auth/register` — first user gets `admin` role
- `POST /api/v1/auth/login` — returns Bearer token (7-day expiry)
- Roles: `admin`, `member`, `viewer`
- Protected endpoints use `Authorization: Bearer <token>` header

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | Yes | Redis connection string |
| `ENCRYPTION_MASTER_KEY` | Yes | 64-char hex string for AES-256-GCM vault |
| `DEFAULT_LLM_API_KEY` | Yes | Fallback LLM key when no BYOK key in vault |
| `DEFAULT_LLM_PROVIDER` | No | Default: `openai` |
| `DEFAULT_LLM_MODEL` | No | Default: `gpt-4o-mini` |
| `PROXY_URLS` | No | Comma-separated proxy URLs for scraping |
| `WEBHOOK_URL` | No | URL to POST enrichment results to |

## Running Tests

```bash
pip install ".[test]"
pytest tests/ -v
```

## Tech Stack

- **API:** FastAPI (Python 3.11+)
- **Task Queue:** Celery + Redis
- **Database:** PostgreSQL + pgvector
- **Scraping:** Playwright (headless Chromium)
- **AI:** Multi-provider LLM via BYOK (no SDK deps)
- **Encryption:** AES-256-GCM (cryptography lib)
- **Frontend:** Next.js + Tailwind CSS
- **Auth:** PBKDF2 password hashing, Bearer token sessions

## License

MIT

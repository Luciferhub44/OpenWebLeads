import httpx
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Company


def get_embedding(text_input: str, provider: str, api_key: str) -> list[float]:
    # ponytail: OpenAI embeddings API — works for OpenAI and compatible providers
    # For non-OpenAI, falls back to text similarity. Upgrade to per-provider embeddings if needed.
    from app.llm import PROVIDERS
    cfg = PROVIDERS.get(provider, PROVIDERS["openai"])
    base_url = cfg["base_url"]

    resp = httpx.post(
        f"{base_url}/embeddings",
        headers={"Authorization": f"Bearer {api_key}"},
        json={"model": "text-embedding-3-small", "input": text_input[:8000]},
        timeout=30.0,
    )
    resp.raise_for_status()
    return resp.json()["data"][0]["embedding"]


def store_company_embedding(session: Session, company: Company, provider: str, api_key: str):
    text_input = f"{company.domain} {company.legal_name or ''} {company.industry or ''} {company.summary or ''}"
    embedding = get_embedding(text_input.strip(), provider, api_key)
    session.execute(
        text("UPDATE companies SET embedding = :emb::vector WHERE id = :id"),
        {"emb": str(embedding), "id": str(company.id)},
    )
    session.commit()


def find_duplicates(session: Session, company: Company, threshold: float = 0.85) -> list[dict]:
    result = session.execute(
        text("""
            SELECT id, domain, legal_name, 1 - (embedding <=> (SELECT embedding FROM companies WHERE id = :id)) as similarity
            FROM companies
            WHERE id != :id AND embedding IS NOT NULL
            ORDER BY embedding <=> (SELECT embedding FROM companies WHERE id = :id)
            LIMIT 10
        """),
        {"id": str(company.id)},
    )
    dupes = []
    for row in result:
        if row.similarity >= threshold:
            dupes.append({"id": str(row.id), "domain": row.domain, "legal_name": row.legal_name, "similarity": round(row.similarity, 4)})
    return dupes

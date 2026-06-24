import uuid
import traceback
from datetime import datetime

from celery import Celery

from app.config import settings

celery_app = Celery("openenrich", broker=settings.REDIS_URL)


@celery_app.task(name="enrich_company")
def enrich_company(job_id: str, domain: str, provider: str = ""):
    from app.db import SyncSession
    from app.models import Company, Job, Lead
    from app.scraper import scrape_url
    from app.enrichment import extract_firmographics, extract_email_patterns, extract_contacts
    from app.vault import get_key
    from app.scoring import score_lead
    from app.webhook import dispatch_webhook

    provider = provider or settings.DEFAULT_LLM_PROVIDER
    session = SyncSession()
    total_in, total_out = 0, 0

    try:
        job = session.get(Job, uuid.UUID(job_id))
        job.status = "processing"
        job.llm_provider = provider
        job.started_at = datetime.utcnow()
        session.commit()

        api_key, model = get_key(session, provider)

        company = session.query(Company).filter_by(domain=domain).first()
        if not company:
            company = Company(domain=domain)
            session.add(company)
            session.commit()
            session.refresh(company)

        html = scrape_url(f"https://{domain}")
        company.raw_html = html

        firmographics, usage = extract_firmographics(html, provider, api_key, model or None)
        total_in += usage["input"]
        total_out += usage["output"]
        company.legal_name = firmographics.get("legal_name")
        company.industry = firmographics.get("industry")
        company.employee_count = firmographics.get("employee_count")
        company.estimated_tech_stack = firmographics.get("estimated_tech_stack", [])
        company.funding_stage = firmographics.get("funding_stage")
        company.summary = firmographics.get("summary")

        email_data, usage = extract_email_patterns(html, provider, api_key, model or None)
        total_in += usage["input"]
        total_out += usage["output"]
        found_emails = email_data.get("found_emails", [])
        company.email_patterns = email_data.get("email_patterns", [])

        contacts, usage = extract_contacts(html, provider, api_key, model or None)
        total_in += usage["input"]
        total_out += usage["output"]

        for contact in contacts:
            email = contact.get("email")
            if not email and found_emails:
                email = found_emails[0]
            lead = Lead(
                company_id=company.id,
                first_name=contact.get("first_name", ""),
                last_name=contact.get("last_name", ""),
                job_title=contact.get("job_title", "Unknown"),
                corporate_email=email,
                linkedin_url=contact.get("linkedin_url"),
                confidence_score=contact.get("confidence", 0.5),
            )
            session.add(lead)
            session.flush()
            s = score_lead(lead, company)
            lead.confidence_score = s
            lead.lead_metadata = {"lead_score": s}

        # pgvector embedding for dedup (best-effort, skip if no embedding API)
        try:
            from app.dedup import store_company_embedding
            store_company_embedding(session, company, provider, api_key)
        except Exception:
            pass  # ponytail: embedding is optional, dedup still works without it

        job.company_id = company.id
        job.tokens_in = total_in
        job.tokens_out = total_out
        job.status = "completed"
        job.completed_at = datetime.utcnow()
        session.commit()

        dispatch_webhook({
            "event": "enrichment.completed",
            "job_id": job_id,
            "domain": domain,
            "company_id": str(company.id),
            "leads_count": len(contacts),
            "tokens_in": total_in,
            "tokens_out": total_out,
        })

    except Exception:
        session.rollback()
        job = session.get(Job, uuid.UUID(job_id))
        if job:
            job.status = "failed"
            job.tokens_in = total_in
            job.tokens_out = total_out
            job.error_message = traceback.format_exc()[-1000:]
            job.completed_at = datetime.utcnow()
            session.commit()

        dispatch_webhook({"event": "enrichment.failed", "job_id": job_id, "domain": domain, "error": traceback.format_exc()[-500:]})
    finally:
        session.close()

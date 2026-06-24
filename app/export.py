import csv
import io

from sqlalchemy.orm import Session

from app.models import Company, Lead


def companies_to_csv(session: Session, company_ids: list | None = None) -> str:
    query = session.query(Company)
    if company_ids:
        query = query.filter(Company.id.in_(company_ids))
    companies = query.all()

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "domain", "legal_name", "industry", "employee_count", "tech_stack", "funding_stage", "summary", "email_patterns", "created_at"])
    for c in companies:
        writer.writerow([str(c.id), c.domain, c.legal_name, c.industry, c.employee_count, ";".join(c.estimated_tech_stack or []), c.funding_stage, c.summary, ";".join(c.email_patterns or []), c.created_at.isoformat()])
    return buf.getvalue()


def leads_to_csv(session: Session, company_id=None) -> str:
    query = session.query(Lead)
    if company_id:
        query = query.filter(Lead.company_id == company_id)
    leads = query.all()

    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["id", "company_id", "first_name", "last_name", "corporate_email", "job_title", "linkedin_url", "confidence_score", "lead_score", "created_at"])
    for l in leads:
        writer.writerow([str(l.id), str(l.company_id), l.first_name, l.last_name, l.corporate_email, l.job_title, l.linkedin_url, l.confidence_score, l.lead_metadata.get("lead_score", ""), l.created_at.isoformat()])
    return buf.getvalue()

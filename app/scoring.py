from app.models import Lead, Company


def score_lead(lead: Lead, company: Company | None = None) -> float:
    score = 0.0

    if lead.corporate_email:
        score += 0.3
    if lead.linkedin_url:
        score += 0.2
    if lead.first_name and lead.last_name:
        score += 0.1
    if lead.job_title and lead.job_title != "Unknown":
        score += 0.1

    if company:
        if company.industry:
            score += 0.1
        if company.employee_count and company.employee_count > 0:
            score += 0.1
        if company.summary:
            score += 0.1

    return min(round(score, 2), 1.0)


def score_all_leads(session, company_id=None):
    query = session.query(Lead)
    if company_id:
        query = query.filter(Lead.company_id == company_id)

    updated = 0
    for lead in query.all():
        company = session.get(Company, lead.company_id) if lead.company_id else None
        s = score_lead(lead, company)
        meta = dict(lead.lead_metadata or {})
        meta["lead_score"] = s
        lead.lead_metadata = meta
        lead.confidence_score = s
        updated += 1

    session.commit()
    return updated

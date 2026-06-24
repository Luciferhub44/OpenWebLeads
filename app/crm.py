import httpx
from sqlalchemy.orm import Session

from app.models import Company, Lead


def _leads_to_dicts(session: Session, company_id) -> tuple[dict, list[dict]]:
    company = session.get(Company, company_id)
    leads = session.query(Lead).filter_by(company_id=company_id).all()
    company_data = {
        "domain": company.domain,
        "name": company.legal_name or company.domain,
        "industry": company.industry,
        "employee_count": company.employee_count,
    }
    lead_dicts = [
        {
            "first_name": l.first_name,
            "last_name": l.last_name,
            "email": l.corporate_email,
            "title": l.job_title,
            "linkedin": l.linkedin_url,
            "score": l.confidence_score,
        }
        for l in leads
    ]
    return company_data, lead_dicts


# --- Salesforce ---

def push_to_salesforce(session: Session, company_id, instance_url: str, access_token: str) -> dict:
    company_data, lead_dicts = _leads_to_dicts(session, company_id)
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}

    # Create Account
    acct_resp = httpx.post(
        f"{instance_url}/services/data/v59.0/sobjects/Account",
        headers=headers,
        json={"Name": company_data["name"], "Website": company_data["domain"], "Industry": company_data["industry"]},
        timeout=30.0,
    )
    acct_resp.raise_for_status()
    account_id = acct_resp.json()["id"]

    # Create Contacts
    contact_ids = []
    for lead in lead_dicts:
        resp = httpx.post(
            f"{instance_url}/services/data/v59.0/sobjects/Contact",
            headers=headers,
            json={
                "AccountId": account_id,
                "FirstName": lead["first_name"],
                "LastName": lead["last_name"],
                "Email": lead["email"],
                "Title": lead["title"],
            },
            timeout=30.0,
        )
        resp.raise_for_status()
        contact_ids.append(resp.json()["id"])

    return {"account_id": account_id, "contact_ids": contact_ids}


# --- HubSpot ---

def push_to_hubspot(session: Session, company_id, api_key: str) -> dict:
    company_data, lead_dicts = _leads_to_dicts(session, company_id)
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}

    # Create Company
    comp_resp = httpx.post(
        "https://api.hubapi.com/crm/v3/objects/companies",
        headers=headers,
        json={"properties": {"name": company_data["name"], "domain": company_data["domain"], "industry": company_data["industry"]}},
        timeout=30.0,
    )
    comp_resp.raise_for_status()
    hubspot_company_id = comp_resp.json()["id"]

    # Create Contacts
    contact_ids = []
    for lead in lead_dicts:
        resp = httpx.post(
            "https://api.hubapi.com/crm/v3/objects/contacts",
            headers=headers,
            json={"properties": {"firstname": lead["first_name"], "lastname": lead["last_name"], "email": lead["email"], "jobtitle": lead["title"]}},
            timeout=30.0,
        )
        resp.raise_for_status()
        cid = resp.json()["id"]
        contact_ids.append(cid)

        # Associate contact → company
        httpx.put(
            f"https://api.hubapi.com/crm/v3/objects/contacts/{cid}/associations/companies/{hubspot_company_id}/contact_to_company",
            headers=headers,
            timeout=10.0,
        )

    return {"company_id": hubspot_company_id, "contact_ids": contact_ids}


# --- Pipedrive ---

def push_to_pipedrive(session: Session, company_id, api_token: str) -> dict:
    company_data, lead_dicts = _leads_to_dicts(session, company_id)
    base = "https://api.pipedrive.com/v1"

    # Create Organization
    org_resp = httpx.post(
        f"{base}/organizations?api_token={api_token}",
        json={"name": company_data["name"]},
        timeout=30.0,
    )
    org_resp.raise_for_status()
    org_id = org_resp.json()["data"]["id"]

    # Create Persons
    person_ids = []
    for lead in lead_dicts:
        resp = httpx.post(
            f"{base}/persons?api_token={api_token}",
            json={
                "name": f"{lead['first_name']} {lead['last_name']}",
                "email": [lead["email"]] if lead["email"] else [],
                "org_id": org_id,
            },
            timeout=30.0,
        )
        resp.raise_for_status()
        person_ids.append(resp.json()["data"]["id"])

    return {"organization_id": org_id, "person_ids": person_ids}

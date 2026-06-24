import httpx
from sqlalchemy.orm import Session

from app.models import Company, Lead


def _company_lead_rows(session: Session, company_id) -> list[list[str]]:
    company = session.get(Company, company_id)
    leads = session.query(Lead).filter_by(company_id=company_id).all()
    rows = []
    for l in leads:
        rows.append([
            company.domain, company.legal_name or "", company.industry or "",
            l.first_name, l.last_name, l.corporate_email or "",
            l.job_title, l.linkedin_url or "", str(l.confidence_score),
        ])
    return rows


# --- Google Sheets ---

HEADER = ["Domain", "Company", "Industry", "First Name", "Last Name", "Email", "Title", "LinkedIn", "Score"]


def push_to_google_sheets(session: Session, company_id, spreadsheet_id: str, access_token: str, sheet_name: str = "Sheet1") -> dict:
    rows = _company_lead_rows(session, company_id)
    all_rows = [HEADER] + rows

    resp = httpx.post(
        f"https://sheets.googleapis.com/v4/spreadsheets/{spreadsheet_id}/values/{sheet_name}:append",
        headers={"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"},
        params={"valueInputOption": "USER_ENTERED", "insertDataOption": "INSERT_ROWS"},
        json={"values": all_rows},
        timeout=30.0,
    )
    resp.raise_for_status()
    return {"updated_range": resp.json().get("updates", {}).get("updatedRange", ""), "rows": len(rows)}


# --- Notion ---

def push_to_notion(session: Session, company_id, database_id: str, api_key: str) -> dict:
    rows = _company_lead_rows(session, company_id)
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
    }

    page_ids = []
    for row in rows:
        props = {
            "Domain": {"title": [{"text": {"content": row[0]}}]},
            "Company": {"rich_text": [{"text": {"content": row[1]}}]},
            "Industry": {"rich_text": [{"text": {"content": row[2]}}]},
            "First Name": {"rich_text": [{"text": {"content": row[3]}}]},
            "Last Name": {"rich_text": [{"text": {"content": row[4]}}]},
            "Email": {"email": row[5] or None},
            "Title": {"rich_text": [{"text": {"content": row[6]}}]},
            "LinkedIn": {"url": row[7] or None},
            "Score": {"number": float(row[8]) if row[8] else 0},
        }
        resp = httpx.post(
            "https://api.notion.com/v1/pages",
            headers=headers,
            json={"parent": {"database_id": database_id}, "properties": props},
            timeout=30.0,
        )
        resp.raise_for_status()
        page_ids.append(resp.json()["id"])

    return {"page_ids": page_ids}

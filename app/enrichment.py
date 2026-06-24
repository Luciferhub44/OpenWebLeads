import json
import re

from app.llm import call_llm

_FIRMOGRAPHICS_PROMPT = """Extract company firmographics from the following webpage text.
Return ONLY valid JSON with these fields:
{
  "legal_name": "string or null",
  "industry": "string or null",
  "employee_count": integer or null,
  "estimated_tech_stack": ["string"],
  "funding_stage": "string or null",
  "summary": "one paragraph summary of what the company does"
}"""

_EMAIL_PATTERN_PROMPT = """Analyze the webpage text for email patterns and contact information.
Look for: actual email addresses, mailto links, email format hints (e.g. firstname.lastname@domain), contact forms, team pages.
Return ONLY valid JSON:
{
  "found_emails": ["email@example.com"],
  "email_patterns": ["first.last@domain", "firstinitial.last@domain"],
  "contact_pages": ["https://example.com/contact"]
}"""

_CONTACTS_PROMPT = """Extract people/contacts from the webpage text. Look for team pages, about pages, leadership bios, staff listings.
Return ONLY valid JSON:
{
  "contacts": [
    {
      "first_name": "string",
      "last_name": "string",
      "job_title": "string",
      "email": "string or null",
      "linkedin_url": "string or null",
      "confidence": 0.0 to 1.0
    }
  ]
}
If no contacts found, return {"contacts": []}."""


def _strip_html(html: str, max_chars: int = 12000) -> str:
    text = re.sub(r"<[^>]+>", " ", html)
    return re.sub(r"\s+", " ", text).strip()[:max_chars]


def extract_firmographics(html: str, provider: str, api_key: str, model: str | None = None) -> tuple[dict, dict]:
    """Returns (firmographics_dict, usage_dict)."""
    text = _strip_html(html)
    result = call_llm(provider, api_key, _FIRMOGRAPHICS_PROMPT, text, model=model)
    return json.loads(result["content"]), result["usage"]


def extract_email_patterns(html: str, provider: str, api_key: str, model: str | None = None) -> tuple[dict, dict]:
    """Returns (email_data_dict, usage_dict)."""
    text = _strip_html(html)
    result = call_llm(provider, api_key, _EMAIL_PATTERN_PROMPT, text, model=model)
    return json.loads(result["content"]), result["usage"]


def extract_contacts(html: str, provider: str, api_key: str, model: str | None = None) -> tuple[list[dict], dict]:
    """Returns (contacts_list, usage_dict)."""
    text = _strip_html(html)
    result = call_llm(provider, api_key, _CONTACTS_PROMPT, text, model=model)
    data = json.loads(result["content"])
    return data.get("contacts", []), result["usage"]

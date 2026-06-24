from app.crm import _leads_to_dicts
from unittest.mock import MagicMock
import uuid


def test_leads_to_dicts():
    company = MagicMock()
    company.domain = "test.com"
    company.legal_name = "Test Inc"
    company.industry = "Tech"
    company.employee_count = 50

    lead = MagicMock()
    lead.first_name = "Jane"
    lead.last_name = "Doe"
    lead.corporate_email = "jane@test.com"
    lead.job_title = "CTO"
    lead.linkedin_url = "https://linkedin.com/in/jane"
    lead.confidence_score = 0.9
    lead.company_id = company.id

    session = MagicMock()
    session.get.return_value = company
    session.query.return_value.filter_by.return_value.all.return_value = [lead]

    company_data, lead_dicts = _leads_to_dicts(session, uuid.uuid4())
    assert company_data["domain"] == "test.com"
    assert len(lead_dicts) == 1
    assert lead_dicts[0]["email"] == "jane@test.com"

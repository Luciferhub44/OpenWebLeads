from app.egress import _company_lead_rows, HEADER
from unittest.mock import MagicMock
import uuid


def test_company_lead_rows_format():
    company = MagicMock()
    company.domain = "acme.com"
    company.legal_name = "Acme Corp"
    company.industry = "Manufacturing"

    lead = MagicMock()
    lead.first_name = "John"
    lead.last_name = "Smith"
    lead.corporate_email = "john@acme.com"
    lead.job_title = "VP Sales"
    lead.linkedin_url = ""
    lead.confidence_score = 0.75

    session = MagicMock()
    session.get.return_value = company
    session.query.return_value.filter_by.return_value.all.return_value = [lead]

    rows = _company_lead_rows(session, uuid.uuid4())
    assert len(rows) == 1
    assert rows[0][0] == "acme.com"
    assert rows[0][5] == "john@acme.com"


def test_header_length():
    assert len(HEADER) == 9

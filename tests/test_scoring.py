from unittest.mock import MagicMock
from app.scoring import score_lead


def _make_lead(**kwargs):
    lead = MagicMock()
    lead.corporate_email = kwargs.get("email")
    lead.linkedin_url = kwargs.get("linkedin")
    lead.first_name = kwargs.get("first_name", "John")
    lead.last_name = kwargs.get("last_name", "Doe")
    lead.job_title = kwargs.get("job_title", "Unknown")
    return lead


def _make_company(**kwargs):
    company = MagicMock()
    company.industry = kwargs.get("industry")
    company.employee_count = kwargs.get("employee_count")
    company.summary = kwargs.get("summary")
    return company


def test_empty_lead_scores_low():
    lead = _make_lead(job_title="Unknown")
    assert score_lead(lead) == 0.1  # first + last name only


def test_full_lead_scores_high():
    lead = _make_lead(email="a@b.com", linkedin="https://linkedin.com/in/x", job_title="CEO")
    company = _make_company(industry="Tech", employee_count=50, summary="Does stuff")
    score = score_lead(lead, company)
    assert score == 1.0


def test_partial_lead():
    lead = _make_lead(email="a@b.com", job_title="CTO")
    assert score_lead(lead) == 0.5  # email(0.3) + name(0.1) + title(0.1)


def test_no_company():
    lead = _make_lead(email="a@b.com", linkedin="https://linkedin.com/in/x", job_title="VP")
    assert score_lead(lead) == 0.7

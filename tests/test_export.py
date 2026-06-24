import csv
import io
import uuid
from unittest.mock import MagicMock
from datetime import datetime, timezone


def test_companies_csv_format():
    from app.export import companies_to_csv

    company = MagicMock()
    company.id = uuid.uuid4()
    company.domain = "test.com"
    company.legal_name = "Test Inc"
    company.industry = "Tech"
    company.employee_count = 50
    company.estimated_tech_stack = ["Python", "React"]
    company.funding_stage = "Series A"
    company.summary = "A test company"
    company.email_patterns = ["first.last@test.com"]
    company.created_at = datetime(2024, 1, 1, tzinfo=timezone.utc)

    session = MagicMock()
    session.query.return_value.all.return_value = [company]

    result = companies_to_csv(session)
    reader = csv.reader(io.StringIO(result))
    rows = list(reader)
    assert rows[0][0] == "id"  # header
    assert rows[1][1] == "test.com"
    assert "Python;React" in rows[1][5]

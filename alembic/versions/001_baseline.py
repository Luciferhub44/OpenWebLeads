"""baseline schema

Revision ID: 001
Revises:
Create Date: 2024-01-01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSON

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "companies",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("domain", sa.String(), nullable=False, unique=True, index=True),
        sa.Column("legal_name", sa.String(), nullable=True),
        sa.Column("industry", sa.String(), nullable=True),
        sa.Column("employee_count", sa.Integer(), nullable=True),
        sa.Column("estimated_tech_stack", ARRAY(sa.Text()), server_default="{}"),
        sa.Column("funding_stage", sa.String(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("raw_html", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=True),
    )

    op.create_table(
        "leads",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("company_id", UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=False),
        sa.Column("first_name", sa.String(), nullable=False),
        sa.Column("last_name", sa.String(), nullable=False),
        sa.Column("corporate_email", sa.String(), nullable=True),
        sa.Column("job_title", sa.String(), nullable=False),
        sa.Column("linkedin_url", sa.String(), nullable=True),
        sa.Column("confidence_score", sa.Float(), server_default="0.0"),
        sa.Column("lead_metadata", JSON(), server_default="{}"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    op.create_table(
        "jobs",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("status", sa.String(), server_default="pending"),
        sa.Column("job_type", sa.String(), server_default="enrich"),
        sa.Column("target_domain", sa.String(), nullable=False),
        sa.Column("company_id", UUID(as_uuid=True), sa.ForeignKey("companies.id"), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("started_at", sa.DateTime(), nullable=True),
        sa.Column("completed_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )


def downgrade():
    op.drop_table("jobs")
    op.drop_table("leads")
    op.drop_table("companies")

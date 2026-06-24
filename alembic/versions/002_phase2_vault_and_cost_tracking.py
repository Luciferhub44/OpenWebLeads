"""phase 2: vault, cost tracking, email patterns

Revision ID: 002
Revises: 001
Create Date: 2024-01-01
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, ARRAY

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade():
    # BYOK vault table
    op.create_table(
        "api_keys",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("provider", sa.String(), nullable=False, index=True),
        sa.Column("encrypted_key", sa.LargeBinary(), nullable=False),
        sa.Column("label", sa.String(), server_default=""),
        sa.Column("model_override", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default="true"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now()),
    )

    # Cost tracking on jobs
    op.add_column("jobs", sa.Column("llm_provider", sa.String(), nullable=True))
    op.add_column("jobs", sa.Column("tokens_in", sa.Integer(), server_default="0"))
    op.add_column("jobs", sa.Column("tokens_out", sa.Integer(), server_default="0"))

    # Email patterns on companies
    op.add_column("companies", sa.Column("email_patterns", ARRAY(sa.Text()), server_default="{}"))


def downgrade():
    op.drop_column("companies", "email_patterns")
    op.drop_column("jobs", "tokens_out")
    op.drop_column("jobs", "tokens_in")
    op.drop_column("jobs", "llm_provider")
    op.drop_table("api_keys")

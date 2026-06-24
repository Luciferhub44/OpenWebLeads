"""pgvector embedding column for dedup

Revision ID: 003
Revises: 002
Create Date: 2024-01-01
"""
from alembic import op

revision = "003"
down_revision = "002"
branch_labels = None
depends_on = None


def upgrade():
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.execute("ALTER TABLE companies ADD COLUMN IF NOT EXISTS embedding vector(1536)")
    op.execute("CREATE INDEX IF NOT EXISTS ix_companies_embedding ON companies USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)")


def downgrade():
    op.execute("DROP INDEX IF EXISTS ix_companies_embedding")
    op.execute("ALTER TABLE companies DROP COLUMN IF EXISTS embedding")

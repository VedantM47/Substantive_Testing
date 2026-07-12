"""create extracted pages table

Revision ID: 202607130001
Revises: 202607120001
Create Date: 2026-07-13 00:01:00
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "202607130001"
down_revision: str | None = "202607120001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "extracted_pages",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("document_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("page_number", sa.Integer(), nullable=False),
        sa.Column("text", sa.Text(), nullable=False),
        sa.Column("extraction_method", sa.String(length=20), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["document_id"], ["documents.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("document_id", "page_number"),
    )
    op.create_index("ix_extracted_pages_document_id", "extracted_pages", ["document_id"])


def downgrade() -> None:
    op.drop_index("ix_extracted_pages_document_id", table_name="extracted_pages")
    op.drop_table("extracted_pages")

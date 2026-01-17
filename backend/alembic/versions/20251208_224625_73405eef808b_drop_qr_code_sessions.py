"""drop_qr_code_sessions

Revision ID: 73405eef808b
Revises: 006
Create Date: 2025-12-08 22:46:25.311061

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '73405eef808b'
down_revision: Union[str, None] = '006'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_index(
        op.f("ix_qr_code_sessions_session_token"), table_name="qr_code_sessions"
    )
    op.drop_table("qr_code_sessions")


def downgrade() -> None:
    # Recreate qr_code_sessions table (for rollback purposes)
    op.create_table(
        "qr_code_sessions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("session_token", sa.String(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("scanned", sa.Boolean(), nullable=True),
        sa.Column("scanned_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("session_token"),
    )
    op.create_index(
        op.f("ix_qr_code_sessions_session_token"),
        "qr_code_sessions",
        ["session_token"],
        unique=True,
    )


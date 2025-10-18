"""Enable ltree extension

Revision ID: 001
Revises:
Create Date: 2025-01-14 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Enable ltree extension for hierarchical data
    op.execute('CREATE EXTENSION IF NOT EXISTS ltree')

    # Future extensions we might need:
    # - pg_trgm for fuzzy text search
    # - pgvector for semantic search with embeddings
    op.execute('CREATE EXTENSION IF NOT EXISTS pg_trgm')


def downgrade() -> None:
    op.execute('DROP EXTENSION IF EXISTS pg_trgm')
    op.execute('DROP EXTENSION IF EXISTS ltree')

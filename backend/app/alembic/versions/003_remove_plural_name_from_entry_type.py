"""remove plural_name from entry_type

Revision ID: 003_remove_plural_name
Revises: 002_add_parent_id
Create Date: 2025-01-17 14:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = '003_remove_plural_name'
down_revision = '002_add_parent_id'
branch_labels = None
depends_on = None


def upgrade():
    # Drop the plural_name column
    op.drop_column('entry_type', 'plural_name')


def downgrade():
    # Add the plural_name column back
    op.add_column('entry_type', sa.Column('plural_name', sa.String(), nullable=False, server_default=''))

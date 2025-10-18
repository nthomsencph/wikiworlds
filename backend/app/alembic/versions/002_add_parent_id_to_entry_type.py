"""add parent_id to entry_type

Revision ID: 002_add_parent_id
Revises: b8add4679f9f
Create Date: 2025-01-17 12:00:00.000000

"""
import sqlalchemy as sa
from alembic import op

# revision identifiers, used by Alembic.
revision = '002_add_parent_id'
down_revision = 'b8add4679f9f'
branch_labels = None
depends_on = None


def upgrade():
    # Add parent_id column to entry_type table
    op.add_column('entry_type', sa.Column('parent_id', sa.Uuid(), nullable=True))

    # Add foreign key constraint
    op.create_foreign_key(
        'fk_entry_type_parent_id',
        'entry_type',
        'entry_type',
        ['parent_id'],
        ['id'],
        ondelete='SET NULL'
    )

    # Add index for parent_id
    op.create_index('idx_entry_type_parent', 'entry_type', ['parent_id'], unique=False)


def downgrade():
    # Drop index
    op.drop_index('idx_entry_type_parent', table_name='entry_type')

    # Drop foreign key constraint
    op.drop_constraint('fk_entry_type_parent_id', 'entry_type', type_='foreignkey')

    # Drop column
    op.drop_column('entry_type', 'parent_id')

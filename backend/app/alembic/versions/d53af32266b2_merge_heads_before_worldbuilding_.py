"""Merge heads before worldbuilding migration

Revision ID: d53af32266b2
Revises: 001, 1a31ce608336
Create Date: 2025-10-14 21:22:58.763832

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = 'd53af32266b2'
down_revision = ('001', '1a31ce608336')
branch_labels = None
depends_on = None


def upgrade():
    pass


def downgrade():
    pass

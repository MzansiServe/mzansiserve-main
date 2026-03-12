"""Add Aura fields to users table

Revision ID: add_aura_fields_001
Revises: add_marketplace_001
Create Date: 2026-03-12 04:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_aura_fields_001'
down_revision = 'add_marketplace_001'
branch_labels = None
depends_on = None


def upgrade():
    # Add aura_id and aura_status to users table
    op.add_column('users', sa.Column('aura_id', sa.Text(), nullable=True))
    op.add_column('users', sa.Column('aura_status', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('users', 'aura_status')
    op.drop_column('users', 'aura_id')

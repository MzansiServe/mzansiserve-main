"""add marketplace tables

Revision ID: add_marketplace_001
Revises: 68eb0932a016
Create Date: 2026-03-07

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_marketplace_001'
down_revision = '68eb0932a016'
branch_labels = None
depends_on = None


def upgrade():
    # Create marketplace_categories table
    op.create_table('marketplace_categories',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False, unique=True),
        sa.Column('slug', sa.String(100), nullable=False, unique=True),
        sa.Column('icon', sa.String(50), nullable=True),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=True),
    )

    # Create marketplace_ads table
    op.create_table('marketplace_ads',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('category_id', sa.String(36), sa.ForeignKey('marketplace_categories.id'), nullable=False),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('price', sa.Numeric(12, 2), nullable=True),
        sa.Column('city', sa.String(100), nullable=False),
        sa.Column('province', sa.String(100), nullable=False),
        sa.Column('status', sa.String(20), nullable=True),
        sa.Column('condition', sa.String(50), nullable=True),
        sa.Column('images', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('contact_name', sa.String(100), nullable=True),
        sa.Column('contact_phone', sa.String(20), nullable=True),
        sa.Column('contact_email', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime, nullable=True),
        sa.Column('updated_at', sa.DateTime, nullable=True),
    )


def downgrade():
    op.drop_table('marketplace_ads')
    op.drop_table('marketplace_categories')

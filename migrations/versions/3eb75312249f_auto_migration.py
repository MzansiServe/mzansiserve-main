"""
Add landing page fields: carousel_items new columns, testimonials and landing_features tables.
"""
from datetime import datetime
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from alembic import op

revision = '3eb75312249f'
down_revision = 'e662e1550dad'
branch_labels = None
depends_on = None


def upgrade():
    # Add new columns to carousel_items
    op.add_column('carousel_items', sa.Column('title', sa.String(255), nullable=True))
    op.add_column('carousel_items', sa.Column('subtitle', sa.Text, nullable=True))
    op.add_column('carousel_items', sa.Column('badge', sa.String(50), nullable=True))
    op.add_column('carousel_items', sa.Column('cta_color', sa.String(100), nullable=True))

    # Create testimonials table
    op.create_table(
        'testimonials',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(120), nullable=False),
        sa.Column('role', sa.String(120), nullable=True),
        sa.Column('avatar_url', sa.Text, nullable=True),
        sa.Column('rating', sa.Integer, nullable=True, server_default='5'),
        sa.Column('text', sa.Text, nullable=False),
        sa.Column('order', sa.Integer, nullable=True, server_default='0'),
        sa.Column('is_active', sa.Boolean, nullable=True, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
    )

    # Create landing_features table
    op.create_table(
        'landing_features',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('icon', sa.String(60), nullable=True),
        sa.Column('title', sa.String(120), nullable=False),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('order', sa.Integer, nullable=True, server_default='0'),
        sa.Column('is_active', sa.Boolean, nullable=True, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True, server_default=sa.text('now()')),
    )


def downgrade():
    op.drop_table('testimonials')
    op.drop_table('landing_features')
    op.drop_column('carousel_items', 'cta_color')
    op.drop_column('carousel_items', 'badge')
    op.drop_column('carousel_items', 'subtitle')
    op.drop_column('carousel_items', 'title')

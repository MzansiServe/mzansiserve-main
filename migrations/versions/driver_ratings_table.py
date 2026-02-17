"""Driver ratings table

Revision ID: driver_ratings_001
Revises: c0ffee_carousel_footer
Create Date: 2026-01-25

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'driver_ratings_001'
down_revision = 'c0ffee_carousel_footer'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'driver_ratings',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('service_request_id', sa.Text(), nullable=False),
        sa.Column('driver_id', UUID(as_uuid=True), nullable=False),
        sa.Column('requester_id', UUID(as_uuid=True), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('review_text', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['service_request_id'], ['service_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['driver_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['requester_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('rating >= 1 AND rating <= 5', name='check_rating_range')
    )


def downgrade():
    op.drop_table('driver_ratings')

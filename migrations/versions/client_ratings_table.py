"""Client ratings table

Revision ID: client_ratings_001
Revises: driver_ratings_001
Create Date: 2026-01-25

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'client_ratings_001'
down_revision = 'driver_ratings_001'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'client_ratings',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('service_request_id', sa.Text(), nullable=False),
        sa.Column('client_id', UUID(as_uuid=True), nullable=False),
        sa.Column('rater_id', UUID(as_uuid=True), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('review_text', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['service_request_id'], ['service_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['client_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['rater_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('rating >= 1 AND rating <= 5', name='client_rating_check_range')
    )


def downgrade():
    op.drop_table('client_ratings')

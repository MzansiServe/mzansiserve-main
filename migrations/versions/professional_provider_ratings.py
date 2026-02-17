"""Professional and provider ratings tables

Revision ID: prof_prov_ratings_001
Revises: user_profile_img
Create Date: 2026-01-25

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'prof_prov_ratings_001'
down_revision = '2a538c2607d9'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'professional_ratings',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('service_request_id', sa.Text(), nullable=False),
        sa.Column('professional_id', UUID(as_uuid=True), nullable=False),
        sa.Column('requester_id', UUID(as_uuid=True), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('review_text', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['service_request_id'], ['service_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['professional_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['requester_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('rating >= 1 AND rating <= 5', name='professional_rating_check_range')
    )
    op.create_table(
        'provider_ratings',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('service_request_id', sa.Text(), nullable=False),
        sa.Column('provider_id', UUID(as_uuid=True), nullable=False),
        sa.Column('requester_id', UUID(as_uuid=True), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('review_text', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['service_request_id'], ['service_requests.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['provider_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['requester_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint('rating >= 1 AND rating <= 5', name='provider_rating_check_range')
    )


def downgrade():
    op.drop_table('provider_ratings')
    op.drop_table('professional_ratings')

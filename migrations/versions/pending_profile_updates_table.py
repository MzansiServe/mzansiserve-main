"""Pending profile updates table (shadow model for post-approval changes)

Revision ID: pending_profile_001
Revises: vehicle_images_001
Create Date: 2026-01-31

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = 'pending_profile_001'
down_revision = 'vehicle_images_001'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'pending_profile_updates',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('payload', JSONB(), nullable=False),
        sa.Column('status', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reviewed_by_id', UUID(as_uuid=True), nullable=True),
        sa.Column('rejection_reason', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewed_by_id'], ['users.id'], ondelete='SET NULL'),
    )
    op.create_index('ix_pending_profile_updates_user_id', 'pending_profile_updates', ['user_id'], unique=False)
    op.create_index('ix_pending_profile_updates_status', 'pending_profile_updates', ['status'], unique=False)


def downgrade():
    op.drop_index('ix_pending_profile_updates_status', table_name='pending_profile_updates')
    op.drop_index('ix_pending_profile_updates_user_id', table_name='pending_profile_updates')
    op.drop_table('pending_profile_updates')

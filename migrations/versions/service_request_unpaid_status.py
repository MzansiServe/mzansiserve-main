"""Add 'unpaid' status to service_requests

Revision ID: service_req_unpaid
Revises: prof_prov_ratings_001
Create Date: 2026-01-25

"""
from alembic import op

revision = 'service_req_unpaid'
down_revision = 'prof_prov_ratings_001'
branch_labels = None
depends_on = None


def upgrade():
    # Drop existing check_status and add new one including 'unpaid'
    op.execute('ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS check_status')
    op.execute(
        "ALTER TABLE service_requests ADD CONSTRAINT check_status "
        "CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled', 'unpaid'))"
    )


def downgrade():
    # Revert: first update any 'unpaid' rows to 'pending', then restore original constraint
    op.execute(
        "UPDATE service_requests SET status = 'pending' WHERE status = 'unpaid'"
    )
    op.execute('ALTER TABLE service_requests DROP CONSTRAINT IF EXISTS check_status')
    op.execute(
        "ALTER TABLE service_requests ADD CONSTRAINT check_status "
        "CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled'))"
    )

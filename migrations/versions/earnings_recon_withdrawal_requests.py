"""Earnings recon table, withdrawal_requests table, wallet_transactions new types

Revision ID: earnings_recon_wr
Revises: service_req_unpaid
Create Date: 2026-01-25

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

revision = 'earnings_recon_wr'
down_revision = 'service_req_unpaid'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'earnings_recon',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('period_month', sa.Text(), nullable=False),
        sa.Column('role', sa.Text(), nullable=False),
        sa.Column('earnings_amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('transferred_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'period_month', name='uq_earnings_recon_user_period'),
        sa.CheckConstraint("role IN ('driver', 'professional', 'service-provider')", name='check_recon_role'),
    )
    op.create_table(
        'withdrawal_requests',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('amount', sa.Numeric(10, 2), nullable=False),
        sa.Column('status', sa.Text(), nullable=False, server_default='pending'),
        sa.Column('requested_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('processed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.CheckConstraint("status IN ('pending', 'paid', 'reversed')", name='check_withdrawal_status'),
    )
    op.execute('ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS check_transaction_type')
    op.execute(
        "ALTER TABLE wallet_transactions ADD CONSTRAINT check_transaction_type "
        "CHECK (transaction_type IN ('top-up', 'payment', 'refund', 'cancellation_refund', 'withdrawal', 'earnings_transfer', 'withdrawal_reversal'))"
    )


def downgrade():
    op.execute('ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS check_transaction_type')
    op.execute(
        "ALTER TABLE wallet_transactions ADD CONSTRAINT check_transaction_type "
        "CHECK (transaction_type IN ('top-up', 'payment', 'refund', 'cancellation_refund', 'withdrawal'))"
    )
    op.drop_table('withdrawal_requests')
    op.drop_table('earnings_recon')

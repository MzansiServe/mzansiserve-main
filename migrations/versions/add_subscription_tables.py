"""Add subscription tables

Revision ID: add_subscriptions_001
Revises: add_aura_fields_001
Create Date: 2026-03-12 04:15:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_subscriptions_001'
down_revision = 'add_aura_fields_001'
branch_labels = None
depends_on = None


def upgrade():
    # Create subscription_plans table
    op.create_table(
        'subscription_plans',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('price', sa.Numeric(10, 2), nullable=False),
        sa.Column('currency', sa.Text(), nullable=False),
        sa.Column('interval', sa.Text(), nullable=False),
        sa.Column('paypal_plan_id', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint('paypal_plan_id')
    )

    # Create subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('plan_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('subscription_plans.id'), nullable=False),
        sa.Column('provider', sa.Text(), nullable=False),
        sa.Column('provider_subscription_id', sa.Text(), nullable=True),
        sa.Column('status', sa.Text(), nullable=False),
        sa.Column('current_period_start', sa.DateTime(timezone=True), nullable=True),
        sa.Column('current_period_end', sa.DateTime(timezone=True), nullable=True),
        sa.Column('cancel_at_period_end', sa.Boolean(), nullable=True),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint('provider_subscription_id')
    )


def downgrade():
    op.drop_table('subscriptions')
    op.drop_table('subscription_plans')

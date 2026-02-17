"""Rename user role 'commuter' to 'client'

Revision ID: commuter_to_client
Revises: user_email_role_uq
Create Date: 2026-01-31

"""
from alembic import op

revision = 'commuter_to_client'
down_revision = 'user_email_role_uq'
branch_labels = None
depends_on = None


def upgrade():
    # Drop existing check constraint on role
    op.drop_constraint('check_role', 'users', type_='check')
    # Update existing rows
    op.execute("UPDATE users SET role = 'client' WHERE role = 'commuter'")
    # Re-create constraint with 'client' instead of 'commuter'
    op.create_check_constraint(
        'check_role', 'users',
        "role IN ('client', 'driver', 'professional', 'service-provider', 'admin')"
    )


def downgrade():
    op.drop_constraint('check_role', 'users', type_='check')
    op.execute("UPDATE users SET role = 'commuter' WHERE role = 'client'")
    op.create_check_constraint(
        'check_role', 'users',
        "role IN ('commuter', 'driver', 'professional', 'service-provider', 'admin')"
    )

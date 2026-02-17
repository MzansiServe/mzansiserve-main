"""User email+role unique constraint (allow same email for different roles)

Revision ID: user_email_role_uq
Revises: earnings_recon_wr
Create Date: 2026-01-29

"""
from alembic import op
import sqlalchemy as sa

revision = 'user_email_role_uq'
down_revision = 'earnings_recon_wr'
branch_labels = None
depends_on = None


def upgrade():
    # Drop the old unique constraint on email only.
    # PostgreSQL names it users_email_key when created via UniqueConstraint('email')
    op.drop_constraint('users_email_key', 'users', type_='unique')
    # Add new composite unique constraint on (email, role)
    op.create_unique_constraint('uq_user_email_role', 'users', ['email', 'role'])


def downgrade():
    op.drop_constraint('uq_user_email_role', 'users', type_='unique')
    op.create_unique_constraint('users_email_key', 'users', ['email'])

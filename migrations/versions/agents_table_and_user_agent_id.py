"""Agents table and user.agent_id

Revision ID: agents_user_agent
Revises: commuter_to_client
Create Date: 2026-01-31

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'agents_user_agent'
down_revision = 'commuter_to_client'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'agents',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.Text(), nullable=False),
        sa.Column('surname', sa.Text(), nullable=False),
        sa.Column('id_number', sa.Text(), nullable=True),
        sa.Column('agent_id', sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('agent_id', name='agents_agent_id_key'),
    )
    op.create_index('ix_agents_agent_id', 'agents', ['agent_id'], unique=True)
    op.add_column('users', sa.Column('agent_id', UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        'users_agent_id_fkey', 'users', 'agents',
        ['agent_id'], ['id'], ondelete='SET NULL'
    )


def downgrade():
    op.drop_constraint('users_agent_id_fkey', 'users', type_='foreignkey')
    op.drop_column('users', 'agent_id')
    op.drop_index('ix_agents_agent_id', table_name='agents')
    op.drop_table('agents')

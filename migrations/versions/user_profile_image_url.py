"""Add profile_image_url to users

Revision ID: user_profile_img
Revises: driver_ratings_001
Create Date: 2026-01-25

"""
from alembic import op
import sqlalchemy as sa

revision = 'user_profile_img'
down_revision = 'client_ratings_001'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('profile_image_url', sa.Text(), nullable=True))


def downgrade():
    op.drop_column('users', 'profile_image_url')

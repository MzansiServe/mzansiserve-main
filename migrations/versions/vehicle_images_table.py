"""Vehicle images table (driver car photos)

Revision ID: vehicle_images_001
Revises: agents_user_agent
Create Date: 2026-01-31

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = 'vehicle_images_001'
down_revision = 'agents_user_agent'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'vehicle_images',
        sa.Column('id', UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', UUID(as_uuid=True), nullable=False),
        sa.Column('car_index', sa.Integer(), nullable=False),
        sa.Column('image_url', sa.Text(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
    )
    op.create_index('ix_vehicle_images_user_id', 'vehicle_images', ['user_id'], unique=False)


def downgrade():
    op.drop_index('ix_vehicle_images_user_id', table_name='vehicle_images')
    op.drop_table('vehicle_images')

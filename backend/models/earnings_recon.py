"""Earnings reconciliation: track month-end earnings transferred to wallet."""
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from backend.extensions import db


class EarningsRecon(db.Model):
    """Tracks that earnings for a given user/month/role have been transferred to wallet."""
    __tablename__ = 'earnings_recon'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    period_month = db.Column(db.Text, nullable=False)  # 'YYYY-MM'
    role = db.Column(db.Text, nullable=False)  # 'driver' | 'professional' | 'service-provider'
    earnings_amount = db.Column(db.Numeric(10, 2), nullable=False)
    transferred_at = db.Column(db.DateTime(timezone=True), nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

    user = db.relationship('User', backref='earnings_recons')

    __table_args__ = (
        db.UniqueConstraint('user_id', 'period_month', name='uq_earnings_recon_user_period'),
        db.CheckConstraint("role IN ('driver', 'professional', 'service-provider')", name='check_recon_role'),
    )

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'period_month': self.period_month,
            'role': self.role,
            'earnings_amount': float(self.earnings_amount) if self.earnings_amount else 0.0,
            'transferred_at': self.transferred_at.isoformat() if self.transferred_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

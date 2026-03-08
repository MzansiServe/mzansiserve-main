"""
Agent Commission Model
"""
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from backend.extensions import db

class AgentCommission(db.Model):
    """Tracks commissions earned by agents for bringing in new paying users"""
    __tablename__ = 'agent_commissions'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    recruited_user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.Text, default='ZAR')
    status = db.Column(db.Text, default='earned')  # earned, paid_out
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    paid_at = db.Column(db.DateTime(timezone=True))
    
    # Relationships
    agent = db.relationship('User', foreign_keys=[agent_id], backref='commissions_earned')
    recruited_user = db.relationship('User', foreign_keys=[recruited_user_id], backref='agent_source')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': str(self.id),
            'agent_id': str(self.agent_id),
            'recruited_user_id': str(self.recruited_user_id),
            'recruited_user_email': self.recruited_user.email if self.recruited_user else None,
            'recruited_user_role': self.recruited_user.role if self.recruited_user else None,
            'amount': float(self.amount),
            'currency': self.currency,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'paid_at': self.paid_at.isoformat() if self.paid_at else None
        }

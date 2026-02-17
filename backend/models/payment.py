"""
Payment Models
"""
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from backend.extensions import db

class Payment(db.Model):
    """Payment transaction model"""
    __tablename__ = 'payments'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_id = db.Column(db.Text, unique=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.Text, nullable=False, default='ZAR')
    status = db.Column(db.Text, nullable=False, default='pending')
    payment_method = db.Column(db.Text)
    payment_provider_id = db.Column(db.Text)
    meta_data = db.Column('metadata', JSONB, default={})  # 'metadata' is reserved, using 'meta_data' as Python attribute
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        db.CheckConstraint("status IN ('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded')", name='check_payment_status'),
    )
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': str(self.id),
            'external_id': self.external_id,
            'amount': float(self.amount) if self.amount else 0.0,
            'currency': self.currency,
            'status': self.status,
            'payment_method': self.payment_method,
            'payment_provider_id': self.payment_provider_id,
            'metadata': self.meta_data,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<Payment {self.id}>'


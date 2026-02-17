"""
Service Request Models
"""
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from backend.extensions import db

class ServiceRequest(db.Model):
    """Service request model"""
    __tablename__ = 'service_requests'
    
    id = db.Column(db.Text, primary_key=True)
    request_type = db.Column(db.Text, nullable=False)
    status = db.Column(db.Text, nullable=False, default='pending')
    requester_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='SET NULL'))
    provider_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='SET NULL'))
    scheduled_date = db.Column(db.Text)  # 'YYYY-MM-DD'
    scheduled_time = db.Column(db.Text)  # 'HH:MM'
    location_data = db.Column(JSONB, default={})
    distance_km = db.Column(db.Numeric(10, 2))
    details = db.Column(JSONB, default={})
    payment_status = db.Column(db.Text, default='pending')
    payment_amount = db.Column(db.Numeric(10, 2))
    payment_currency = db.Column(db.Text, default='ZAR')
    bid_amount = db.Column(db.Numeric(10, 2))
    quote_amount = db.Column(db.Numeric(10, 2))
    cancellation_charge = db.Column(db.Numeric(10, 2), default=0)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    requester = db.relationship('User', foreign_keys=[requester_id], backref='service_requests_requester')
    provider = db.relationship('User', foreign_keys=[provider_id], backref='service_requests_provider')
    
    __table_args__ = (
        db.CheckConstraint("request_type IN ('cab', 'professional', 'provider')", name='check_request_type'),
        db.CheckConstraint("status IN ('pending', 'accepted', 'completed', 'cancelled', 'unpaid')", name='check_status'),
        db.CheckConstraint("payment_status IN ('pending', 'paid', 'refunded')", name='check_payment_status'),
    )
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'request_type': self.request_type,
            'status': self.status,
            'requester_id': str(self.requester_id) if self.requester_id else None,
            'provider_id': str(self.provider_id) if self.provider_id else None,
            'scheduled_date': self.scheduled_date,
            'scheduled_time': self.scheduled_time,
            'location_data': self.location_data,
            'distance_km': float(self.distance_km) if self.distance_km else None,
            'details': self.details,
            'payment_status': self.payment_status,
            'payment_amount': float(self.payment_amount) if self.payment_amount else None,
            'payment_currency': self.payment_currency,
            'bid_amount': float(self.bid_amount) if self.bid_amount else None,
            'quote_amount': float(self.quote_amount) if self.quote_amount else None,
            'cancellation_charge': float(self.cancellation_charge) if self.cancellation_charge else 0.0,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<ServiceRequest {self.id}>'


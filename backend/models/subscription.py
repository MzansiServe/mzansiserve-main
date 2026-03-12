"""
Subscription Models
"""
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from backend.extensions import db

class SubscriptionPlan(db.Model):
    """Model for subscription plans"""
    __tablename__ = 'subscription_plans'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    currency = db.Column(db.Text, nullable=False, default='ZAR')
    interval = db.Column(db.Text, nullable=False, default='month')  # month, year
    paypal_plan_id = db.Column(db.Text, unique=True)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'price': float(self.price),
            'currency': self.currency,
            'interval': self.interval,
            'paypal_plan_id': self.paypal_plan_id,
            'is_active': self.is_active
        }

class Subscription(db.Model):
    """Model for user subscriptions"""
    __tablename__ = 'subscriptions'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    plan_id = db.Column(UUID(as_uuid=True), db.ForeignKey('subscription_plans.id'), nullable=False)
    provider = db.Column(db.Text, nullable=False, default='paypal')
    provider_subscription_id = db.Column(db.Text, unique=True)
    status = db.Column(db.Text, nullable=False, default='pending')  # pending, active, cancelled, expired, suspended
    current_period_start = db.Column(db.DateTime(timezone=True))
    current_period_end = db.Column(db.DateTime(timezone=True))
    cancel_at_period_end = db.Column(db.Boolean, default=False)
    meta_data = db.Column('metadata', JSONB, default={})
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    user = db.relationship('User', backref=db.backref('subscriptions', lazy=True))
    plan = db.relationship('SubscriptionPlan', backref=db.backref('subscriptions', lazy=True))

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'plan_id': str(self.plan_id),
            'provider': self.provider,
            'status': self.status,
            'current_period_end': self.current_period_end.isoformat() if self.current_period_end else None,
            'cancel_at_period_end': self.cancel_at_period_end
        }

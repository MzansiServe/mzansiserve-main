"""
Delivery Address Models
"""
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from backend.extensions import db


class DeliveryAddress(db.Model):
    """Delivery address model for users"""
    __tablename__ = 'delivery_addresses'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # Address fields
    street_address = db.Column(db.Text, nullable=False)
    city = db.Column(db.Text, nullable=False)
    province = db.Column(db.Text, nullable=False)
    postal_code = db.Column(db.Text, nullable=False)
    country = db.Column(db.Text, nullable=False, default='South Africa')
    
    # Additional fields
    unit_number = db.Column(db.Text)  # Apartment, unit, suite number (optional)
    building_name = db.Column(db.Text)  # Building name (optional)
    delivery_instructions = db.Column(db.Text)  # Delivery instructions (optional)
    
    # Default address flag
    is_default = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='delivery_addresses')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'street_address': self.street_address,
            'city': self.city,
            'province': self.province,
            'postal_code': self.postal_code,
            'country': self.country,
            'unit_number': self.unit_number,
            'building_name': self.building_name,
            'delivery_instructions': self.delivery_instructions,
            'is_default': self.is_default,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<DeliveryAddress {self.id} for user {self.user_id}>'


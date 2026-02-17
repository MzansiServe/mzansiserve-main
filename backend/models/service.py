"""
Service Type Models
"""
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from backend.extensions import db


class ServiceType(db.Model):
    """Service type model for tracking available service types"""
    __tablename__ = 'service_types'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.Text, nullable=False, unique=True)
    description = db.Column(db.Text)
    category = db.Column(db.Text)  # 'professional', 'service-provider', 'driver'
    is_active = db.Column(db.Boolean, default=True)
    order = db.Column(db.Integer, default=0)  # For ordering
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        db.CheckConstraint("category IN ('professional', 'service-provider', 'driver')", name='check_service_category'),
    )
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': str(self.id),
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'is_active': self.is_active,
            'order': self.order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<ServiceType {self.name}>'

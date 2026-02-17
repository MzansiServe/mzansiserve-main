"""
User Selected Service Models
"""
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from backend.extensions import db


class UserSelectedService(db.Model):
    """Model to track services selected by service providers at registration"""
    __tablename__ = 'user_selected_services'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    service_type_id = db.Column(UUID(as_uuid=True), db.ForeignKey('service_types.id', ondelete='CASCADE'), nullable=False)
    personalized_description = db.Column(db.Text)  # User's personalized description
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = db.relationship('User', backref='selected_services')
    service_type = db.relationship('ServiceType', backref='user_selections')
    
    __table_args__ = (
        db.UniqueConstraint('user_id', 'service_type_id', name='unique_user_service'),
    )
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'service_type_id': str(self.service_type_id),
            'personalized_description': self.personalized_description,
            'service_type': self.service_type.to_dict() if self.service_type else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<UserSelectedService {self.user_id} -> {self.service_type_id}>'

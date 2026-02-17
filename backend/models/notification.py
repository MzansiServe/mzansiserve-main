"""
Notification Models
"""
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from backend.extensions import db

class Notification(db.Model):
    """User notification model"""
    __tablename__ = 'notifications'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    type = db.Column(db.Text, nullable=False)
    title = db.Column(db.Text, nullable=False)
    body = db.Column(db.Text)
    status = db.Column(db.Text, default='unread')
    entity_type = db.Column(db.Text)
    entity_id = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    
    user = db.relationship('User', backref='notifications')
    
    __table_args__ = (
        db.CheckConstraint("status IN ('unread', 'read')", name='check_notification_status'),
    )
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'type': self.type,
            'title': self.title,
            'body': self.body,
            'status': self.status,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
    
    def __repr__(self):
        return f'<Notification {self.id}>'


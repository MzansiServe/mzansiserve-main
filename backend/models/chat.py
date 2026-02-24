"""
Chat Message Model
"""
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from backend.extensions import db

class ChatMessage(db.Model):
    """Chat message model for communication between users"""
    __tablename__ = 'chat_messages'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = db.Column(db.Text, db.ForeignKey('service_requests.id', ondelete='CASCADE'), nullable=False)
    sender_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    recipient_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    
    # Relationships
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_messages')
    recipient = db.relationship('User', foreign_keys=[recipient_id], backref='received_messages')
    service_request = db.relationship('ServiceRequest', backref='chat_messages')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': str(self.id),
            'request_id': self.request_id,
            'sender_id': str(self.sender_id),
            'recipient_id': str(self.recipient_id),
            'message': self.message,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'sender_name': self.sender.data.get('full_name', 'User') if self.sender.data else 'User'
        }

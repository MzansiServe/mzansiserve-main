"""
Email Queue Models
"""
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from backend.extensions import db

class EmailQueue(db.Model):
    """Email queue model for async processing"""
    __tablename__ = 'emails'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipient = db.Column(db.Text, nullable=False)
    subject = db.Column(db.Text, nullable=False)
    body = db.Column(db.Text, nullable=False)
    body_html = db.Column(db.Text)
    status = db.Column(db.Text, default='pending')
    sent_at = db.Column(db.DateTime(timezone=True))
    error_message = db.Column(db.Text)
    meta_data = db.Column('metadata', JSONB, default={})  # 'metadata' is reserved, using 'meta_data' as Python attribute
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    __table_args__ = (
        db.CheckConstraint("status IN ('pending', 'sent', 'failed')", name='check_email_status'),
    )
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': str(self.id),
            'recipient': self.recipient,
            'subject': self.subject,
            'body': self.body,
            'body_html': self.body_html,
            'status': self.status,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None,
            'error_message': self.error_message,
            'metadata': self.meta_data,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<EmailQueue {self.id}>'


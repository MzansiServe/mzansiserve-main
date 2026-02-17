"""
FAQ Models
"""
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from backend.extensions import db


class FAQ(db.Model):
    """FAQ model for storing frequently asked questions and answers"""
    __tablename__ = 'faqs'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question = db.Column(db.Text, nullable=False)
    answer = db.Column(db.Text, nullable=False)
    order = db.Column(db.Integer, default=0)  # For ordering FAQs
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': str(self.id),
            'question': self.question,
            'answer': self.answer,
            'order': self.order,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<FAQ {self.id}: {self.question[:50]}...>'

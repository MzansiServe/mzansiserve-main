"""
Testimonial model for landing page customer reviews
"""
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from backend.extensions import db


class Testimonial(db.Model):
    """Customer testimonials displayed on the landing page."""
    __tablename__ = 'testimonials'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(120), nullable=True)   # e.g. "Homeowner, Cape Town"
    avatar_url = db.Column(db.Text, nullable=True)
    rating = db.Column(db.Integer, default=5)         # 1-5 stars
    text = db.Column(db.Text, nullable=False)
    order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'role': self.role,
            'avatar_url': self.avatar_url,
            'rating': self.rating,
            'text': self.text,
            'order': self.order,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

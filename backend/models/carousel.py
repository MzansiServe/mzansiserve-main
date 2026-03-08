"""
Carousel item model for home page slider
"""
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from backend.extensions import db


class CarouselItem(db.Model):
    """Home page carousel slide: image, CTA link, order, is_active"""
    __tablename__ = 'carousel_items'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    image_url = db.Column(db.Text, nullable=True)  # Path e.g. /uploads/xxx.jpg
    cta_link = db.Column(db.Text, nullable=True)  # Call-to-action URL
    cta_text = db.Column(db.String(120), nullable=True)  # Optional button text
    title = db.Column(db.String(255), nullable=True)     # Main slide heading
    subtitle = db.Column(db.Text, nullable=True)         # Slide description text
    badge = db.Column(db.String(50), nullable=True)      # Small top badge text
    cta_color = db.Column(db.String(100), nullable=True) # CTA button color class
    order = db.Column(db.Integer, default=0)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'image_url': self.image_url,
            'cta_link': self.cta_link,
            'cta_text': self.cta_text,
            'title': self.title,
            'subtitle': self.subtitle,
            'badge': self.badge,
            'cta_color': self.cta_color,
            'order': self.order,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }

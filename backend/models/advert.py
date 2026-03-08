import datetime
import uuid
from backend.extensions import db

from sqlalchemy.dialects.postgresql import UUID

class Advert(db.Model):
    __tablename__ = 'adverts'

    id = db.Column(db.String(36), primary_key=True, default=lambda: f"AD-{uuid.uuid4().hex[:12].upper()}")
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    image_url = db.Column(db.Text, nullable=False)
    target_url = db.Column(db.Text, nullable=False)
    
    status = db.Column(db.String(20), default='pending') # pending, active, paused, ended, rejected
    placement_section = db.Column(db.String(50), nullable=False) # e.g., 'homepage_hero', 'shop_sidebar', 'marketplace_list'
    
    start_date = db.Column(db.DateTime, nullable=True)
    end_date = db.Column(db.DateTime, nullable=True)
    
    clicks = db.Column(db.Integer, default=0)
    impressions = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('adverts', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': str(self.user_id) if self.user_id else None,
            'title': self.title,
            'image_url': self.image_url,
            'target_url': self.target_url,
            'status': self.status,
            'placement_section': self.placement_section,
            'start_date': self.start_date.isoformat() if self.start_date else None,
            'end_date': self.end_date.isoformat() if self.end_date else None,
            'clicks': self.clicks,
            'impressions': self.impressions,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'user': self.user.to_dict_basic() if self.user else None
        }

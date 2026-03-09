from datetime import datetime
import uuid
from backend.extensions import db
from sqlalchemy.dialects.postgresql import UUID, JSONB

class MarketplaceCategory(db.Model):
    """ads Category (e.g., Cars, Electronics, Property)"""
    __tablename__ = 'marketplace_categories'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: f"MCAT-{uuid.uuid4().hex[:8].upper()}")
    name = db.Column(db.String(100), nullable=False, unique=True)
    slug = db.Column(db.String(100), nullable=False, unique=True)
    icon = db.Column(db.String(50), nullable=True) # Lucide icon name or emoji
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'icon': self.icon,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class MarketplaceAd(db.Model):
    """A classified ad (like Gumtree)"""
    __tablename__ = 'marketplace_ads'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: f"AD-{uuid.uuid4().hex[:12].upper()}")
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id'), nullable=False)
    category_id = db.Column(db.String(36), db.ForeignKey('marketplace_categories.id'), nullable=False)
    
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=False)
    price = db.Column(db.Numeric(12, 2), nullable=True) # Null for "Contact for price"
    
    # Location details
    city = db.Column(db.String(100), nullable=False)
    province = db.Column(db.String(100), nullable=False)
    
    # Status
    status = db.Column(db.String(20), default='active') # active, sold, expired, deleted
    
    # Metadata
    condition = db.Column(db.String(50), nullable=True) # New, Used (Good), Used (Fair), etc.
    images = db.Column(JSONB, default=[]) # List of image URLs
    
    # contact details (can be different from user profile)
    contact_name = db.Column(db.String(100), nullable=True)
    contact_phone = db.Column(db.String(20), nullable=True)
    contact_email = db.Column(db.String(100), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = db.relationship('User', backref=db.backref('marketplace_ads', lazy=True))
    category = db.relationship('MarketplaceCategory', backref=db.backref('ads', lazy=True))

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': str(self.user_id),
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else None,
            'title': self.title,
            'description': self.description,
            'price': float(self.price) if self.price else None,
            'city': self.city,
            'province': self.province,
            'status': self.status,
            'condition': self.condition,
            'images': self.images,
            'contact_name': self.contact_name,
            'contact_phone': self.contact_phone,
            'contact_email': self.contact_email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'user': {
                'name': self.user.data.get('full_name') if self.user and self.user.data else "User",
                'email': self.user.email if self.user else None,
                'is_verified': self.user.email_verified if self.user else False
            }
        }

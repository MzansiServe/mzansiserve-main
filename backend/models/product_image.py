"""
Product Image Models
"""
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from backend.extensions import db


class ProductImage(db.Model):
    """Product image model for multiple images per product"""
    __tablename__ = 'product_images'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = db.Column(db.Text, db.ForeignKey('shop_products.id', ondelete='CASCADE'), nullable=False)
    image_url = db.Column(db.Text, nullable=False)
    is_primary = db.Column(db.Boolean, default=False)  # Primary image for the product
    order = db.Column(db.Integer, default=0)  # For ordering images
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    
    # Relationships
    product = db.relationship('ShopProduct', backref='images')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': str(self.id),
            'product_id': self.product_id,
            'image_url': self.image_url,
            'is_primary': self.is_primary,
            'order': self.order,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
    
    def __repr__(self):
        return f'<ProductImage {self.id} for product {self.product_id}>'

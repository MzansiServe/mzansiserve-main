"""
E-commerce Shop Models
"""
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from backend.extensions import db

class ShopCategory(db.Model):
    """Shop category model"""
    __tablename__ = 'shop_categories'
    
    id = db.Column(db.Text, primary_key=True)
    title = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    
    products = db.relationship('ShopProduct', backref='category', lazy='dynamic')
    subcategories = db.relationship('ShopSubcategory', backref='category', lazy='dynamic', cascade='all, delete-orphan')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
    
    def __repr__(self):
        return f'<ShopCategory {self.title}>'


class ShopSubcategory(db.Model):
    """Shop subcategory model"""
    __tablename__ = 'shop_subcategories'
    
    id = db.Column(db.Text, primary_key=True)
    category_id = db.Column(db.Text, db.ForeignKey('shop_categories.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    
    products = db.relationship('ShopProduct', backref='subcategory', lazy='dynamic')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'category_id': self.category_id,
            'title': self.title,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
    
    def __repr__(self):
        return f'<ShopSubcategory {self.title}>'


class ShopProduct(db.Model):
    """Shop product model"""
    __tablename__ = 'shop_products'
    
    id = db.Column(db.Text, primary_key=True)
    name = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    category_id = db.Column(db.Text, db.ForeignKey('shop_categories.id', ondelete='SET NULL'))
    subcategory_id = db.Column(db.Text, db.ForeignKey('shop_subcategories.id', ondelete='SET NULL'))
    in_stock = db.Column(db.Boolean, default=True)
    status = db.Column(db.Text, default='active', nullable=False)  # 'active' or 'inactive'
    image_url = db.Column(db.Text)  # Legacy field, kept for backward compatibility
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    inventory = db.relationship('Inventory', backref='product', lazy='joined', uselist=False, cascade='all, delete-orphan')
    
    __table_args__ = (
        db.CheckConstraint("status IN ('active', 'inactive')", name='check_product_status'),
    )
    
    def to_dict(self):
        """Convert to dictionary"""
        inventory_data = None
        if self.inventory:
            inventory_data = self.inventory.to_dict()
        
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': float(self.price) if self.price else 0.0,
            'category_id': self.category_id,
            'subcategory_id': self.subcategory_id,
            'in_stock': self.in_stock,
            'status': self.status,
            'image_url': self.image_url,
            'inventory': inventory_data,
            'images': [img.to_dict() for img in self.images] if hasattr(self, 'images') else [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<ShopProduct {self.name}>'


class Order(db.Model):
    """Order model"""
    __tablename__ = 'orders'
    
    id = db.Column(db.Text, primary_key=True)
    customer_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='SET NULL'))
    customer_email = db.Column(db.Text)
    status = db.Column(db.Text, nullable=False, default='pending')
    total = db.Column(db.Numeric(10, 2), nullable=False)
    items = db.Column(JSONB, nullable=False)
    shipping = db.Column(JSONB)
    payment_id = db.Column(db.Text)
    placed_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    customer = db.relationship('User', backref='orders')
    
    __table_args__ = (
        db.CheckConstraint("status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')", name='check_order_status'),
    )
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'customer_id': str(self.customer_id) if self.customer_id else None,
            'customer_email': self.customer_email,
            'status': self.status,
            'total': float(self.total) if self.total else 0.0,
            'items': self.items,
            'shipping': self.shipping,
            'payment_id': self.payment_id,
            'placed_at': self.placed_at.isoformat() if self.placed_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<Order {self.id}>'


class Inventory(db.Model):
    """Product inventory model"""
    __tablename__ = 'inventory'
    
    id = db.Column(db.Text, primary_key=True)
    product_id = db.Column(db.Text, db.ForeignKey('shop_products.id', ondelete='CASCADE'), unique=True, nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=0)
    reserved_quantity = db.Column(db.Integer, nullable=False, default=0)  # Quantity reserved for pending orders
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @property
    def available_quantity(self):
        """Calculate available quantity (total - reserved)"""
        return max(0, self.quantity - self.reserved_quantity)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': self.id,
            'product_id': self.product_id,
            'quantity': self.quantity,
            'reserved_quantity': self.reserved_quantity,
            'available_quantity': self.available_quantity,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
    
    def __repr__(self):
        return f'<Inventory {self.product_id}: {self.quantity}>'


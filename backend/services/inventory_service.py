"""
Inventory Service
"""
from flask import current_app
from backend.models.shop import ShopProduct, Inventory
from backend.extensions import db
import uuid


def update_inventory_on_order_payment(order):
    """
    Update inventory quantities when an order is paid.
    Decreases inventory quantity for each product in the order.
    
    Args:
        order: Order object with status='paid' and items (JSONB)
    
    Returns:
        tuple: (success: bool, message: str)
    """
    try:
        if not order or not order.items:
            return False, "Order or items not found"
        
        items = order.items if isinstance(order.items, list) else []
        
        for item in items:
            product_id = item.get('product_id') or item.get('id')
            quantity = item.get('quantity', 0)
            
            if not product_id or quantity <= 0:
                current_app.logger.warning(f"Invalid item in order {order.id}: {item}")
                continue
            
            # Get product
            product = ShopProduct.query.get(product_id)
            if not product:
                current_app.logger.warning(f"Product {product_id} not found for order {order.id}")
                continue
            
            # Get or create inventory
            inventory = Inventory.query.filter_by(product_id=product_id).first()
            if not inventory:
                # Create inventory if it doesn't exist
                inventory_id = f"INV-{uuid.uuid4().hex[:12].upper()}"
                inventory = Inventory(
                    id=inventory_id,
                    product_id=product_id,
                    quantity=0,
                    reserved_quantity=0
                )
                db.session.add(inventory)
                current_app.logger.info(f"Created inventory for product {product_id}")
            
            # Check if enough inventory available
            if inventory.quantity < quantity:
                current_app.logger.warning(
                    f"Insufficient inventory for product {product_id}: "
                    f"requested {quantity}, available {inventory.quantity}"
                )
                # Still decrease what's available, but log warning
                quantity_to_deduct = inventory.quantity
            else:
                quantity_to_deduct = quantity
            
            # Decrease inventory quantity
            inventory.quantity = max(0, inventory.quantity - quantity_to_deduct)
            
            # Update product in_stock status
            if inventory.quantity <= 0:
                product.in_stock = False
                current_app.logger.info(f"Product {product_id} is now out of stock")
            else:
                product.in_stock = True
            
            current_app.logger.info(
                f"Inventory updated for product {product_id}: "
                f"decreased by {quantity_to_deduct}, new quantity: {inventory.quantity}"
            )
        
        db.session.commit()
        return True, "Inventory updated successfully"
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error updating inventory for order {order.id}: {str(e)}")
        return False, f"Error updating inventory: {str(e)}"


def sync_product_stock_status(product_id=None):
    """
    Sync product in_stock status with inventory quantity.
    If inventory is zero or less, mark product as out of stock.
    
    Args:
        product_id: Optional product ID. If None, syncs all products.
    
    Returns:
        int: Number of products updated
    """
    try:
        if product_id:
            products = [ShopProduct.query.get(product_id)] if ShopProduct.query.get(product_id) else []
        else:
            products = ShopProduct.query.filter_by(status='active').all()
        
        updated_count = 0
        for product in products:
            if not product:
                continue
            
            inventory = Inventory.query.filter_by(product_id=product.id).first()
            if inventory:
                # Update in_stock based on available inventory
                if inventory.available_quantity <= 0:
                    if product.in_stock:
                        product.in_stock = False
                        updated_count += 1
                else:
                    if not product.in_stock:
                        product.in_stock = True
                        updated_count += 1
            elif product.in_stock:
                # No inventory record but product is marked as in stock
                # This could be a legacy product, keep it as is or mark as out of stock
                # For now, we'll leave it as is to avoid breaking existing products
                pass
        
        if updated_count > 0:
            db.session.commit()
        
        return updated_count
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Error syncing product stock status: {str(e)}")
        return 0


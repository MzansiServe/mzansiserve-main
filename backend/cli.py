"""
CLI Commands for User Management and Shop Management
"""
import click
from flask.cli import with_appcontext
from backend.models import User, ShopCategory, ShopSubcategory, ShopProduct, Order, Country, ServiceType, Agent
from backend.extensions import db
from backend.services.wallet_service import WalletService
from backend.utils.auth import generate_tracking_number
import secrets
import json

@click.group()
def cli():
    """User management CLI commands"""
    pass

@cli.command('create-admin')
@click.option('--email', prompt=True, help='Admin email address')
@click.option('--password', prompt=True, hide_input=True, confirmation_prompt=True, help='Admin password')
@click.option('--full-name', prompt=True, help='Admin full name')
@with_appcontext
def create_admin(email, password, full_name):
    """Create an admin user"""
    # Check if user already exists
    if User.query.filter_by(email=email).first():
        click.echo(f'Error: User with email {email} already exists')
        return
    
    # Create admin user
    admin = User(
        email=email,
        role='admin',
        is_admin=True,
        is_paid=True,
        is_approved=True,
        is_active=True,
        email_verified=True,
        tracking_number=generate_tracking_number(),
        data={'full_name': full_name}
    )
    admin.set_password(password)
    
    db.session.add(admin)
    db.session.commit()
    
    # Create wallet
    WalletService.get_or_create_wallet(admin.id)
    
    click.echo(f'Admin user created successfully: {email}')

@cli.command('add-user')
@click.option('--email', prompt=True, help='User email address')
@click.option('--password', prompt=True, hide_input=True, confirmation_prompt=True, help='User password')
@click.option('--role', type=click.Choice(['client', 'driver', 'professional', 'service-provider', 'admin']), 
              prompt=True, help='User role')
@click.option('--full-name', prompt=True, help='User full name')
@click.option('--is-paid', is_flag=True, default=False, help='Mark user as paid')
@click.option('--is-approved', is_flag=True, default=False, help='Mark user as approved')
@click.option('--is-active', is_flag=True, default=True, help='Mark user as active')
@with_appcontext
def add_user(email, password, role, full_name, is_paid, is_approved, is_active):
    """Add a single user"""
    # Check if user already exists
    if User.query.filter_by(email=email).first():
        click.echo(f'Error: User with email {email} already exists')
        return
    
    # Create user
    user = User(
        email=email,
        role=role,
        is_admin=(role == 'admin'),
        is_paid=is_paid,
        is_approved=is_approved,
        is_active=is_active,
        email_verified=False,
        tracking_number=generate_tracking_number(),
        data={'full_name': full_name}
    )
    user.set_password(password)
    
    db.session.add(user)
    db.session.commit()
    
    # Create wallet
    WalletService.get_or_create_wallet(user.id)
    
    click.echo(f'User created successfully: {email} ({role})')

@cli.command('delete-user')
@click.option('--email', help='User email address')
@click.option('--id', help='User ID (UUID)')
@click.option('--force', is_flag=True, help='Force delete without confirmation')
@with_appcontext
def delete_user(email, id, force):
    """Delete a user"""
    if not email and not id:
        click.echo('Error: Either --email or --id must be provided')
        return
    
    # Find user
    if email:
        user = User.query.filter_by(email=email).first()
    else:
        user = User.query.get(id)
    
    if not user:
        click.echo(f'Error: User not found')
        return
    
    # Confirm deletion
    if not force:
        click.confirm(f'Are you sure you want to delete user {user.email} ({user.role})?', abort=True)
    
    # Delete user (wallet will be cascade deleted)
    db.session.delete(user)
    db.session.commit()
    
    click.echo(f'User {user.email} deleted successfully')


@cli.command('change-password')
@click.option('--email', help='User email address')
@click.option('--role', type=click.Choice(['client', 'driver', 'professional', 'service-provider', 'admin']),
              help='User role (required if multiple accounts exist for email)')
@click.option('--id', 'user_id', help='User ID (UUID)')
@click.option('--password', prompt=True, hide_input=True, confirmation_prompt=True, help='New password')
@with_appcontext
def change_password(email, role, user_id, password):
    """Change a user's password"""
    if not email and not user_id:
        click.echo('Error: Either --email (and optionally --role) or --id must be provided')
        return

    # Find user
    if user_id:
        user = User.query.get(user_id)
    elif email:
        if role:
            user = User.query.filter_by(email=email, role=role).first()
        else:
            users = User.query.filter_by(email=email).all()
            if len(users) > 1:
                click.echo(f'Error: Multiple accounts found for {email}. Specify --role to identify the user.')
                return
            user = users[0] if users else None
    else:
        user = None

    if not user:
        click.echo('Error: User not found')
        return

    user.set_password(password)
    db.session.commit()
    role_info = f' ({user.role})' if User.query.filter_by(email=user.email).count() > 1 else ''
    click.echo(f'Password changed successfully for {user.email}{role_info}')

@cli.command('create-users')
@click.option('--role', type=click.Choice(['client', 'driver', 'professional', 'service-provider']), 
              prompt=True, help='User role')
@click.option('--count', default=1, prompt=True, help='Number of users to create')
@click.option('--email-prefix', default='user', help='Email prefix (will be user1@example.com, user2@example.com, etc.)')
@click.option('--domain', default='example.com', help='Email domain')
@click.option('--password', default='password123', help='Default password for all users')
@with_appcontext
def create_users(role, count, email_prefix, domain, password):
    """Create multiple users of a specific role"""
    created = 0
    skipped = 0
    
    for i in range(1, count + 1):
        email = f'{email_prefix}{i}@{domain}'
        
        # Check if user already exists
        if User.query.filter_by(email=email).first():
            click.echo(f'Skipped: User {email} already exists')
            skipped += 1
            continue
        
        # Create user
        user = User(
            email=email,
            role=role,
            is_admin=False,
            is_paid=False,
            is_approved=False,
            is_active=True,
            email_verified=False,
            tracking_number=generate_tracking_number(),
            data={'full_name': f'{role.capitalize()} User {i}'}
        )
        user.set_password(password)
        
        db.session.add(user)
        
        # Create wallet
        WalletService.get_or_create_wallet(user.id)
        
        created += 1
        click.echo(f'Created user {i}/{count}: {email} ({role})')
    
    db.session.commit()
    click.echo(f'\nSummary: Created {created} users, skipped {skipped} existing users')

@cli.command('seed-users')
@click.option('--count', default=5, help='Number of users to create per role (default: 5)')
@click.option('--email-prefix', default='user', help='Email prefix (will be {prefix}{role}{number}@example.com)')
@click.option('--domain', default='example.com', help='Email domain')
@click.option('--password', default='password123', help='Default password for all users')
@click.option('--paid', is_flag=True, default=False, help='Mark users as paid (registration fee paid)')
@click.option('--approved', is_flag=True, default=False, help='Mark users as approved')
@with_appcontext
def seed_users(count, email_prefix, domain, password, paid, approved):
    """Seed users of all roles (client, driver, professional, service-provider)"""
    roles = ['client', 'driver', 'professional', 'service-provider']
    total_created = 0
    total_skipped = 0
    
    click.echo(f'Seeding {count} users per role ({len(roles)} roles = {count * len(roles)} total users)...')
    
    for role in roles:
        click.echo(f'\nCreating {count} {role} users...')
        role_created = 0
        role_skipped = 0
        
        for i in range(1, count + 1):
            email = f'{email_prefix}{role}{i}@{domain}'
            
            # Check if user already exists
            if User.query.filter_by(email=email).first():
                click.echo(f'  Skipped: {email} already exists')
                role_skipped += 1
                total_skipped += 1
                continue
            
            # Create user
            user = User(
                email=email,
                role=role,
                is_admin=False,
                is_paid=paid,
                is_approved=approved,
                is_active=True,
                email_verified=False,
                tracking_number=generate_tracking_number(),
                data={'full_name': f'{role.capitalize()} User {i}'}
            )
            user.set_password(password)
            
            # Add user to session and flush so the UUID primary key is generated
            db.session.add(user)
            db.session.flush()  # ensure user.id is not None before creating wallet
            
            # Create wallet for this user
            WalletService.get_or_create_wallet(user.id)
            
            role_created += 1
            total_created += 1
            click.echo(f'  Created: {email} ({role})')
        
        db.session.commit()
        click.echo(f'  {role}: Created {role_created}, Skipped {role_skipped}')
    
    click.echo(f'\n{"="*60}')
    click.echo(f'Summary:')
    click.echo(f'  Total Created: {total_created}')
    click.echo(f'  Total Skipped: {total_skipped}')
    click.echo(f'  Password for all users: {password}')
    click.echo(f'  Registration Fee Paid: {"Yes" if paid else "No"}')
    click.echo(f'  Approved: {"Yes" if approved else "No"}')

@cli.command('add-category')
@click.option('--id', help='Category ID (auto-generated if not provided)')
@click.option('--title', prompt=True, help='Category title')
@with_appcontext
def add_category(id, title):
    """Add a shop category"""
    # Generate ID if not provided
    if not id:
        # Create a slug-like ID from title
        id = title.lower().replace(' ', '-').replace('_', '-')
        # Remove special characters
        id = ''.join(c for c in id if c.isalnum() or c == '-')
        # Ensure uniqueness
        base_id = id
        counter = 1
        while ShopCategory.query.get(id):
            id = f"{base_id}-{counter}"
            counter += 1
    
    # Check if category already exists
    if ShopCategory.query.get(id):
        click.echo(f'Error: Category with ID "{id}" already exists')
        return
    
    # Create category
    category = ShopCategory(id=id, title=title)
    db.session.add(category)
    db.session.commit()
    
    click.echo(f'Category created successfully: {id} - {title}')

@cli.command('delete-category')
@click.option('--id', prompt=True, help='Category ID to delete')
@click.option('--force', is_flag=True, help='Force delete even if category has products')
@with_appcontext
def delete_category(id, force):
    """Delete a shop category"""
    category = ShopCategory.query.get(id)
    
    if not category:
        click.echo(f'Error: Category with ID "{id}" not found')
        return
    
    # Check if category has products
    product_count = category.products.count()
    if product_count > 0 and not force:
        click.echo(f'Error: Category has {product_count} product(s). Use --force to delete anyway.')
        return
    
    # Delete category (products will have category_id set to NULL due to ondelete='SET NULL')
    db.session.delete(category)
    db.session.commit()
    
    click.echo(f'Category "{id}" deleted successfully')

@cli.command('add-product')
@click.option('--id', help='Product ID (auto-generated if not provided)')
@click.option('--name', prompt=True, help='Product name')
@click.option('--description', default='', help='Product description')
@click.option('--price', prompt=True, type=float, help='Product price')
@click.option('--category-id', help='Category ID (optional)')
@click.option('--in-stock/--out-of-stock', default=True, help='Product stock status')
@click.option('--image-url', help='Product image URL')
@with_appcontext
def add_product(id, name, description, price, category_id, in_stock, image_url):
    """Add a shop product"""
    # Generate ID if not provided
    if not id:
        id = f"PROD-{secrets.token_hex(8).upper()}"
        # Ensure uniqueness
        base_id = id
        counter = 1
        while ShopProduct.query.get(id):
            id = f"PROD-{secrets.token_hex(8).upper()}"
    
    # Check if product already exists
    if ShopProduct.query.get(id):
        click.echo(f'Error: Product with ID "{id}" already exists')
        return
    
    # Validate category if provided
    if category_id:
        category = ShopCategory.query.get(category_id)
        if not category:
            click.echo(f'Warning: Category "{category_id}" not found. Product will be created without category.')
            category_id = None
    
    # Create product
    product = ShopProduct(
        id=id,
        name=name,
        description=description,
        price=price,
        category_id=category_id,
        in_stock=in_stock,
        image_url=image_url
    )
    db.session.add(product)
    db.session.commit()
    
    click.echo(f'Product created successfully: {id} - {name} (R{price:.2f})')

@cli.command('delete-product')
@click.option('--id', prompt=True, help='Product ID to delete')
@with_appcontext
def delete_product(id):
    """Delete a shop product"""
    product = ShopProduct.query.get(id)
    
    if not product:
        click.echo(f'Error: Product with ID "{id}" not found')
        return
    
    # Delete product
    db.session.delete(product)
    db.session.commit()
    
    click.echo(f'Product "{id}" deleted successfully')

@cli.command('list-categories')
@with_appcontext
def list_categories():
    """List all shop categories"""
    categories = ShopCategory.query.order_by(ShopCategory.title).all()
    
    if not categories:
        click.echo('No categories found.')
        return
    
    click.echo('\nCategories:')
    click.echo('-' * 60)
    for category in categories:
        product_count = category.products.count()
        click.echo(f'{category.id:30s} {category.title:30s} ({product_count} products)')

@cli.command('list-products')
@click.option('--category-id', help='Filter by category ID')
@with_appcontext
def list_products(category_id):
    """List all shop products"""
    query = ShopProduct.query
    
    if category_id:
        query = query.filter_by(category_id=category_id)
    
    products = query.order_by(ShopProduct.name).all()
    
    if not products:
        click.echo('No products found.')
        return
    
    click.echo('\nProducts:')
    click.echo('-' * 80)
    for product in products:
        stock_status = 'In Stock' if product.in_stock else 'Out of Stock'
        category = product.category.title if product.category else 'No Category'
        click.echo(f'{product.id:20s} {product.name:30s} R{float(product.price):8.2f} {stock_status:12s} [{category}]')

@cli.command('list-users')
@click.option('--role', type=click.Choice(['client', 'driver', 'professional', 'service-provider', 'admin']), 
              help='Filter by user role')
@click.option('--paid/--unpaid', default=None, help='Filter by payment status')
@click.option('--approved/--unapproved', default=None, help='Filter by approval status')
@click.option('--active/--inactive', default=None, help='Filter by active status')
@click.option('--verified/--unverified', default=None, help='Filter by email verification status')
@with_appcontext
def list_users(role, paid, approved, active, verified):
    """List all registered users with status fields"""
    query = User.query
    
    # Apply filters
    if role:
        query = query.filter_by(role=role)
    if paid is not None:
        query = query.filter_by(is_paid=paid)
    if approved is not None:
        query = query.filter_by(is_approved=approved)
    if active is not None:
        query = query.filter_by(is_active=active)
    if verified is not None:
        query = query.filter_by(email_verified=verified)
    
    users = query.order_by(User.created_at.desc()).all()
    
    if not users:
        click.echo('No users found.')
        return
    
    click.echo(f'\nFound {len(users)} user(s):')
    click.echo('=' * 140)
    
    for user in users:
        # Get profile data
        full_name = user.data.get('full_name', 'N/A') if user.data else 'N/A'
        phone = user.data.get('phone', 'N/A') if user.data else 'N/A'
        
        # Format status flags
        admin_status = 'Admin' if user.is_admin else ''
        paid_status = 'Paid' if user.is_paid else 'Unpaid'
        approved_status = 'Approved' if user.is_approved else 'Pending'
        active_status = 'Active' if user.is_active else 'Inactive'
        verified_status = 'Verified' if user.email_verified else 'Unverified'
        id_status = user.id_verification_status or 'pending'
        
        # Format dates
        created_date = user.created_at.strftime('%Y-%m-%d %H:%M') if user.created_at else 'N/A'
        
        click.echo(f'\nUser ID: {user.id}')
        click.echo(f'  Email: {user.email}')
        click.echo(f'  Name: {full_name}')
        click.echo(f'  Phone: {phone}')
        click.echo(f'  Role: {user.role}')
        click.echo(f'  Tracking Number: {user.tracking_number or "N/A"}')
        click.echo(f'  Status: {admin_status} | {paid_status} | {approved_status} | {active_status} | Email: {verified_status}')
        click.echo(f'  ID Verification: {id_status}')
        if user.id_rejection_reason:
            click.echo(f'  ID Rejection Reason: {user.id_rejection_reason}')
        click.echo(f'  Created: {created_date}')
        click.echo('-' * 140)
    
    click.echo('\nStatus Legend:')
    click.echo('  - Paid/Unpaid: Registration fee payment status')
    click.echo('  - Approved/Pending: User approval status')
    click.echo('  - Active/Inactive: Account active status')
    click.echo('  - Verified/Unverified: Email verification status')
    click.echo('  - ID Verification: pending/verified/rejected')

@cli.command('list-orders')
@click.option('--status', type=click.Choice(['pending', 'paid', 'shipped', 'delivered', 'cancelled']), 
              help='Filter by order status')
@click.option('--user-id', help='Filter by user ID (UUID)')
@click.option('--email', help='Filter by user email')
@click.option('--limit', default=50, type=int, help='Limit number of results')
@with_appcontext
def list_orders(status, user_id, email, limit):
    """List all orders with optional filters"""
    query = Order.query
    
    # Apply filters
    if status:
        query = query.filter_by(status=status)
    
    if user_id:
        try:
            from uuid import UUID
            user_uuid = UUID(user_id)
            query = query.filter_by(customer_id=user_uuid)
        except ValueError:
            click.echo(f'Error: Invalid user ID format: {user_id}')
            return
    
    if email:
        # Find user by email first
        user = User.query.filter_by(email=email).first()
        if user:
            query = query.filter_by(customer_id=user.id)
        else:
            click.echo(f'No user found with email: {email}')
            return
    
    orders = query.order_by(Order.placed_at.desc()).limit(limit).all()
    
    if not orders:
        click.echo('No orders found.')
        return
    
    click.echo(f'\nFound {len(orders)} order(s):')
    click.echo('=' * 160)
    
    for order in orders:
        # Get customer info
        customer = User.query.get(order.customer_id) if order.customer_id else None
        customer_name = customer.data.get('full_name', 'N/A') if customer and customer.data else 'N/A'
        customer_email = order.customer_email or (customer.email if customer else 'N/A')
        
        # Format order items
        items_count = len(order.items) if order.items else 0
        items_summary = ', '.join([
            f"{item.get('product_name', 'Unknown')} x{item.get('quantity', 0)}"
            for item in (order.items[:3] if order.items else [])
        ])
        if items_count > 3:
            items_summary += f' ... (+{items_count - 3} more)'
        
        # Format dates
        placed_date = order.placed_at.strftime('%Y-%m-%d %H:%M') if order.placed_at else 'N/A'
        updated_date = order.updated_at.strftime('%Y-%m-%d %H:%M') if order.updated_at else 'N/A'
        
        # Get delivery address if available
        delivery_address = ''
        if order.shipping and isinstance(order.shipping, dict):
            addr = order.shipping.get('delivery_address', {})
            if addr:
                addr_parts = []
                if addr.get('unit_number'):
                    addr_parts.append(addr['unit_number'])
                if addr.get('building_name'):
                    addr_parts.append(addr['building_name'])
                if addr.get('street_address'):
                    addr_parts.append(addr['street_address'])
                if addr.get('city'):
                    addr_parts.append(addr['city'])
                if addr_parts:
                    delivery_address = ', '.join(addr_parts)
        
        click.echo(f'\nOrder ID: {order.id}')
        click.echo(f'  Customer: {customer_name} ({customer_email})')
        click.echo(f'  Customer ID: {order.customer_id or "N/A"}')
        click.echo(f'  Status: {order.status.upper()}')
        click.echo(f'  Total: R{float(order.total):.2f}')
        click.echo(f'  Items ({items_count}): {items_summary}')
        if delivery_address:
            click.echo(f'  Delivery Address: {delivery_address}')
        if order.payment_id:
            click.echo(f'  Payment ID: {order.payment_id}')
        click.echo(f'  Placed: {placed_date}')
        click.echo(f'  Updated: {updated_date}')
        click.echo('-' * 160)
    
    click.echo('\nOrder Status Legend:')
    click.echo('  - pending: Order created, awaiting payment')
    click.echo('  - paid: Payment completed')
    click.echo('  - shipped: Order has been shipped')
    click.echo('  - delivered: Order has been delivered')
    click.echo('  - cancelled: Order has been cancelled')

@cli.command('seed-products')
@click.option('--clear', is_flag=True, help='Clear all existing products before seeding')
@click.option('--count', default=10, help='Number of products to seed per category (if using default seed data)')
@with_appcontext
def seed_products(clear, count):
    """Seed shop with default products"""
    # Default seed data - common products with categories
    default_products = [
        # Electronics
        {'name': 'Smartphone', 'description': 'Latest smartphone with advanced features', 'price': 8999.99, 'category': 'electronics'},
        {'name': 'Laptop', 'description': 'High-performance laptop for work and gaming', 'price': 12999.99, 'category': 'electronics'},
        {'name': 'Headphones', 'description': 'Wireless noise-cancelling headphones', 'price': 2499.99, 'category': 'electronics'},
        {'name': 'Smartwatch', 'description': 'Fitness tracking smartwatch', 'price': 3499.99, 'category': 'electronics'},
        {'name': 'Tablet', 'description': '10-inch tablet for entertainment', 'price': 5999.99, 'category': 'electronics'},
        
        # Clothing
        {'name': 'T-Shirt', 'description': 'Cotton t-shirt in various colors', 'price': 199.99, 'category': 'clothing'},
        {'name': 'Jeans', 'description': 'Classic denim jeans', 'price': 799.99, 'category': 'clothing'},
        {'name': 'Sneakers', 'description': 'Comfortable running sneakers', 'price': 1299.99, 'category': 'clothing'},
        {'name': 'Jacket', 'description': 'Winter jacket with warm lining', 'price': 1499.99, 'category': 'clothing'},
        {'name': 'Dress', 'description': 'Elegant evening dress', 'price': 999.99, 'category': 'clothing'},
        
        # Home & Kitchen
        {'name': 'Coffee Maker', 'description': 'Automatic drip coffee maker', 'price': 899.99, 'category': 'home-kitchen'},
        {'name': 'Blender', 'description': 'High-speed kitchen blender', 'price': 599.99, 'category': 'home-kitchen'},
        {'name': 'Toaster', 'description': '4-slice stainless steel toaster', 'price': 399.99, 'category': 'home-kitchen'},
        {'name': 'Dining Set', 'description': '6-piece dinnerware set', 'price': 499.99, 'category': 'home-kitchen'},
        {'name': 'Bedding Set', 'description': 'Queen size bedding set', 'price': 699.99, 'category': 'home-kitchen'},
        
        # Sports & Outdoors
        {'name': 'Bicycle', 'description': 'Mountain bike for trails', 'price': 3999.99, 'category': 'sports-outdoors'},
        {'name': 'Yoga Mat', 'description': 'Non-slip exercise yoga mat', 'price': 299.99, 'category': 'sports-outdoors'},
        {'name': 'Dumbbells Set', 'description': 'Adjustable dumbbells set', 'price': 1799.99, 'category': 'sports-outdoors'},
        {'name': 'Tennis Racket', 'description': 'Professional tennis racket', 'price': 1299.99, 'category': 'sports-outdoors'},
        {'name': 'Camping Tent', 'description': '4-person camping tent', 'price': 2499.99, 'category': 'sports-outdoors'},
        
        # Books & Media
        {'name': 'Novel', 'description': 'Bestselling fiction novel', 'price': 149.99, 'category': 'books-media'},
        {'name': 'Cookbook', 'description': 'Gourmet recipes cookbook', 'price': 249.99, 'category': 'books-media'},
        {'name': 'DVD Collection', 'description': 'Classic movie DVD collection', 'price': 399.99, 'category': 'books-media'},
        {'name': 'Music Album', 'description': 'Latest music album CD', 'price': 179.99, 'category': 'books-media'},
        {'name': 'Educational Book', 'description': 'Learning and development book', 'price': 299.99, 'category': 'books-media'},
    ]
    
    # Clear existing products if requested
    if clear:
        deleted_count = ShopProduct.query.count()
        ShopProduct.query.delete()
        db.session.commit()
        click.echo(f'Cleared {deleted_count} existing products.')
    
    # Ensure categories exist first
    category_map = {}
    categories_to_create = set(p['category'] for p in default_products)
    
    for cat_id in categories_to_create:
        category = ShopCategory.query.get(cat_id)
        if not category:
            category = ShopCategory(
                id=cat_id,
                title=cat_id.replace('-', ' ').title()
            )
            db.session.add(category)
            click.echo(f'Created category: {cat_id}')
        category_map[cat_id] = category
    
    db.session.commit()
    
    # Seed products
    created = 0
    skipped = 0
    
    for product_data in default_products:
        # Check if product already exists (by name)
        existing = ShopProduct.query.filter_by(name=product_data['name']).first()
        if existing:
            skipped += 1
            continue
        
        # Generate product ID
        product_id = f"PROD-{secrets.token_hex(8).upper()}"
        while ShopProduct.query.get(product_id):
            product_id = f"PROD-{secrets.token_hex(8).upper()}"
        
        # Create product
        product = ShopProduct(
            id=product_id,
            name=product_data['name'],
            description=product_data['description'],
            price=product_data['price'],
            category_id=product_data['category'],
            in_stock=True,
            image_url=None
        )
        
        db.session.add(product)
        created += 1
    
    db.session.commit()
    
    click.echo(f'\nSeeding complete!')
    click.echo(f'  Created: {created} products')
    click.echo(f'  Skipped: {skipped} existing products')
    click.echo(f'  Categories: {len(category_map)} categories')

@cli.command('populate-countries')
@with_appcontext
def populate_countries():
    """Populate countries table with all world countries"""
    # List of all countries (ISO 3166-1)
    countries_data = [
        {'name': 'South Africa', 'code': 'ZA'},
        {'name': 'United States', 'code': 'US'},
        {'name': 'United Kingdom', 'code': 'GB'},
        {'name': 'Canada', 'code': 'CA'},
        {'name': 'Australia', 'code': 'AU'},
        {'name': 'New Zealand', 'code': 'NZ'},
        {'name': 'Germany', 'code': 'DE'},
        {'name': 'France', 'code': 'FR'},
        {'name': 'Italy', 'code': 'IT'},
        {'name': 'Spain', 'code': 'ES'},
        {'name': 'Netherlands', 'code': 'NL'},
        {'name': 'Belgium', 'code': 'BE'},
        {'name': 'Switzerland', 'code': 'CH'},
        {'name': 'Austria', 'code': 'AT'},
        {'name': 'Sweden', 'code': 'SE'},
        {'name': 'Norway', 'code': 'NO'},
        {'name': 'Denmark', 'code': 'DK'},
        {'name': 'Finland', 'code': 'FI'},
        {'name': 'Poland', 'code': 'PL'},
        {'name': 'Portugal', 'code': 'PT'},
        {'name': 'Greece', 'code': 'GR'},
        {'name': 'Ireland', 'code': 'IE'},
        {'name': 'Czech Republic', 'code': 'CZ'},
        {'name': 'Hungary', 'code': 'HU'},
        {'name': 'Romania', 'code': 'RO'},
        {'name': 'Bulgaria', 'code': 'BG'},
        {'name': 'Croatia', 'code': 'HR'},
        {'name': 'Slovakia', 'code': 'SK'},
        {'name': 'Slovenia', 'code': 'SI'},
        {'name': 'Estonia', 'code': 'EE'},
        {'name': 'Latvia', 'code': 'LV'},
        {'name': 'Lithuania', 'code': 'LT'},
        {'name': 'Luxembourg', 'code': 'LU'},
        {'name': 'Malta', 'code': 'MT'},
        {'name': 'Cyprus', 'code': 'CY'},
        {'name': 'Japan', 'code': 'JP'},
        {'name': 'China', 'code': 'CN'},
        {'name': 'India', 'code': 'IN'},
        {'name': 'South Korea', 'code': 'KR'},
        {'name': 'Singapore', 'code': 'SG'},
        {'name': 'Malaysia', 'code': 'MY'},
        {'name': 'Thailand', 'code': 'TH'},
        {'name': 'Indonesia', 'code': 'ID'},
        {'name': 'Philippines', 'code': 'PH'},
        {'name': 'Vietnam', 'code': 'VN'},
        {'name': 'Brazil', 'code': 'BR'},
        {'name': 'Argentina', 'code': 'AR'},
        {'name': 'Chile', 'code': 'CL'},
        {'name': 'Mexico', 'code': 'MX'},
        {'name': 'Colombia', 'code': 'CO'},
        {'name': 'Peru', 'code': 'PE'},
        {'name': 'Venezuela', 'code': 'VE'},
        {'name': 'Ecuador', 'code': 'EC'},
        {'name': 'Uruguay', 'code': 'UY'},
        {'name': 'Paraguay', 'code': 'PY'},
        {'name': 'Bolivia', 'code': 'BO'},
        {'name': 'Panama', 'code': 'PA'},
        {'name': 'Costa Rica', 'code': 'CR'},
        {'name': 'Guatemala', 'code': 'GT'},
        {'name': 'Honduras', 'code': 'HN'},
        {'name': 'El Salvador', 'code': 'SV'},
        {'name': 'Nicaragua', 'code': 'NI'},
        {'name': 'Dominican Republic', 'code': 'DO'},
        {'name': 'Cuba', 'code': 'CU'},
        {'name': 'Jamaica', 'code': 'JM'},
        {'name': 'Trinidad and Tobago', 'code': 'TT'},
        {'name': 'Barbados', 'code': 'BB'},
        {'name': 'Bahamas', 'code': 'BS'},
        {'name': 'Belize', 'code': 'BZ'},
        {'name': 'Guyana', 'code': 'GY'},
        {'name': 'Suriname', 'code': 'SR'},
        {'name': 'Russia', 'code': 'RU'},
        {'name': 'Ukraine', 'code': 'UA'},
        {'name': 'Turkey', 'code': 'TR'},
        {'name': 'Israel', 'code': 'IL'},
        {'name': 'Saudi Arabia', 'code': 'SA'},
        {'name': 'United Arab Emirates', 'code': 'AE'},
        {'name': 'Qatar', 'code': 'QA'},
        {'name': 'Kuwait', 'code': 'KW'},
        {'name': 'Bahrain', 'code': 'BH'},
        {'name': 'Oman', 'code': 'OM'},
        {'name': 'Jordan', 'code': 'JO'},
        {'name': 'Lebanon', 'code': 'LB'},
        {'name': 'Egypt', 'code': 'EG'},
        {'name': 'Morocco', 'code': 'MA'},
        {'name': 'Algeria', 'code': 'DZ'},
        {'name': 'Tunisia', 'code': 'TN'},
        {'name': 'Libya', 'code': 'LY'},
        {'name': 'Sudan', 'code': 'SD'},
        {'name': 'Ethiopia', 'code': 'ET'},
        {'name': 'Kenya', 'code': 'KE'},
        {'name': 'Tanzania', 'code': 'TZ'},
        {'name': 'Uganda', 'code': 'UG'},
        {'name': 'Ghana', 'code': 'GH'},
        {'name': 'Nigeria', 'code': 'NG'},
        {'name': 'Senegal', 'code': 'SN'},
        {'name': 'Ivory Coast', 'code': 'CI'},
        {'name': 'Cameroon', 'code': 'CM'},
        {'name': 'Angola', 'code': 'AO'},
        {'name': 'Mozambique', 'code': 'MZ'},
        {'name': 'Madagascar', 'code': 'MG'},
        {'name': 'Malawi', 'code': 'MW'},
        {'name': 'Zambia', 'code': 'ZM'},
        {'name': 'Zimbabwe', 'code': 'ZW'},
        {'name': 'Botswana', 'code': 'BW'},
        {'name': 'Namibia', 'code': 'NA'},
        {'name': 'Lesotho', 'code': 'LS'},
        {'name': 'Swaziland', 'code': 'SZ'},
    ]
    
    created = 0
    skipped = 0
    
    for country_data in countries_data:
        existing = Country.query.filter_by(name=country_data['name']).first()
        if existing:
            skipped += 1
            continue
        
        country = Country(
            name=country_data['name'],
            code=country_data['code'],
            is_active=True
        )
        db.session.add(country)
        created += 1
    
    db.session.commit()
    
    click.echo(f'Countries populated: {created} created, {skipped} already existed')

@cli.command('populate-categories')
@with_appcontext
def populate_categories():
    """Populate shop categories and subcategories (from Online Shop Multi-Level Subcategories)."""
    categories_data = [
        {
            'id': 'clothing',
            'title': 'Clothing',
            'subcategories': [
                {'id': 'clothing-men', 'title': 'Men'},
                {'id': 'clothing-women', 'title': 'Women'},
                {'id': 'clothing-kids', 'title': 'Kids'},
                {'id': 'clothing-shoes', 'title': 'Shoes'},
                {'id': 'clothing-men-shoes', 'title': 'Men Shoes'},
                {'id': 'clothing-women-shoes', 'title': 'Women Shoes'},
                {'id': 'clothing-kids-shoes', 'title': 'Kids Shoes'},
            ]
        },
        {
            'id': 'furniture',
            'title': 'Furniture',
            'subcategories': [
                {'id': 'furniture-living-room', 'title': 'Living Room'},
                {'id': 'furniture-bedroom', 'title': 'Bedroom'},
                {'id': 'furniture-office', 'title': 'Office'},
            ]
        },
        {
            'id': 'beauty-products',
            'title': 'Beauty Products',
            'subcategories': [
                {'id': 'beauty-makeup', 'title': 'Makeup'},
                {'id': 'beauty-skincare', 'title': 'Skincare'},
                {'id': 'beauty-haircare', 'title': 'Haircare'},
            ]
        },
        {
            'id': 'electronics',
            'title': 'Electronics',
            'subcategories': [
                {'id': 'electronics-tv-audio', 'title': 'TV & Audio'},
                {'id': 'electronics-kitchen-appliances', 'title': 'Kitchen Appliances'},
                {'id': 'electronics-mobile-gadgets', 'title': 'Mobile & Gadgets'},
            ]
        },
        {
            'id': 'homeware',
            'title': 'Homeware',
            'subcategories': [
                {'id': 'homeware-kitchen', 'title': 'Kitchen'},
                {'id': 'homeware-bathroom', 'title': 'Bathroom'},
                {'id': 'homeware-decor', 'title': 'Decor'},
            ]
        },
        {
            'id': 'dry-food',
            'title': 'Dry Food',
            'subcategories': [
                {'id': 'dry-food-grains-rice', 'title': 'Grains & Rice'},
                {'id': 'dry-food-cereals-breakfast', 'title': 'Cereals & Breakfast'},
                {'id': 'dry-food-snacks', 'title': 'Snacks'},
                {'id': 'dry-food-canned', 'title': 'Canned Food'},
                {'id': 'dry-food-frozen', 'title': 'Frozen Food'},
                {'id': 'dry-food-pickled-jarred', 'title': 'Pickled & Jarred'},
            ]
        },
        {
            'id': 'cars',
            'title': 'Cars',
            'subcategories': [
                {'id': 'cars-new', 'title': 'New Cars'},
                {'id': 'cars-used', 'title': 'Used Cars'},
                {'id': 'cars-commercial', 'title': 'Commercial'},
            ]
        },
        {
            'id': 'houses-property',
            'title': 'Houses & Property',
            'subcategories': [
                {'id': 'property-for-sale', 'title': 'For Sale'},
                {'id': 'property-to-rent', 'title': 'To Rent'},
                {'id': 'property-commercial', 'title': 'Commercial'},
            ]
        },
    ]
    
    categories_created = 0
    subcategories_created = 0
    
    for cat_data in categories_data:
        # Create or get category
        category = ShopCategory.query.get(cat_data['id'])
        if not category:
            category = ShopCategory(id=cat_data['id'], title=cat_data['title'])
            db.session.add(category)
            categories_created += 1
        
        # Create subcategories
        for subcat_data in cat_data.get('subcategories', []):
            existing_subcat = ShopSubcategory.query.get(subcat_data['id'])
            if not existing_subcat:
                subcategory = ShopSubcategory(
                    id=subcat_data['id'],
                    category_id=cat_data['id'],
                    title=subcat_data['title']
                )
                db.session.add(subcategory)
                subcategories_created += 1
    
    db.session.commit()
    click.echo(f'Categories: {categories_created} created')
    click.echo(f'Subcategories: {subcategories_created} created')

@cli.command('populate-services')
@with_appcontext
def populate_services():
    """Populate default service types"""
    services_data = [
        # Service Provider Services
        {'name': 'Home Cleaning', 'description': 'Professional home cleaning services', 'category': 'service-provider', 'order': 1},
        {'name': 'Garden Maintenance', 'description': 'Lawn care and garden maintenance', 'category': 'service-provider', 'order': 2},
        {'name': 'Plumbing', 'description': 'Plumbing repairs and installations', 'category': 'service-provider', 'order': 3},
        {'name': 'Electrical Services', 'description': 'Electrical repairs and installations', 'category': 'service-provider', 'order': 4},
        {'name': 'Painting', 'description': 'Interior and exterior painting', 'category': 'service-provider', 'order': 5},
        {'name': 'Carpentry', 'description': 'Woodwork and carpentry services', 'category': 'service-provider', 'order': 6},
        {'name': 'Event Management', 'description': 'Event planning and management', 'category': 'service-provider', 'order': 7},
        {'name': 'DJ Services', 'description': 'DJ and music services for events', 'category': 'service-provider', 'order': 8},
        {'name': 'Catering', 'description': 'Food catering services', 'category': 'service-provider', 'order': 9},
        {'name': 'Photography', 'description': 'Photography services', 'category': 'service-provider', 'order': 10},
        {'name': 'Videography', 'description': 'Video production services', 'category': 'service-provider', 'order': 11},
        {'name': 'Hair Styling', 'description': 'Hair cutting and styling', 'category': 'service-provider', 'order': 12},
        {'name': 'Beauty Services', 'description': 'Beauty and spa services', 'category': 'service-provider', 'order': 13},
        {'name': 'Massage Therapy', 'description': 'Therapeutic massage services', 'category': 'service-provider', 'order': 14},
        {'name': 'Moving Services', 'description': 'Moving and relocation services', 'category': 'service-provider', 'order': 15},
        {'name': 'Pet Care', 'description': 'Pet sitting and care services', 'category': 'service-provider', 'order': 16},
        {'name': 'Tutoring', 'description': 'Educational tutoring services', 'category': 'service-provider', 'order': 17},
        {'name': 'IT Support', 'description': 'Computer and IT support services', 'category': 'service-provider', 'order': 18},
        {'name': 'Appliance Repair', 'description': 'Home appliance repair services', 'category': 'service-provider', 'order': 19},
        {'name': 'Locksmith', 'description': 'Locksmith services', 'category': 'service-provider', 'order': 20},
        
        # Professional Services
        {'name': 'Accountant', 'description': 'Accounting and financial services', 'category': 'professional', 'order': 1},
        {'name': 'Lawyer', 'description': 'Legal services and consultation', 'category': 'professional', 'order': 2},
        {'name': 'Doctor', 'description': 'Medical consultation services', 'category': 'professional', 'order': 3},
        {'name': 'Nurse', 'description': 'Nursing and healthcare services', 'category': 'professional', 'order': 4},
        {'name': 'Engineer', 'description': 'Engineering consultation', 'category': 'professional', 'order': 5},
        {'name': 'Architect', 'description': 'Architectural design services', 'category': 'professional', 'order': 6},
        {'name': 'IT Consultant', 'description': 'IT consulting and services', 'category': 'professional', 'order': 7},
        {'name': 'Marketing Consultant', 'description': 'Marketing and advertising services', 'category': 'professional', 'order': 8},
        {'name': 'Financial Advisor', 'description': 'Financial planning and advice', 'category': 'professional', 'order': 9},
        {'name': 'Real Estate Agent', 'description': 'Real estate services', 'category': 'professional', 'order': 10},
    ]
    
    created = 0
    skipped = 0
    
    for svc_data in services_data:
        existing = ServiceType.query.filter_by(name=svc_data['name'], category=svc_data['category']).first()
        if existing:
            skipped += 1
            continue
        
        service = ServiceType(
            name=svc_data['name'],
            description=svc_data.get('description'),
            category=svc_data['category'],
            order=svc_data.get('order', 0),
            is_active=True
        )
        db.session.add(service)
        created += 1
    
    db.session.commit()
    click.echo(f'Services populated: {created} created, {skipped} already existed')


# Default agent list (name/surname parsed; agent_id AGT001, AGT002, ...)
SEED_AGENTS_NAMES = [
    'Taole Lebenya',
    'Itumeleng Monyake',
    'Toivo Lebenya',
    'Khwezi Macingwane',
    'Tshepo Rasiile',
    'Phumlani Mfenyana',
    'Sebolelo Mpiko',
    'Nakisane',
    'Uni Students',
    'Mankoebe Letsie',
    'Lintle Letsie',
    'Ntshiuoa Macingwane',
    'Andile Fusi',
]


@cli.command('seed-agents')
@click.option('--clear', is_flag=True, help='Remove existing agents before seeding (optional)')
@with_appcontext
def seed_agents(clear):
    """Populate the agents table from the default list (agent_id: AGT001, AGT002, ...)."""
    if clear:
        deleted = Agent.query.delete()
        db.session.commit()
        click.echo(f'Removed {deleted} existing agent(s).')
    created = 0
    skipped = 0
    for i, full_name in enumerate(SEED_AGENTS_NAMES, start=1):
        agent_id_code = f'AGT{i:03d}'
        if Agent.query.filter_by(agent_id=agent_id_code).first():
            click.echo(f'  Skip {agent_id_code}: already exists')
            skipped += 1
            continue
        parts = (full_name or '').strip().split(None, 1)
        name = parts[0] if parts else ''
        surname = parts[1] if len(parts) > 1 else ''
        agent = Agent(name=name, surname=surname, agent_id=agent_id_code)
        db.session.add(agent)
        created += 1
        click.echo(f'  Added {agent_id_code}: {name} {surname}'.strip())
    db.session.commit()
    click.echo(f'Agents: {created} created, {skipped} skipped.')


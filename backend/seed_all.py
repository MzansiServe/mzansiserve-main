"""
seed_all CLI command — runs every seeder in dependency order.
Imported and registered in backend/cli.py via:  from backend.seed_all import seed_all
"""
import click
import os
import shutil
from flask.cli import with_appcontext
from flask import current_app

from backend.extensions import db
from backend.models import User, ShopCategory, ShopSubcategory, Country, ServiceType, Agent
from backend.services.wallet_service import WalletService
from backend.utils.auth import generate_tracking_number


@click.command('seed-all')
@with_appcontext
def seed_all():
    """
    Run ALL seeders in order and create the default admin user.
    Idempotent — safe to run on every deploy; existing records are skipped.

    Admin credentials created:
      Email   : admin@mzansiserve.co.za
      Password: admin
    """
    from backend.models.carousel import CarouselItem
    from backend.models.testimonial import Testimonial
    from backend.models.landing_feature import LandingFeature
    from backend.models.setting import AppSetting

    SEP = '─' * 55
    click.echo(f'\n{SEP}')
    click.echo('  MzansiServe — Full Database Seed')
    click.echo(f'{SEP}\n')

    # ── 1. Countries ───────────────────────────────────────────────────────
    click.echo('[1/8] Countries…')
    countries_data = [
        ('South Africa', 'ZA'), ('United States', 'US'), ('United Kingdom', 'GB'),
        ('Canada', 'CA'), ('Australia', 'AU'), ('New Zealand', 'NZ'),
        ('Germany', 'DE'), ('France', 'FR'), ('Netherlands', 'NL'),
        ('Kenya', 'KE'), ('Nigeria', 'NG'), ('Zimbabwe', 'ZW'),
        ('Botswana', 'BW'), ('Namibia', 'NA'), ('Lesotho', 'LS'),
        ('Mozambique', 'MZ'), ('Zambia', 'ZM'), ('Tanzania', 'TZ'),
        ('India', 'IN'), ('China', 'CN'),
    ]
    c_created = 0
    for name, code in countries_data:
        if not Country.query.filter_by(name=name).first():
            db.session.add(Country(name=name, code=code, is_active=True))
            c_created += 1
    db.session.commit()
    click.echo(f'   {c_created} created.\n')

    # ── 2. Shop Categories ─────────────────────────────────────────────────
    click.echo('[2/8] Shop categories…')
    cats = [
        ('clothing',        'Clothing',        [('clothing-men', 'Men'), ('clothing-women', 'Women'), ('clothing-kids', 'Kids')]),
        ('electronics',     'Electronics',     [('electronics-tv-audio', 'TV & Audio'), ('electronics-mobile-gadgets', 'Mobile & Gadgets')]),
        ('homeware',        'Homeware',        [('homeware-kitchen', 'Kitchen'), ('homeware-decor', 'Decor')]),
        ('beauty-products', 'Beauty Products', [('beauty-makeup', 'Makeup'), ('beauty-skincare', 'Skincare')]),
        ('dry-food',        'Dry Food',        [('dry-food-grains-rice', 'Grains & Rice'), ('dry-food-snacks', 'Snacks')]),
        ('furniture',       'Furniture',       [('furniture-living-room', 'Living Room'), ('furniture-bedroom', 'Bedroom')]),
    ]
    cat_c = sub_c = 0
    for cid, ctitle, subs in cats:
        if not ShopCategory.query.get(cid):
            db.session.add(ShopCategory(id=cid, title=ctitle))
            cat_c += 1
        for sid, stitle in subs:
            if not ShopSubcategory.query.get(sid):
                db.session.add(ShopSubcategory(id=sid, category_id=cid, title=stitle))
                sub_c += 1
    db.session.commit()
    click.echo(f'   {cat_c} categories, {sub_c} subcategories created.\n')

    # ── 3. Services ────────────────────────────────────────────────────────
    click.echo('[3/8] Service types…')
    services_data = [
        ('Home Cleaning',    'service-provider', 1),  ('Plumbing',      'service-provider', 2),
        ('Electrical',       'service-provider', 3),  ('Painting',      'service-provider', 4),
        ('Garden Maintenance','service-provider', 5), ('Carpentry',     'service-provider', 6),
        ('Event Management', 'service-provider', 7),  ('DJ Services',   'service-provider', 8),
        ('Catering',         'service-provider', 9),  ('Photography',   'service-provider', 10),
        ('Hair Styling',     'service-provider', 11), ('Beauty Services','service-provider', 12),
        ('Moving Services',  'service-provider', 13), ('Pet Care',      'service-provider', 14),
        ('IT Support',       'service-provider', 15), ('Locksmith',     'service-provider', 16),
        ('Accountant',       'professional', 1),      ('Lawyer',        'professional', 2),
        ('Doctor',           'professional', 3),      ('Engineer',      'professional', 4),
        ('Architect',        'professional', 5),      ('Financial Advisor', 'professional', 6),
        ('Real Estate Agent','professional', 7),      ('IT Consultant', 'professional', 8),
    ]
    svc_c = 0
    for sname, scat, sorder in services_data:
        if not ServiceType.query.filter_by(name=sname, category=scat).first():
            db.session.add(ServiceType(name=sname, category=scat, order=sorder, is_active=True))
            svc_c += 1
    db.session.commit()
    click.echo(f'   {svc_c} created.\n')

    # ── 4. Agents ──────────────────────────────────────────────────────────
    click.echo('[4/8] Agents…')
    agent_names = [
        'Taole Lebenya', 'Itumeleng Monyake', 'Toivo Lebenya', 'Khwezi Macingwane',
        'Tshepo Rasiile', 'Phumlani Mfenyana', 'Sebolelo Mpiko', 'Mankoebe Letsie',
        'Lintle Letsie', 'Ntshiuoa Macingwane', 'Andile Fusi',
    ]
    agt_c = 0
    for i, full_name in enumerate(agent_names, start=1):
        code = f'AGT{i:03d}'
        if not Agent.query.filter_by(agent_id=code).first():
            parts = full_name.strip().split(None, 1)
            db.session.add(Agent(
                name=parts[0],
                surname=parts[1] if len(parts) > 1 else '',
                agent_id=code,
            ))
            agt_c += 1
    db.session.commit()
    click.echo(f'   {agt_c} created.\n')

    # ── 5. Hero Banners ────────────────────────────────────────────────────
    click.echo('[5/8] Hero banners…')
    uploads_dir = current_app.config.get('UPLOAD_FOLDER', 'uploads')
    os.makedirs(uploads_dir, exist_ok=True)
    assets_dir = os.path.join(current_app.root_path, 'frontend', 'src', 'assets')
    banners = [
        (1, 'Transport',    'Reliable Rides,\nAnytime, Anywhere',
         'Book verified drivers across South Africa. Safe, affordable, and at your fingertips.',
         'Book a Ride',    '/transport',    'bg-gradient-purple shadow-glow-purple', 'hero-transport.jpg'),
        (2, 'Professionals','Expert Help,\nOne Click Away',
         'Hire accredited lawyers, doctors, accountants, engineers and more — all verified.',
         'Find an Expert', '/professionals','bg-sa-blue shadow-lg',                 'hero-professionals.jpg'),
        (3, 'Services',    'Home & Garden\nServices on Demand',
         'From cleaning to events, DSTV to repairs — trusted providers at your door.',
         'Get a Service',  '/services',    'bg-gradient-gold shadow-glow-gold',     'hero-services.jpg'),
        (4, 'Shop',        'Buy & Sell\nLocally with Ease',
         'Discover products from local sellers. A marketplace built for Mzansi.',
         'Start Shopping', '/shop',        'bg-sa-red shadow-lg',                  'hero-shop.jpg'),
    ]
    ban_c = 0
    for order, badge, title, subtitle, cta_text, cta_link, cta_color, img_file in banners:
        if CarouselItem.query.filter_by(badge=badge).first():
            continue
        src = os.path.join(assets_dir, img_file)
        dest_name = f'carousel_seed_{img_file}'
        image_url = None
        try:
            if os.path.exists(src):
                shutil.copy2(src, os.path.join(uploads_dir, dest_name))
                image_url = f'/uploads/{dest_name}'
        except Exception:
            pass
        db.session.add(CarouselItem(
            image_url=image_url, cta_link=cta_link, cta_text=cta_text,
            title=title, subtitle=subtitle, badge=badge,
            cta_color=cta_color, order=order, is_active=True,
        ))
        ban_c += 1
    db.session.commit()
    click.echo(f'   {ban_c} created.\n')

    # ── 6. Landing Features & Testimonials ─────────────────────────────────
    click.echo('[6/8] Landing content…')
    features = [
        ('ShieldCheck', 'Fully Verified',    'Every provider is vetted through SARS, Home Affairs, CIPC, and SAPS databases.', 1),
        ('Clock',       'Instant Booking',   'Book any service in seconds. No long calls, no waiting — just tap and go.',        2),
        ('BadgeCheck',  'Accredited Experts',"Professional bodies validate credentials so you don't have to do due diligence.", 3),
        ('Headphones',  'Dedicated Support', 'Our Mzansi-based support team is available to help — any time, any issue.',       4),
    ]
    feat_c = 0
    for icon, title, desc, order in features:
        if not LandingFeature.query.filter_by(title=title).first():
            db.session.add(LandingFeature(icon=icon, title=title, description=desc, order=order, is_active=True))
            feat_c += 1
    testimonials = [
        ('Sipho Dlamini', 'Homeowner, Johannesburg',  5, 1,
         'I booked a plumber through MzansiServe and he arrived within the hour. Verified, professional, and affordable!'),
        ('Zanele Mokoena','Business Owner, Cape Town', 5, 2,
         'The drivers on this platform are punctual and courteous. I use MzansiServe for all my business transport needs.'),
        ('Thabo Sithole', 'Software Engineer, Durban',  5, 3,
         'Found an amazing accountant for my small business. The verification process gives me peace of mind.'),
        ('Lerato Khumalo','Event Planner, Pretoria',    5, 4,
         "I hired a caterer and DJ through MzansiServe for my client's event. Both were exceptional!"),
    ]
    test_c = 0
    for name, role, rating, order, text in testimonials:
        if not Testimonial.query.filter_by(name=name).first():
            db.session.add(Testimonial(name=name, role=role, rating=rating, order=order, text=text, is_active=True))
            test_c += 1
    db.session.commit()
    click.echo(f'   {feat_c} features, {test_c} testimonials created.\n')

    # ── 7. App Settings ────────────────────────────────────────────────────
    click.echo('[7/10] App settings…')
    settings = [
        ('callout_fee_amount',               150.0),
        ('professional_callout_fee_amount',  250.0),
        ('provider_callout_fee_amount',      150.0),
        ('driver_admin_fee_rate',            0.10),
        ('agent_commission_default',         20.0),
        ('agent_commission_driver',          25.0),
        ('agent_commission_professional',    30.0),
        ('agent_commission_service-provider',25.0),
        ('agent_commission_client',          10.0),
    ]
    set_c = 0
    for key, value in settings:
        if not AppSetting.query.get(key):
            db.session.add(AppSetting(key=key, value=value))
            set_c += 1
    db.session.commit()
    click.echo(f'   {set_c} created.\n')

    # ── 8. Default Admin User ──────────────────────────────────────────────
    click.echo('[8/10] Default admin user…')
    ADMIN_EMAIL = 'admin@mzansiserve.co.za'
    ADMIN_PASS  = 'admin'
    ADMIN_NAME  = 'MzansiServe Admin'
    if User.query.filter_by(email=ADMIN_EMAIL, role='admin').first():
        click.echo(f'   Already exists ({ADMIN_EMAIL}) — skipped.\n')
    else:
        admin = User(
            email=ADMIN_EMAIL, role='admin',
            is_admin=True, is_paid=True, is_approved=True,
            is_active=True, email_verified=True,
            tracking_number=generate_tracking_number(),
            data={'full_name': ADMIN_NAME},
        )
        admin.set_password(ADMIN_PASS)
        db.session.add(admin)
        db.session.commit()
        WalletService.get_or_create_wallet(admin.id)
        click.echo(f'   Admin created: {ADMIN_EMAIL}\n')

    # ── 9. Shop Products ───────────────────────────────────────────────────
    click.echo('[9/10] Shop products…')
    from backend.models import ShopProduct
    import secrets
    default_products = [
        {'name': 'Smartphone', 'description': 'Latest smartphone with advanced features', 'price': 8999.99, 'category': 'electronics', 'image_url': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=800&auto=format&fit=crop'},
        {'name': 'Laptop', 'description': 'High-performance laptop for work and gaming', 'price': 12999.99, 'category': 'electronics', 'image_url': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=800&auto=format&fit=crop'},
        {'name': 'Headphones', 'description': 'Wireless noise-cancelling headphones', 'price': 2499.99, 'category': 'electronics', 'image_url': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800&auto=format&fit=crop'},
        {'name': 'Smartwatch', 'description': 'Fitness tracking smartwatch', 'price': 3499.99, 'category': 'electronics', 'image_url': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop'},
        {'name': 'T-Shirt', 'description': 'Cotton t-shirt in various colors', 'price': 199.99, 'category': 'clothing', 'image_url': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop'},
        {'name': 'Jeans', 'description': 'Classic denim jeans', 'price': 799.99, 'category': 'clothing', 'image_url': 'https://images.unsplash.com/photo-1542272604-787c3835535d?q=80&w=800&auto=format&fit=crop'},
        {'name': 'Coffee Maker', 'description': 'Automatic drip coffee maker', 'price': 899.99, 'category': 'homeware', 'image_url': 'https://images.unsplash.com/photo-1520970014086-2208d157c9e2?q=80&w=800&auto=format&fit=crop'},
        {'name': 'Blender', 'description': 'High-speed kitchen blender', 'price': 599.99, 'category': 'homeware', 'image_url': 'https://images.unsplash.com/photo-1585238341267-1cfec2046a55?q=80&w=800&auto=format&fit=crop'},
    ]
    prod_c = 0
    for p_data in default_products:
        if not ShopProduct.query.filter_by(name=p_data['name']).first():
            p_id = f"PROD-{secrets.token_hex(8).upper()}"
            db.session.add(ShopProduct(
                id=p_id, name=p_data['name'], description=p_data['description'],
                price=p_data['price'], category_id=p_data['category'],
                in_stock=True, image_url=p_data['image_url']
            ))
            prod_c += 1
    db.session.commit()
    click.echo(f'   {prod_c} products created.\n')

    # ── 10. Demo Service Providers & Professionals ──────────────────────────
    click.echo('[10/10] Demo data (Providers & Professionals)…')
    demo_users = [
        {
            'email': 'prof_lawyer@mzansiserve.co.za', 'full_name': 'Advocate Sipho Mdluli',
            'role': 'professional', 'profession': 'Legal Consultant',
            'services': [{'name': 'Legal Advice', 'description': 'Contract law and civil litigation advice.', 'hourly_rate': 1200.0}],
            'qualification': 'LLB, LLM (Wits)', 'body': 'LPC'
        },
        {
            'email': 'prov_cleaning@mzansiserve.co.za', 'full_name': 'Sarah Moremi',
            'role': 'service-provider', 'business': 'Sparkle Home Services',
            'services': [{'name': 'Standard Cleaning', 'description': 'Full house cleaning.', 'hourly_rate': 180.0}]
        },
        {
            'email': 'prof_accountant@mzansiserve.co.za', 'full_name': 'Zanele Khumalo CA(SA)',
            'role': 'professional', 'profession': 'Chartered Accountant',
            'services': [{'name': 'Tax Consultation', 'description': 'SARS personal and business tax filing.', 'hourly_rate': 950.0}],
            'qualification': 'BAcc, CTA (UJ)', 'body': 'SAICA'
        }
    ]
    user_c = 0
    for u_data in demo_users:
        if not User.query.filter_by(email=u_data['email']).first():
            user = User(
                email=u_data['email'], role=u_data['role'],
                is_approved=True, is_active=True, is_paid=True,
                email_verified=True, tracking_number=generate_tracking_number(),
                data={
                    'full_name': u_data['full_name'],
                    'profession': u_data.get('profession'),
                    'business_name': u_data.get('business'),
                    'professional_services': u_data.get('services') if u_data['role'] == 'professional' else None,
                    'provider_services': u_data.get('services') if u_data['role'] == 'service-provider' else None,
                    'highest_qualification': u_data.get('qualification'),
                    'professional_body': u_data.get('body')
                }
            )
            user.set_password('password123')
            db.session.add(user)
            db.session.flush()
            WalletService.get_or_create_wallet(user.id)
            user_c += 1
    db.session.commit()
    click.echo(f'   {user_c} demo users created.\n')

    click.echo(SEP)
    click.echo(f'  Seed complete  ✓  ({prod_c} products, {user_c} demo users added)')
    click.echo(SEP)

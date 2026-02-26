"""
MzansiServe Flask Application
"""
import logging
import os
import sys

from flask import Flask, render_template, send_from_directory, request
from flask_migrate import Migrate
from flask_cors import CORS
from dotenv import load_dotenv

from backend.models import User, CarouselItem, FooterContent
from backend.extensions import db, jwt, mail, login_manager
from backend.config import Config

load_dotenv()


def _configure_logging(app):
    """Configure logging so app and gunicorn workers emit to stderr (visible in docker/compose logs)."""
    log_level = getattr(logging, (os.environ.get('LOG_LEVEL') or 'INFO').upper(), logging.INFO)
    root = logging.getLogger()
    # Avoid adding duplicate handlers when app is reloaded
    if not any(h.stream is sys.stderr for h in root.handlers if getattr(h, 'stream', None)):
        handler = logging.StreamHandler(sys.stderr)
        handler.setLevel(log_level)
        handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s [%(name)s] %(message)s'
        ))
        root.addHandler(handler)
        root.setLevel(log_level)


def create_app(config_class=Config):
    """Create and configure Flask application"""
    app = Flask(__name__,
                static_folder='static',
                static_url_path='/static',
                template_folder='templates')
    
    app.config.from_object(config_class)
    _configure_logging(app)

    # Initialize CORS
    # Initialize CORS - Allow all origins and ports for mobile apps
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize extensions
    db.init_app(app)
    jwt.init_app(app)
    mail.init_app(app)
    login_manager.init_app(app)
    Migrate(app, db)
    
    # Register CLI commands
    from backend.cli import cli
    app.cli.add_command(cli)

    # Register seed-all as a top-level Flask CLI command
    from backend.seed_all import seed_all
    app.cli.add_command(seed_all)
    
    # Register blueprints (API routes)
    from backend.routes import auth, requests, payments, shop, admin, dashboard, location, profile, address, faq, drivers, clients, public, chat, reports, ads
    app.register_blueprint(public.bp, url_prefix='/api/public')
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(requests.bp, url_prefix='/api/requests')
    app.register_blueprint(drivers.bp, url_prefix='/api/drivers')
    app.register_blueprint(clients.bp, url_prefix='/api/clients')
    app.register_blueprint(payments.bp, url_prefix='/api/payments')
    app.register_blueprint(shop.bp, url_prefix='/api/shop')
    app.register_blueprint(admin.bp, url_prefix='/api/admin')
    app.register_blueprint(dashboard.bp, url_prefix='/api/dashboard')
    app.register_blueprint(location.bp, url_prefix='/api/location')
    app.register_blueprint(profile.bp, url_prefix='/api/profile')
    app.register_blueprint(address.bp, url_prefix='/api/addresses')
    app.register_blueprint(faq.bp, url_prefix='/api/faq')
    app.register_blueprint(chat.bp, url_prefix='/api/chat')
    app.register_blueprint(reports.bp, url_prefix='/api/reports')
    app.register_blueprint(ads.bp, url_prefix='/api/ads')
    
    @app.context_processor
    def inject_google_maps_api_key():
        return {'google_maps_api_key': app.config.get('GOOGLE_MAPS_API_KEY', '')}

    @app.context_processor
    def inject_footer_content():
        """Inject footer CMS content and current year for base template."""
        from datetime import datetime
        try:
            footer = FooterContent.query.get(1)
            fc = footer.to_dict() if footer else {'company_name': 'MzansiServe', 'email': None, 'phone': None, 'physical_address': None}
        except Exception:
            fc = {'company_name': 'MzansiServe', 'email': None, 'phone': None, 'physical_address': None}
        return {'footer_content': fc, 'current_year': datetime.utcnow().year}
    
    # Frontend routes (server-side rendered)
    @app.route('/')
    def index():
        carousel_items = []
        try:
            carousel_items = CarouselItem.query.filter_by(is_active=True).order_by(CarouselItem.order.asc(), CarouselItem.created_at.asc()).all()
            carousel_items = [i.to_dict() for i in carousel_items]
        except Exception:
            pass
        return render_template('index.html', carousel_items=carousel_items)
    
    @app.route('/login')
    def login_page():
        return render_template('login.html')
    
    @app.route('/register')
    def register_page():
        return render_template('register.html')
    
    @app.route('/admin-login')
    def admin_login_page():
        return render_template('admin_login.html')
    
    @app.route('/forgot-password')
    def forgot_password_page():
        return render_template('forgot_password.html')
    
    @app.route('/reset-password')
    def reset_password_page():
        return render_template('reset_password.html')
    
    @app.route('/dashboard')
    def dashboard_page():
        return render_template('dashboard.html')
    
    @app.route('/driver-dashboard')
    def driver_dashboard_page():
        return render_template('driver_dashboard.html')
    
    @app.route('/professional-dashboard')
    def professional_dashboard_page():
        return render_template('professional_dashboard.html')
    
    @app.route('/service-provider-dashboard')
    def service_provider_dashboard_page():
        return render_template('service_provider_dashboard.html')
    
    @app.route('/profile')
    def profile_page():
        return render_template('profile.html')
    
    @app.route('/request-driver')
    def request_driver_page():
        return render_template('request_driver.html')
    
    @app.route('/request-professional')
    def request_professional_page():
        return render_template('request_professional.html')
    
    @app.route('/request-service-provider')
    def request_service_provider_page():
        return render_template('request_service_provider.html')
    
    @app.route('/shop')
    def shop_page():
        return render_template('shop.html')
    
    @app.route('/shop/product/<product_id>')
    def product_details_page(product_id):
        return render_template('product_details.html', product_id=product_id)
    
    @app.route('/cart')
    def cart_page():
        return render_template('cart.html')
    
    @app.route('/checkout')
    def checkout_page():
        return render_template('checkout.html')
    
    @app.route('/shopping-history')
    def shopping_history_page():
        return render_template('shopping_history.html')
    
    @app.route('/order/<order_id>')
    def order_details_page(order_id):
        return render_template('order_details.html', order_id=order_id)
    
    @app.route('/requested-services')
    def requested_services_page():
        return render_template('requested_services.html')
    
    @app.route('/driver-reviews/<driver_id>')
    def driver_reviews_page(driver_id):
        return render_template('driver_reviews.html', driver_id=driver_id)
    
    @app.route('/client-reviews/<client_id>')
    def client_reviews_page(client_id):
        return render_template('client_reviews.html', client_id=client_id)
    
    @app.route('/rides-made')
    def rides_made_page():
        return render_template('rides_made.html')
    
    @app.route('/wallet')
    def wallet_page():
        return render_template('wallet.html')
    
    @app.route('/terms-of-use')
    def terms_of_use_page():
        return render_template('terms_of_use.html')
    
    @app.route('/privacy-policy')
    def privacy_policy_page():
        return render_template('privacy_policy.html')
    
    @app.route('/faq')
    def faq_page():
        return render_template('faq.html')
    
    @app.route('/admin')
    @app.route('/admin/')
    def admin_page():
        """Admin portal - only accessible to admin users (checked via client-side JavaScript)"""
        # Client-side JavaScript will check admin status and show/hide content accordingly
        # API endpoints are protected server-side with @require_admin decorator
        return render_template('admin.html')
    
    # Serve uploaded files
    @app.route('/uploads/<filename>')
    def uploaded_file(filename):
        """Serve uploaded files"""
        upload_folder = app.config.get('UPLOAD_FOLDER')
        return send_from_directory(upload_folder, filename)
    
    return app

# Create app instance
app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    port = int(os.environ.get('PORT', 5006))
    app.run(host='0.0.0.0', port=port, debug=True)


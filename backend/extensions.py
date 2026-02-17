"""
Flask Extensions
"""
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_mail import Mail
from flask_login import LoginManager

# Initialize extensions
db = SQLAlchemy()
jwt = JWTManager()
mail = Mail()
login_manager = LoginManager()

@login_manager.user_loader
def load_user(user_id):
    """Load user for Flask-Login"""
    from backend.models import User
    return User.query.get(user_id)


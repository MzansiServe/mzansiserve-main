from app import create_app
from backend.models import User
from backend.extensions import db
import sys

def verify_user(email):
    app = create_app()
    with app.app_context():
        user = User.query.filter_by(email=email).first()
        if not user:
            print(f"No user found with email: {email}")
            return
        
        user.email_verified = True
        user.is_approved = True
        user.is_active = True
        db.session.commit()
        print(f"User {email} verified and approved successfully.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python verify_test_user.py <email>")
    else:
        verify_user(sys.argv[1])

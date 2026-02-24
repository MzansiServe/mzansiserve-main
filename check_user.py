from app import create_app
from backend.models import User
import sys

def check_user(email, password):
    app = create_app()
    with app.app_context():
        users = User.query.filter_by(email=email).all()
        if not users:
            print(f"No user found with email: {email}")
            return
        
        print(f"Found {len(users)} users for {email}:")
        for u in users:
            pwd_match = u.check_password(password)
            print(f" - Role: {u.role}, Active: {u.is_active}, Password Match: {pwd_match}, ID: {u.id}, Is Paid: {u.is_paid}, Is Approved: {u.is_approved}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python check_user.py <email> <password>")
    else:
        check_user(sys.argv[1], sys.argv[2])

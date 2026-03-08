from app import create_app
from backend.models import User
import sys

def list_users():
    app = create_app()
    with app.app_context():
        users = User.query.all()
        if not users:
            print("No users found in database.")
            return
        
        print(f"Total users: {len(users)}")
        for u in users:
            print(f" - {u.email} | Role: {u.role} | Active: {u.is_active} | Paid: {u.is_paid}")

if __name__ == "__main__":
    list_users()

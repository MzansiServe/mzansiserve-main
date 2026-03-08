from app import create_app
from backend.extensions import db
from backend.models import User
import sys

def delete_user(email, role):
    app = create_app()
    with app.app_context():
        user = User.query.filter_by(email=email, role=role).first()
        if not user:
            print(f"User {email} with role {role} not found.")
            return
        
        print(f"Deleting user: {user.email} | Role: {user.role}")
        db.session.delete(user)
        db.session.commit()
        print("User deleted successfully.")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python delete_user.py <email> <role>")
        sys.exit(1)
    
    email = sys.argv[1]
    role = sys.argv[2]
    delete_user(email, role)

"""
AdInquiry Model
"""
import uuid
from datetime import datetime
from backend.extensions import db
from sqlalchemy.dialects.postgresql import UUID

class AdInquiry(db.Model):
    """Stores advertising inquiries from potential partners."""
    __tablename__ = 'ad_inquiries'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = db.Column(db.Text, nullable=False)
    email = db.Column(db.Text, nullable=False)
    company_name = db.Column(db.Text)
    message = db.Column(db.Text, nullable=False)
    status = db.Column(db.String(20), default='pending') # pending, responded, rejected
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': str(self.id),
            'full_name': self.full_name,
            'email': self.email,
            'company_name': self.company_name,
            'message': self.message,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

"""
User Report Model
"""
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from backend.extensions import db

class Report(db.Model):
    """Model for reporting issues with requests or users"""
    __tablename__ = 'reports'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reporter_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    reported_user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    service_request_id = db.Column(db.Text, db.ForeignKey('service_requests.id', ondelete='SET NULL'), nullable=True)
    reason = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text, nullable=False)
    status = db.Column(db.Text, default='pending')  # pending, investigating, resolved, dismissed
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    resolved_at = db.Column(db.DateTime(timezone=True))
    admin_notes = db.Column(db.Text)
    
    # Relationships
    reporter = db.relationship('User', foreign_keys=[reporter_id], backref='reports_made')
    reported_user = db.relationship('User', foreign_keys=[reported_user_id], backref='reports_received')
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': str(self.id),
            'reporter_id': str(self.reporter_id),
            'reporter_email': self.reporter.email if self.reporter else None,
            'reported_user_id': str(self.reported_user_id) if self.reported_user_id else None,
            'reported_user_email': self.reported_user.email if self.reported_user else None,
            'service_request_id': self.service_request_id,
            'reason': self.reason,
            'description': self.description,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'admin_notes': self.admin_notes
        }

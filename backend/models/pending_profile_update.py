"""
Pending profile update (shadow) – proposed changes by an approved user; applied only after admin approval.
"""
import uuid
from datetime import datetime
from backend.extensions import db
from sqlalchemy.dialects.postgresql import UUID, JSONB


class PendingProfileUpdate(db.Model):
    """Proposed profile changes; applied to user when admin approves."""
    __tablename__ = 'pending_profile_updates'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    payload = db.Column(JSONB, nullable=False)  # proposed changes e.g. { "phone": "...", "driver_services": [...] }
    status = db.Column(db.Text, nullable=False, default='pending')  # pending | approved | rejected
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    reviewed_at = db.Column(db.DateTime(timezone=True), nullable=True)
    reviewed_by_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='SET NULL'), nullable=True)
    rejection_reason = db.Column(db.Text, nullable=True)

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'payload': self.payload,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None,
            'reviewed_by_id': str(self.reviewed_by_id) if self.reviewed_by_id else None,
            'rejection_reason': self.rejection_reason,
        }

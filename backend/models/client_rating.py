"""
Client rating and review model (drivers rate requesters after cab rides).
"""
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID
from backend.extensions import db


class ClientRating(db.Model):
    """Rating and text review for a client (requester) by a driver after a completed cab ride."""
    __tablename__ = 'client_ratings'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_request_id = db.Column(db.Text, db.ForeignKey('service_requests.id', ondelete='CASCADE'), nullable=False)
    client_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)  # requester
    rater_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)  # driver
    rating = db.Column(db.Integer, nullable=False)  # 1-5 stars
    review_text = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)

    __table_args__ = (
        db.CheckConstraint('rating >= 1 AND rating <= 5', name='client_rating_check_range'),
    )

    def to_dict(self):
        return {
            'id': str(self.id),
            'service_request_id': self.service_request_id,
            'client_id': str(self.client_id),
            'rater_id': str(self.rater_id),
            'rating': self.rating,
            'review_text': self.review_text,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

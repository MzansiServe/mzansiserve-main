"""
External API Log Model
"""
import uuid
from datetime import datetime
from sqlalchemy.dialects.postgresql import UUID, JSONB
from backend.extensions import db

class ExternalApiLog(db.Model):
    """Logs for external API integrations (Yoco, Google Maps, etc.)"""
    __tablename__ = 'external_api_logs'
    
    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider = db.Column(db.Text, nullable=False)  # 'yoco', 'google_maps', etc.
    endpoint = db.Column(db.Text, nullable=False)
    method = db.Column(db.Text, nullable=False)
    request_payload = db.Column(JSONB)
    response_payload = db.Column(JSONB)
    status_code = db.Column(db.Integer)
    error_message = db.Column(db.Text)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            'id': str(self.id),
            'provider': self.provider,
            'endpoint': self.endpoint,
            'method': self.method,
            'request_payload': self.request_payload,
            'response_payload': self.response_payload,
            'status_code': self.status_code,
            'error_message': self.error_message,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

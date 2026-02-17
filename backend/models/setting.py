"""
Application settings model
"""
from datetime import datetime

from backend.extensions import db


class AppSetting(db.Model):
    """Simple key/value store for configurable application settings."""

    __tablename__ = 'app_settings'

    key = db.Column(db.Text, primary_key=True)
    value = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow)
    updated_at = db.Column(db.DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'key': self.key,
            'value': self.value,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }




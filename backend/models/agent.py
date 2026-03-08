"""
Agent model – tracks agents; users can optionally select an agent at registration.
"""
import uuid
from backend.extensions import db
from sqlalchemy.dialects.postgresql import UUID


class Agent(db.Model):
    """Agent (e.g. support/sales); users may select one at registration."""
    __tablename__ = 'agents'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.Text, nullable=False)
    surname = db.Column(db.Text, nullable=False)
    id_number = db.Column(db.Text, nullable=True)
    agent_id = db.Column(db.Text, unique=True, nullable=False, index=True)  # display code e.g. AGT001
    phone = db.Column(db.Text, nullable=True)
    municipality = db.Column(db.Text, nullable=True)
    ward = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime(timezone=True), default=db.func.now())

    def to_dict(self):
        return {
            'id': str(self.id),
            'name': self.name,
            'surname': self.surname,
            'id_number': self.id_number,
            'agent_id': self.agent_id,
            'phone': self.phone,
            'municipality': self.municipality,
            'ward': self.ward,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }

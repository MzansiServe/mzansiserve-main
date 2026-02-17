"""
VehicleImage model – images linked to a driver's vehicle (by car index in driver_services).
"""
import uuid
from backend.extensions import db
from sqlalchemy.dialects.postgresql import UUID


class VehicleImage(db.Model):
    """Image for a driver's car; car_index is the index in user.data['driver_services']."""
    __tablename__ = 'vehicle_images'

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    car_index = db.Column(db.Integer, nullable=False)  # 0-based index into driver_services list
    image_url = db.Column(db.Text, nullable=False)  # e.g. /uploads/vehicle_xxx.jpg

    def to_dict(self):
        return {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'car_index': self.car_index,
            'image_url': self.image_url,
        }

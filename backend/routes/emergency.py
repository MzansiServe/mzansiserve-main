"""
Emergency Alert Routes
"""
import logging
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from backend.models import User
from backend.extensions import db
from backend.utils.response import success_response, error_response

bp = Blueprint('emergency', __name__)
logger = logging.getLogger(__name__)

@bp.route('/log', methods=['POST'])
@jwt_required()
def log_alert():
    """Log an emergency alert for analytics and tracking"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return error_response('USER_NOT_FOUND', 'User not found', None, 404)
        
    data = request.get_json()
    alert_type = data.get('alert_type')  # security, medical
    location = data.get('location', {})
    
    # In a real implementation, we would create an EmergencyAlert record in the DB
    # For now, we log it and return success
    logger.info(f"Emergency alert triggered by user {user_id}: {alert_type} at {location}")
    
    return success_response('Alert logged successfully', {
        'user_id': user_id,
        'alert_type': alert_type,
        'timestamp': data.get('timestamp')
    })

@bp.route('/config', methods=['GET'])
@jwt_required()
def get_config():
    """Return Aura configuration to the mobile app"""
    # This avoids hardcoding keys in the mobile app if we want to fetch them dynamically
    return success_response('Configuration fetched', {
        'aura_base_url': current_app.config.get('AURA_BASE_URL', 'https://panic.aura.services/panic-api/v2'),
        'aura_client_id': current_app.config.get('AURA_CLIENT_ID')
    })

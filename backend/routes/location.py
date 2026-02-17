"""
Location Routes
"""
from flask import Blueprint, request, current_app
import math

bp = Blueprint('location', __name__)

@bp.route('/calculate-distance', methods=['POST'])
def calculate_distance():
    """Calculate distance between two points"""
    try:
        data = request.json
        origin = data.get('origin', {})
        destination = data.get('destination', {})
        
        if not origin.get('lat') or not origin.get('lng') or \
           not destination.get('lat') or not destination.get('lng'):
            return {'success': False, 'error': 'Missing coordinates'}, 400
        
        # Haversine formula for distance calculation
        lat1, lon1 = float(origin['lat']), float(origin['lng'])
        lat2, lon2 = float(destination['lat']), float(destination['lng'])
        
        R = 6371  # Earth radius in kilometers
        
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        
        a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * \
            math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        distance = R * c
        
        return {
            'success': True,
            'data': {
                'distance': round(distance, 2),
                'unit': 'km'
            }
        }
        
    except Exception as e:
        current_app.logger.error(f"Calculate distance error: {str(e)}")
        return {'success': False, 'error': 'Failed to calculate distance'}, 500


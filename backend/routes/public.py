"""
Public Routes (No Authentication Required)
"""
from flask import Blueprint, current_app, request
from backend.models import CarouselItem
from backend.models.testimonial import Testimonial
from backend.models.landing_feature import LandingFeature
from backend.utils.response import success_response, error_response
from backend.services.pricing_service import PricingService
from datetime import datetime

bp = Blueprint('public', __name__)


@bp.route('/carousel', methods=['GET'])
def list_active_carousel():
    """List all active carousel items for the public landing page."""
    try:
        items = CarouselItem.query.filter_by(is_active=True).order_by(CarouselItem.order.asc(), CarouselItem.created_at.asc()).all()
        return success_response({
            'items': [item.to_dict() for item in items]
        })
    except Exception as e:
        current_app.logger.error(f"List public carousel error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to load carousel items', None, 500)


@bp.route('/testimonials', methods=['GET'])
def list_testimonials():
    """List all active testimonials for the public landing page."""
    try:
        items = Testimonial.query.filter_by(is_active=True).order_by(
            Testimonial.order.asc(), Testimonial.created_at.asc()
        ).all()
        return success_response({'testimonials': [t.to_dict() for t in items]})
    except Exception as e:
        current_app.logger.error(f"List testimonials error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to load testimonials', None, 500)


@bp.route('/landing-features', methods=['GET'])
def list_landing_features():
    """List all active landing features (Why Choose Us) for the public landing page."""
    try:
        items = LandingFeature.query.filter_by(is_active=True).order_by(
            LandingFeature.order.asc(), LandingFeature.created_at.asc()
        ).all()
        return success_response({'features': [f.to_dict() for f in items]})
    except Exception as e:
        current_app.logger.error(f"List landing features error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to load landing features', None, 500)


@bp.route('/landing', methods=['GET'])
def get_landing_data():
    """Combined endpoint — fetch all public landing page data in one call."""
    try:
        carousel = CarouselItem.query.filter_by(is_active=True).order_by(
            CarouselItem.order.asc(), CarouselItem.created_at.asc()
        ).all()
        testimonials = Testimonial.query.filter_by(is_active=True).order_by(
            Testimonial.order.asc(), Testimonial.created_at.asc()
        ).all()
        features = LandingFeature.query.filter_by(is_active=True).order_by(
            LandingFeature.order.asc(), LandingFeature.created_at.asc()
        ).all()
        return success_response({
            'carousel': [c.to_dict() for c in carousel],
            'testimonials': [t.to_dict() for t in testimonials],
            'features': [f.to_dict() for f in features],
        })
    except Exception as e:
        current_app.logger.error(f"Get landing data error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to load landing data', None, 500)


@bp.route('/maps-key', methods=['GET'])
def get_maps_key():
    """Returns the Google Maps API key for frontend usage."""
    try:
        key = current_app.config.get('GOOGLE_MAPS_API_KEY')
        if not key:
            return error_response('NOT_FOUND', 'Google Maps API key not configured', None, 404)
        return success_response({'key': key})
    except Exception as e:
        current_app.logger.error(f"Get maps key error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to retrieve maps key', None, 500)


@bp.route('/calculate-fare', methods=['GET'])
def calculate_fare():
    """Calculate trip fare based on distance and vehicle type."""
    try:
        distance = request.args.get('distance', type=float)
        car_type = request.args.get('car_type', default='sedan')
        
        if distance is None:
            return error_response('INVALID_INPUT', 'Distance is required', None, 400)
            
        # Use current time for time-based surcharges
        now = datetime.utcnow()
        fare = PricingService.calculate_trip_price(distance, now, car_type)
        
        return success_response({'fare': fare})
    except Exception as e:
        current_app.logger.error(f"Calculate fare error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to calculate fare', None, 500)

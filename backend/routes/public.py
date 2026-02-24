"""
Public Routes (No Authentication Required)
"""
from flask import Blueprint, current_app, request
from sqlalchemy import func
from backend.models import CarouselItem, User, ProfessionalRating, DriverRating, ProviderRating
from backend.models.testimonial import Testimonial
from backend.models.landing_feature import LandingFeature
from backend.models.footer_cms import FooterContent
from backend.extensions import db
from backend.utils.response import success_response, error_response
from backend.services.pricing_service import PricingService
from datetime import datetime

bp = Blueprint('public', __name__)


@bp.route('/top-providers', methods=['GET'])
def get_top_providers():
    """Returns top-rated verified professionals and drivers for the landing page."""
    try:
        limit = request.args.get('limit', load_default=3, type=int)
        
        # We need to aggregate across professional_ratings, driver_ratings, and provider_ratings
        # For simplicity in this implementation, let's fetch professionals with the highest professional_ratings
        # and drivers with the highest driver_ratings, then combine and sort.
        
        # Professional Ratings
        prof_stats = db.session.query(
            ProfessionalRating.professional_id,
            func.avg(ProfessionalRating.rating).label('avg_rating'),
            func.count(ProfessionalRating.id).label('review_count')
        ).group_by(ProfessionalRating.professional_id).subquery()
        
        top_profs = db.session.query(User, prof_stats.c.avg_rating, prof_stats.c.review_count).join(
            prof_stats, User.id == prof_stats.c.professional_id
        ).filter(User.is_approved == True).order_by(prof_stats.c.avg_rating.desc()).limit(limit).all()
        
        # Driver Ratings
        driver_stats = db.session.query(
            DriverRating.driver_id,
            func.avg(DriverRating.rating).label('avg_rating'),
            func.count(DriverRating.id).label('review_count')
        ).group_by(DriverRating.driver_id).subquery()
        
        top_drivers = db.session.query(User, driver_stats.c.avg_rating, driver_stats.c.review_count).join(
            driver_stats, User.id == driver_stats.c.driver_id
        ).filter(User.is_approved == True).order_by(driver_stats.c.avg_rating.desc()).limit(limit).all()
        
        # Combine and format
        result = []
        for user, avg, count in top_profs:
            d = user.to_dict()
            d['avg_rating'] = float(avg) if avg else 0
            d['review_count'] = count
            d['role_display'] = user.data.get('profession', user.role.capitalize())
            result.append(d)
            
        for user, avg, count in top_drivers:
            d = user.to_dict()
            d['avg_rating'] = float(avg) if avg else 0
            d['review_count'] = count
            d['role_display'] = "Premium Driver"
            result.append(d)
            
        # Re-sort by rating and limit
        result = sorted(result, key=lambda x: x['avg_rating'], reverse=True)[:limit]
        
        return success_response({'providers': result})
    except Exception as e:
        current_app.logger.error(f"Get top providers error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to load top providers', None, 500)


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
        car_type = request.args.get('car_type', load_default='sedan')
        
        if distance is None:
            return error_response('INVALID_INPUT', 'Distance is required', None, 400)
            
        # Use current time for time-based surcharges
        now = datetime.utcnow()
        fare = PricingService.calculate_trip_price(distance, now, car_type)
        
        return success_response({'fare': fare})
    except Exception as e:
        current_app.logger.error(f"Calculate fare error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to calculate fare', None, 500)


@bp.route('/footer', methods=['GET'])
def get_footer_details():
    """Returns the dynamic footer contact details from the CMS settings."""
    try:
        footer = FooterContent.query.get(1)
        if footer:
            return success_response({'footer': footer.to_dict()})
        else:
            return success_response({
                'footer': {
                    'company_name': 'MzansiServe',
                    'email': 'info@mzansiserve.co.za',
                    'phone': '+27 (0) 11 000 0000',
                    'physical_address': 'Johannesburg, Gauteng, South Africa'
                }
            })
    except Exception as e:
        current_app.logger.error(f"Get footer details error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to load footer details', None, 500)

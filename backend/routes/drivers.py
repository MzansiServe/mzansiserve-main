"""
Driver public profile and reviews (e.g. for "View all reviews").
"""
from flask import Blueprint, current_app
from flask_jwt_extended import get_jwt_identity
from sqlalchemy import func

from backend.extensions import db
from backend.models import User, DriverRating
from backend.utils.decorators import require_auth
from backend.utils.response import error_response, success_response

bp = Blueprint('drivers', __name__)


@bp.route('/<driver_id>/reviews', methods=['GET'])
@require_auth
def list_driver_reviews(driver_id):
    """List all reviews for a driver (for 'View all reviews' link)."""
    try:
        driver = User.query.get(driver_id)
        if not driver:
            return error_response('NOT_FOUND', 'Driver not found', None, 404)
        if driver.role != 'driver':
            return error_response('INVALID_REQUEST', 'User is not a driver', 400)
        pdata = driver.data or {}
        first = (pdata.get('full_name') or '').strip()
        last = (pdata.get('surname') or '').strip()
        driver_name = f"{first} {last}".strip() or 'Driver'
        agg = db.session.query(
            func.coalesce(func.avg(DriverRating.rating), 0),
            func.count(DriverRating.id)
        ).filter(DriverRating.driver_id == driver_id).first()
        avg_rating = round(float(agg[0]), 1) if agg and agg[0] is not None else None
        total = int(agg[1]) if agg and agg[1] is not None else 0
        reviews = DriverRating.query.filter_by(driver_id=driver_id).order_by(
            DriverRating.created_at.desc()
        ).all()
        return success_response({
            'driver': {
                'id': str(driver.id),
                'name': driver_name,
                'profile_image_url': driver.profile_image_url,
                'average_rating': avg_rating,
                'reviews_count': total,
            },
            'reviews': [r.to_dict() for r in reviews],
        })
    except Exception as e:
        current_app.logger.error(f"Driver reviews error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to load reviews', None, 500)

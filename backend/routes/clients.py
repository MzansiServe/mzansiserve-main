"""
Client (requester) public profile and reviews (e.g. for "View all reviews" by drivers).
"""
from flask import Blueprint, current_app
from sqlalchemy import func

from backend.extensions import db
from backend.models import User, ClientRating
from backend.utils.decorators import require_auth
from backend.utils.response import error_response, success_response

bp = Blueprint('clients', __name__)


@bp.route('/<client_id>/reviews', methods=['GET'])
@require_auth
def list_client_reviews(client_id):
    """List all reviews for a client (for 'View all reviews' link - drivers only)."""
    try:
        client = User.query.get(client_id)
        if not client:
            return error_response('NOT_FOUND', 'Client not found', None, 404)
        pdata = client.data or {}
        first = (pdata.get('full_name') or '').strip()
        last = (pdata.get('surname') or '').strip()
        client_name = f"{first} {last}".strip() or 'Client'
        agg = db.session.query(
            func.coalesce(func.avg(ClientRating.rating), 0),
            func.count(ClientRating.id)
        ).filter(ClientRating.client_id == client_id).first()
        avg_rating = round(float(agg[0]), 1) if agg and agg[0] is not None else None
        total = int(agg[1]) if agg and agg[1] is not None else 0
        reviews = ClientRating.query.filter_by(client_id=client_id).order_by(
            ClientRating.created_at.desc()
        ).all()
        return success_response({
            'client': {
                'id': str(client.id),
                'name': client_name,
                'profile_image_url': client.profile_image_url,
                'average_rating': avg_rating,
                'reviews_count': total,
            },
            'reviews': [r.to_dict() for r in reviews],
        })
    except Exception as e:
        current_app.logger.error(f"Client reviews error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to load reviews', None, 500)

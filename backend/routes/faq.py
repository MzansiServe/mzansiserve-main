"""
FAQ Routes
"""
from flask import Blueprint, request
from backend.extensions import db
from backend.models import FAQ
from backend.utils.response import error_response, success_response

bp = Blueprint('faq', __name__)


@bp.route('', methods=['GET'])
def get_faqs():
    """Get all active FAQs"""
    try:
        faqs = FAQ.query.filter_by(is_active=True).order_by(FAQ.order.asc(), FAQ.created_at.asc()).all()
        
        return success_response({
            'faqs': [faq.to_dict() for faq in faqs]
        })
        
    except Exception as e:
        return error_response('INTERNAL_ERROR', 'Failed to load FAQs', None, 500)

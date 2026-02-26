"""
Advertising Inquiry Routes
"""
from flask import Blueprint, request, current_app
from backend.models import AdInquiry
from backend.extensions import db
from backend.utils.response import success_response, error_response

bp = Blueprint('ads', __name__)

@bp.route('/inquiry', methods=['POST'])
def create_ad_inquiry():
    """Submit a new advertising inquiry"""
    try:
        data = request.json
        
        full_name = data.get('full_name')
        email = data.get('email')
        company_name = data.get('company_name')
        message = data.get('message')
        
        if not full_name or not email or not message:
            return error_response('INVALID_REQUEST', 'Full name, email and message are required', None, 400)
            
        new_inquiry = AdInquiry(
            full_name=full_name,
            email=email,
            company_name=company_name,
            message=message
        )
        
        db.session.add(new_inquiry)
        db.session.commit()
        
        return success_response(new_inquiry.to_dict(), 'Advertising inquiry submitted successfully. We will contact you soon.')
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Create ad inquiry error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to submit advertising inquiry', None, 500)

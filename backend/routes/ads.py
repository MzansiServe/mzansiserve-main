"""
Advertising Inquiry Routes
"""
from flask import Blueprint, request, current_app
from backend.models import AdInquiry, Advert
from backend.extensions import db
from backend.utils.response import success_response, error_response
from flask_jwt_extended import get_jwt_identity, jwt_required
import datetime

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


@bp.route('', methods=['GET'])
@jwt_required()
def get_user_adverts():
    """Get all adverts for the authenticated user"""
    try:
        user_id = get_jwt_identity()
        ads = Advert.query.filter_by(user_id=user_id).order_by(Advert.created_at.desc()).all()
        return success_response([ad.to_dict() for ad in ads])
    except Exception as e:
        current_app.logger.error(f"Get adverts error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to get adverts', None, 500)


@bp.route('', methods=['POST'])
@jwt_required()
def create_advert():
    """Create a new advert"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        title = data.get('title')
        image_url = data.get('image_url')
        target_url = data.get('target_url')
        placement_section = data.get('placement_section')
        
        if not title or not image_url or not target_url or not placement_section:
            return error_response('INVALID_REQUEST', 'Title, image URL, target URL, and placement section are required', None, 400)
            
        new_ad = Advert(
            user_id=user_id,
            title=title,
            image_url=image_url,
            target_url=target_url,
            placement_section=placement_section,
            status='pending'
        )
        
        db.session.add(new_ad)
        db.session.commit()
        return success_response(new_ad.to_dict(), 'Advert created successfully. Awaiting approval.')
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Create advert error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to create advert', None, 500)


@bp.route('/<ad_id>', methods=['PATCH'])
@jwt_required()
def update_advert(ad_id):
    """Update an advert (or change status like pause)"""
    try:
        user_id = get_jwt_identity()
        ad = Advert.query.filter_by(id=ad_id, user_id=user_id).first()
        if not ad:
            return error_response('NOT_FOUND', 'Advert not found', None, 404)
            
        data = request.json
        if 'title' in data: ad.title = data['title']
        if 'image_url' in data: ad.image_url = data['image_url']
        if 'target_url' in data: ad.target_url = data['target_url']
        if 'placement_section' in data: ad.placement_section = data['placement_section']
        if 'status' in data:
            # Users can only change to certain statuses like 'paused' or 'ended' themselves
            if data['status'] in ['paused', 'ended', 'pending']:
                ad.status = data['status']
                
        db.session.commit()
        return success_response(ad.to_dict(), 'Advert updated successfully')
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Update advert error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to update advert', None, 500)


@bp.route('/<ad_id>', methods=['DELETE'])
@jwt_required()
def delete_advert(ad_id):
    """Delete an advert"""
    try:
        user_id = get_jwt_identity()
        ad = Advert.query.filter_by(id=ad_id, user_id=user_id).first()
        if not ad:
            return error_response('NOT_FOUND', 'Advert not found', None, 404)
            
        db.session.delete(ad)
        db.session.commit()
        return success_response(None, 'Advert deleted successfully')
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Delete advert error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to delete advert', None, 500)


@bp.route('/active', methods=['GET'])
def get_active_adverts():
    """Get active adverts, optionally filtered by placement section"""
    try:
        placement = request.args.get('placement_section')
        query = Advert.query.filter_by(status='active')
        if placement:
            query = query.filter_by(placement_section=placement)
            
        # Optional: Add timezone check for start_date and end_date
        now = datetime.datetime.utcnow()
        query = query.filter((Advert.start_date == None) | (Advert.start_date <= now))
        query = query.filter((Advert.end_date == None) | (Advert.end_date >= now))
        
        ads = query.order_by(db.func.random()).limit(10).all() # Simple randomization
        
        # Track impressions
        for ad in ads:
            ad.impressions += 1
        db.session.commit()
        
        return success_response([ad.to_dict() for ad in ads])
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Get active adverts error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to get active adverts', None, 500)


@bp.route('/<ad_id>/click', methods=['POST'])
def record_advert_click(ad_id):
    """Record a click on an advert"""
    try:
        ad = Advert.query.get(ad_id)
        if ad:
            ad.clicks += 1
            db.session.commit()
            return success_response({'target_url': ad.target_url})
        return error_response('NOT_FOUND', 'Advert not found', None, 404)
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Record click error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to record click', None, 500)

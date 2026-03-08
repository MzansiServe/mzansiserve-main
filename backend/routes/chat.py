"""
Chat Routes
"""
from flask import Blueprint, request, current_app
from flask_jwt_extended import get_jwt_identity
from backend.models import ChatMessage, ServiceRequest, User
from backend.extensions import db
from backend.utils.response import success_response, error_response
from backend.utils.decorators import require_auth

bp = Blueprint('chat', __name__)

@bp.route('/inbox', methods=['GET'])
@require_auth
def get_inbox():
    """Get all chat conversations for the current user"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return error_response('UNAUTHORIZED', 'User not found', None, 401)
            
        # 1. Find all request_ids where the user has sent or received a message
        message_subquery = db.session.query(ChatMessage.request_id).filter(
            db.or_(
                ChatMessage.sender_id == user_id,
                ChatMessage.recipient_id == user_id
            )
        ).distinct()
        
        # 2. Find all ServiceRequests that are inquiries OR that contain messages for this user
        # ServiceRequests might have 'Chat Inquiry' in their details['notes']
        requests = ServiceRequest.query.filter(
            db.or_(
                ServiceRequest.requester_id == user_id,
                ServiceRequest.provider_id == user_id
            )
        ).filter(
            db.or_(
                ServiceRequest.id.in_(message_subquery),
                ServiceRequest.details['notes'].astext == 'Chat Inquiry'
            )
        ).all()
        
        inbox = []
        for r in requests:
            other_user_id = r.requester_id if str(r.provider_id) == str(user_id) else r.provider_id
            other_user = User.query.get(other_user_id) if other_user_id else None
            
            latest_message = ChatMessage.query.filter_by(request_id=r.id).order_by(ChatMessage.created_at.desc()).first()
            unread_count = ChatMessage.query.filter_by(request_id=r.id, recipient_id=user_id, is_read=False).count()
            
            # Safe service name access (no 'service' relationship on ServiceRequest)
            service_name = r.details.get('service_name') or r.details.get('type') or 'Service Request'
            if r.details.get('notes') == 'Chat Inquiry':
                job_title = 'Chat Inquiry'
            else:
                job_title = service_name
                
            inbox.append({
                'request_id': r.id,
                'job_title': job_title,
                'status': r.status,
                'other_user': {
                    'id': str(other_user.id),
                    'name': other_user.data.get('full_name', 'User') if other_user.data else 'User',
                    'avatar': other_user.profile_image_url
                } if other_user else None,
                'latest_message': latest_message.to_dict() if latest_message else None,
                'unread_count': unread_count,
                'updated_at': latest_message.created_at.isoformat() if latest_message else r.updated_at.isoformat()
            })
            
        # Sort inbox by updated_at descending
        inbox.sort(key=lambda x: x['updated_at'], reverse=True)
        return success_response(inbox)
        
    except Exception as e:
        current_app.logger.error(f"Get inbox error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to get inbox', None, 500)

@bp.route('/<request_id>', methods=['GET'])
@require_auth
def get_messages(request_id):
    """Get all messages for a specific request"""
    try:
        user_id = get_jwt_identity()
        
        # Verify user is part of this request
        service_request = ServiceRequest.query.get(request_id)
        if not service_request:
            return error_response('NOT_FOUND', 'Service request not found', None, 404)
            
        if str(service_request.requester_id) != user_id and str(service_request.provider_id) != user_id:
            return error_response('FORBIDDEN', 'Access denied', None, 403)
            
        messages = ChatMessage.query.filter_by(request_id=request_id)\
            .order_by(ChatMessage.created_at.asc()).all()
            
        return success_response([m.to_dict() for m in messages])
        
    except Exception as e:
        current_app.logger.error(f"Get messages error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to get messages', None, 500)

@bp.route('/<request_id>', methods=['POST'])
@require_auth
def send_message(request_id):
    """Send a new message for a request"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        message_text = data.get('message')
        
        if not message_text:
            return error_response('INVALID_REQUEST', 'Message content is required', None, 400)
            
        # Verify user is part of this request and get recipient
        service_request = ServiceRequest.query.get(request_id)
        if not service_request:
            return error_response('NOT_FOUND', 'Service request not found', None, 404)
            
        recipient_id = None
        if str(service_request.requester_id) == user_id:
            recipient_id = service_request.provider_id
        elif str(service_request.provider_id) == user_id:
            recipient_id = service_request.requester_id
            
        if not recipient_id:
            return error_response('FORBIDDEN', 'No recipient available for this request', None, 403)
            
        new_message = ChatMessage(
            request_id=request_id,
            sender_id=user_id,
            recipient_id=recipient_id,
            message=message_text
        )
        
        db.session.add(new_message)
        db.session.commit()
        
        return success_response(new_message.to_dict(), 'Message sent successfully')
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Send message error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to send message', None, 500)

@bp.route('/<request_id>/read', methods=['PATCH'])
@require_auth
def mark_read(request_id):
    """Mark all messages in a request as read for the current user"""
    try:
        user_id = get_jwt_identity()
        
        ChatMessage.query.filter_by(request_id=request_id, recipient_id=user_id, is_read=False)\
            .update({'is_read': True})
            
        db.session.commit()
        return success_response(None, 'Messages marked as read')
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Mark read error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to update messages', None, 500)
@bp.route('/initialize-ad-chat', methods=['POST'])
@require_auth
def initialize_ad_chat():
    """Find or create a ServiceRequest context for a marketplace ad chat"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        ad_id = data.get('ad_id')
        
        if not ad_id:
            return error_response('INVALID_REQUEST', 'Ad ID is required', None, 400)
            
        from backend.models import MarketplaceAd, ServiceRequest
        ad = MarketplaceAd.query.get(ad_id)
        if not ad:
            return error_response('NOT_FOUND', 'Ad not found', None, 404)
            
        if str(ad.user_id) == user_id:
            return error_response('INVALID_REQUEST', 'You cannot message yourself', None, 400)
            
        # Check if an inquiry already exists between these two for this ad
        # We store ad_id in details to differentiate chats for different ads between same users
        existing_request = ServiceRequest.query.filter(
            ServiceRequest.requester_id == user_id,
            ServiceRequest.provider_id == ad.user_id,
            ServiceRequest.details['ad_id'].astext == ad.id
        ).first()
        
        if existing_request:
            return success_response({
                'request_id': existing_request.id,
                'recipient_name': ad.user.data.get('full_name', 'Seller') if ad.user and ad.user.data else 'Seller'
            })
            
        # Create a new inquiry (using 'professional' type as it has few constraints and no wallet deduction)
        import secrets
        request_id = f"REQ-CHAT-{secrets.token_hex(6).upper()}"
        
        new_request = ServiceRequest(
            id=request_id,
            request_type='professional',
            status='pending',
            requester_id=user_id,
            provider_id=ad.user_id,
            details={
                'notes': 'Chat Inquiry',
                'ad_id': ad.id,
                'ad_title': ad.title,
                'is_marketplace_chat': True
            },
            payment_status='paid', # Marked as paid to avoid blocking the chat
            payment_amount=0
        )
        
        db.session.add(new_request)
        db.session.commit()
        
        return success_response({
            'request_id': request_id,
            'recipient_name': ad.user.data.get('full_name', 'Seller') if ad.user and ad.user.data else 'Seller'
        }, 'Chat initialized successfully', 201)
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Initialize ad chat error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to initialize chat', None, 500)

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

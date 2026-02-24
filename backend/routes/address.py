"""
Address Routes
"""
from flask import Blueprint, request, current_app
from backend.models import DeliveryAddress, User
from backend.extensions import db
from backend.utils.response import success_response, error_response
from backend.utils.decorators import require_auth
from marshmallow import Schema, fields, ValidationError

bp = Blueprint('address', __name__)

class AddressSchema(Schema):
    street_address = fields.Str(required=True)
    city = fields.Str(required=True)
    province = fields.Str(required=True)
    postal_code = fields.Str(required=True)
    country = fields.Str(load_default='South Africa')
    unit_number = fields.Str(allow_none=True)
    building_name = fields.Str(allow_none=True)
    delivery_instructions = fields.Str(allow_none=True)
    is_default = fields.Bool(load_default=False)

@bp.route('', methods=['GET'])
@require_auth
def list_addresses():
    """List user's delivery addresses"""
    try:
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
        
        addresses = DeliveryAddress.query.filter_by(user_id=user_id).order_by(
            DeliveryAddress.is_default.desc(),
            DeliveryAddress.created_at.desc()
        ).all()
        
        return success_response({
            'addresses': [a.to_dict() for a in addresses]
        })
        
    except Exception as e:
        current_app.logger.error(f"List addresses error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to list addresses', None, 500)

@bp.route('', methods=['POST'])
@require_auth
def create_address():
    """Create a new delivery address"""
    try:
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
        
        schema = AddressSchema()
        data = schema.load(request.json)
        
        # If this is set as default, unset other defaults
        if data.get('is_default'):
            DeliveryAddress.query.filter_by(user_id=user_id, is_load_default=True).update({'is_default': False})
            db.session.commit()
        
        address = DeliveryAddress(
            user_id=user_id,
            **data
        )
        
        db.session.add(address)
        db.session.commit()
        
        return success_response(address.to_dict(), 'Address created successfully', 201)
        
    except ValidationError as e:
        return error_response('VALIDATION_ERROR', 'Invalid input data', e.messages, 400)
    except Exception as e:
        current_app.logger.error(f"Create address error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to create address', None, 500)

@bp.route('/<address_id>', methods=['GET'])
@require_auth
def get_address(address_id):
    """Get delivery address by ID"""
    try:
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
        
        address = DeliveryAddress.query.get(address_id)
        
        if not address:
            return error_response('NOT_FOUND', 'Address not found', None, 404)
        
        if str(address.user_id) != user_id:
            return error_response('FORBIDDEN', 'Access denied', None, 403)
        
        return success_response(address.to_dict())
        
    except Exception as e:
        current_app.logger.error(f"Get address error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to get address', None, 500)

@bp.route('/<address_id>', methods=['PATCH'])
@require_auth
def update_address(address_id):
    """Update delivery address"""
    try:
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
        
        address = DeliveryAddress.query.get(address_id)
        
        if not address:
            return error_response('NOT_FOUND', 'Address not found', None, 404)
        
        if str(address.user_id) != user_id:
            return error_response('FORBIDDEN', 'Access denied', None, 403)
        
        schema = AddressSchema(partial=True)
        data = schema.load(request.json)
        
        # If this is set as default, unset other defaults
        if data.get('is_default') and not address.is_default:
            DeliveryAddress.query.filter_by(user_id=user_id, is_load_default=True).update({'is_default': False})
        
        for key, value in data.items():
            setattr(address, key, value)
        
        db.session.commit()
        
        return success_response(address.to_dict(), 'Address updated successfully')
        
    except ValidationError as e:
        return error_response('VALIDATION_ERROR', 'Invalid input data', e.messages, 400)
    except Exception as e:
        current_app.logger.error(f"Update address error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to update address', None, 500)

@bp.route('/<address_id>', methods=['DELETE'])
@require_auth
def delete_address(address_id):
    """Delete delivery address"""
    try:
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
        
        address = DeliveryAddress.query.get(address_id)
        
        if not address:
            return error_response('NOT_FOUND', 'Address not found', None, 404)
        
        if str(address.user_id) != user_id:
            return error_response('FORBIDDEN', 'Access denied', None, 403)
        
        db.session.delete(address)
        db.session.commit()
        
        return success_response(None, 'Address deleted successfully')
        
    except Exception as e:
        current_app.logger.error(f"Delete address error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to delete address', None, 500)

@bp.route('/<address_id>/set-default', methods=['PATCH'])
@require_auth
def set_default_address(address_id):
    """Set address as default"""
    try:
        from flask_jwt_extended import get_jwt_identity
        user_id = get_jwt_identity()
        
        address = DeliveryAddress.query.get(address_id)
        
        if not address:
            return error_response('NOT_FOUND', 'Address not found', None, 404)
        
        if str(address.user_id) != user_id:
            return error_response('FORBIDDEN', 'Access denied', None, 403)
        
        # Unset other defaults
        DeliveryAddress.query.filter_by(user_id=user_id, is_load_default=True).update({'is_default': False})
        
        # Set this as default
        address.is_default = True
        db.session.commit()
        
        return success_response(address.to_dict(), 'Default address updated successfully')
        
    except Exception as e:
        current_app.logger.error(f"Set default address error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to set default address', None, 500)


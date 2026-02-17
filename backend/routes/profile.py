"""
Profile Routes
"""
import os
import uuid
import json
from werkzeug.utils import secure_filename
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import Schema, ValidationError, fields
from backend.models import Payment, User, PendingProfileUpdate
from backend.extensions import db
from backend.utils.response import success_response, error_response
from backend.utils.decorators import require_auth
from backend.utils.auth import validate_sa_id
from backend.services.payment_service import PaymentService

bp = Blueprint('profile', __name__)

# Registration fee amount in cents (e.g., 10000 = R100.00)
REGISTRATION_FEE_AMOUNT = 10000  # R100.00

# After approval, only these profile fields may be changed (and require admin approval to apply)
ALLOWED_AFTER_APPROVAL_COMMON = {'phone', 'next_of_kin'}
ALLOWED_AFTER_APPROVAL_BY_ROLE = {
    'driver': {'driver_services', 'proof_of_residence_url', 'driver_license_url'},
    'service-provider': {'provider_services', 'proof_of_residence_url', 'driver_license_url'},
    'professional': {
        'professional_services', 'proof_of_residence_url', 'highest_qualification',
        'professional_body', 'qualification_urls'
    },
    'client': set(),
}

class NextOfKinSchema(Schema):
    full_name = fields.Str(allow_none=True, missing=None)
    contact_number = fields.Str(allow_none=True, missing=None)
    contact_email = fields.Email(allow_none=True, missing=None)


class ServiceSchema(Schema):
    """Represents a service offered by a professional or service provider."""

    name = fields.Str(required=True)
    description = fields.Str(allow_none=True, missing=None)
    # Hourly rate is mainly for professionals; optional for service providers.
    hourly_rate = fields.Float(allow_none=True, missing=None)


class DriverServiceSchema(Schema):
    """Represents a driver's car/service offering."""

    car_make = fields.Str(required=True)
    car_model = fields.Str(required=True)
    car_year = fields.Int(allow_none=True, missing=None)
    registration_number = fields.Str(allow_none=True, missing=None)
    car_type = fields.Str(required=True)  # standard, premium, suv; pricing is admin-configured


class UpdateProfileSchema(Schema):
    full_name = fields.Str(allow_none=True, missing=None)
    surname = fields.Str(allow_none=True, missing=None)
    phone = fields.Str(allow_none=True, missing=None)
    gender = fields.Str(allow_none=True, missing=None)
    sa_citizen = fields.Bool(allow_none=True, missing=False)
    sa_id = fields.Str(allow_none=True, missing=None)
    next_of_kin = fields.Nested(NextOfKinSchema, allow_none=True, missing=None)
    # Professional metadata
    highest_qualification = fields.Str(allow_none=True, missing=None)
    professional_body = fields.Str(allow_none=True, missing=None)
    # Role-specific fields
    professional_services = fields.List(fields.Nested(ServiceSchema), allow_none=True, missing=None)
    provider_services = fields.List(fields.Nested(ServiceSchema), allow_none=True, missing=None)
    driver_services = fields.List(fields.Nested(DriverServiceSchema), allow_none=True, missing=None)

@bp.route('', methods=['GET'])
@require_auth
def get_profile():
    """Get current user profile"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return error_response('USER_NOT_FOUND', 'User not found', None, 404)
        
        # Get ID document URL if exists
        id_document_url = None
        if user.file_urls and len(user.file_urls) > 0:
            # Assuming first file is ID document (can be improved with file type tracking)
            id_document_url = user.file_urls[0] if isinstance(user.file_urls, list) else None
        
        selected_agent_id = user.agent.agent_id if user.agent else None
        pending = PendingProfileUpdate.query.filter_by(
            user_id=user.id, status='pending'
        ).order_by(PendingProfileUpdate.created_at.desc()).first()
        pending_update = pending.to_dict() if pending else None
        return success_response({
            'user': user.to_dict(),
            'profile_data': user.data or {},
            'registration_fee_paid': user.is_paid,
            'id_verification_status': user.id_verification_status,
            'id_rejection_reason': user.id_rejection_reason,
            'id_document_url': id_document_url,
            'selected_agent_id': selected_agent_id,
            'pending_profile_update': pending_update,
        })
        
    except Exception as e:
        current_app.logger.error(f"Get profile error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to get profile', None, 500)

def allowed_file(filename):
    """Check if file extension is allowed"""
    ALLOWED_EXTENSIONS = {'pdf', 'jpg', 'jpeg', 'png'}
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def allowed_image_file(filename):
    """Check if file is an allowed image for profile photo"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'jpg', 'jpeg', 'png'}

@bp.route('', methods=['PATCH'])
@require_auth
def update_profile():
    """Update user profile. Users cannot update or upload documents until their account is approved."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return error_response('USER_NOT_FOUND', 'User not found', None, 404)
        if not user.is_approved:
            return error_response(
                'NOT_APPROVED',
                'Your account is pending approval. You can view your profile but cannot make changes or upload documents until your account is approved.',
                None,
                403
            )
        schema = UpdateProfileSchema()
        
        # Handle both JSON and form-data requests
        if request.content_type and 'multipart/form-data' in request.content_type:
            # Handle form-data (with file upload)
            request_data = {}
            # Get text fields from form
            for key in ['full_name', 'surname', 'phone', 'gender', 'sa_id', 'highest_qualification', 'professional_body']:
                if key in request.form:
                    request_data[key] = request.form[key] or None
            
            # Handle sa_citizen checkbox
            if 'sa_citizen' in request.form:
                request_data['sa_citizen'] = request.form['sa_citizen'].lower() in ('true', '1', 'on')
            else:
                request_data['sa_citizen'] = False
            
            # Handle next_of_kin from form data (JSON string)
            if 'next_of_kin' in request.form:
                try:
                    next_of_kin_str = request.form['next_of_kin']
                    if next_of_kin_str:
                        request_data['next_of_kin'] = json.loads(next_of_kin_str)
                    else:
                        request_data['next_of_kin'] = None
                except (json.JSONDecodeError, ValueError):
                    request_data['next_of_kin'] = None
            
            # Handle role-specific services from form data (JSON strings)
            for service_key in ['professional_services', 'provider_services', 'driver_services']:
                if service_key in request.form:
                    try:
                        service_str = request.form[service_key]
                        if service_str:
                            request_data[service_key] = json.loads(service_str)
                        else:
                            request_data[service_key] = None
                    except (json.JSONDecodeError, ValueError):
                        request_data[service_key] = None
        else:
            # Handle JSON request
            request_data = request.json or {}
        # Convert empty strings to None for optional fields
        for key in ['full_name', 'surname', 'phone', 'gender', 'sa_id', 'highest_qualification', 'professional_body']:
            if key in request_data and request_data[key] == '':
                request_data[key] = None
        
        # Handle next_of_kin object - convert empty strings in nested object
        if 'next_of_kin' in request_data:
            if isinstance(request_data['next_of_kin'], dict):
                for kin_key in ['full_name', 'contact_number', 'contact_email']:
                    if kin_key in request_data['next_of_kin'] and request_data['next_of_kin'][kin_key] == '':
                        request_data['next_of_kin'][kin_key] = None
            elif request_data['next_of_kin'] == '':
                request_data['next_of_kin'] = None
        
        data = schema.load(request_data)
        current_app.logger.info(f"Profile update data: {data}")

        # After approval: only allowed fields may be changed; changes go to pending (shadow) until admin approves
        allowed_keys = ALLOWED_AFTER_APPROVAL_COMMON | ALLOWED_AFTER_APPROVAL_BY_ROLE.get(user.role, set())
        # Reject if any key in request is not allowed
        form_keys = set(request_data.keys())
        disallowed = form_keys - allowed_keys
        if disallowed:
            return error_response(
                'DISALLOWED_FIELDS',
                f'After approval, only certain fields can be updated. Disallowed: {", ".join(sorted(disallowed))}.',
                None,
                400
            )
        if PendingProfileUpdate.query.filter_by(user_id=user.id, status='pending').first():
            return error_response(
                'PENDING_EXISTS',
                'You already have pending changes awaiting admin approval.',
                None,
                400
            )
        upload_folder = current_app.config.get('UPLOAD_FOLDER')
        if upload_folder and not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        payload = {}
        if 'phone' in data and data['phone'] is not None:
            payload['phone'] = data['phone']
        if 'next_of_kin' in data:
            payload['next_of_kin'] = data['next_of_kin']
        for key in ('driver_services', 'professional_services', 'provider_services', 'highest_qualification', 'professional_body'):
            if key in allowed_keys and key in data and data[key] is not None:
                payload[key] = data[key]
        if 'qualification_urls' in allowed_keys and data.get('qualification_urls') is not None:
            payload['qualification_urls'] = data['qualification_urls']
        # File uploads: save and add URLs to payload
        if 'proof_of_residence' in request.files:
            file = request.files['proof_of_residence']
            if file and file.filename and allowed_file(file.filename):
                file_ext = file.filename.rsplit('.', 1)[1].lower()
                unique_filename = f"{str(user.id)}_proof_pending_{uuid.uuid4().hex[:8]}.{file_ext}"
                filepath = os.path.join(upload_folder, unique_filename)
                file.save(filepath)
                payload['proof_of_residence_url'] = f"/uploads/{unique_filename}"
        if 'drivers_license_document' in request.files:
            file = request.files['drivers_license_document']
            if file and file.filename and allowed_file(file.filename):
                file_ext = file.filename.rsplit('.', 1)[1].lower()
                unique_filename = f"{str(user.id)}_license_pending_{uuid.uuid4().hex[:8]}.{file_ext}"
                filepath = os.path.join(upload_folder, unique_filename)
                file.save(filepath)
                payload['driver_license_url'] = f"/uploads/{unique_filename}"
        if 'qualification_documents' in request.files:
            files = request.files.getlist('qualification_documents')
            qual_urls = []
            for file in files:
                if file and file.filename and allowed_file(file.filename):
                    file_ext = file.filename.rsplit('.', 1)[1].lower()
                    unique_filename = f"{str(user.id)}_qual_pending_{uuid.uuid4().hex[:8]}.{file_ext}"
                    filepath = os.path.join(upload_folder, unique_filename)
                    file.save(filepath)
                    qual_urls.append(f"/uploads/{unique_filename}")
            if qual_urls:
                payload['qualification_urls'] = qual_urls
        if not payload:
            return error_response('NO_CHANGES', 'No allowed changes provided.', None, 400)
        pending = PendingProfileUpdate(user_id=user.id, payload=payload, status='pending')
        db.session.add(pending)
        db.session.commit()
        return success_response(
            {'pending_id': str(pending.id)},
            'Changes submitted for admin approval. You will be notified when they are applied.'
        )
        
    except ValidationError as e:
        current_app.logger.error(f"Validation error: {e.messages}")
        return error_response('VALIDATION_ERROR', 'Invalid input data', e.messages, 400)
    except Exception as e:
        current_app.logger.error(f"Update profile error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to update profile', None, 500)


@bp.route('/professionals', methods=['GET'])
@require_auth
def list_professionals():
    """
    List professionals, including their services and hourly rates.

    Query params:
      - search: filter by service name/description (case-insensitive, contains)
      - order_by: 'rate' to sort by minimum hourly_rate across services
      - direction: 'asc' (default) or 'desc'
    """
    try:
        search = (request.args.get('search') or '').strip().lower()
        order_by = request.args.get('order_by')
        direction = request.args.get('direction', 'asc').lower()

        # Base query: active, approved, paid professionals
        query = User.query.filter_by(role='professional', is_active=True, is_approved=True, is_paid=True)
        professionals = query.all()

        results = []
        for prof in professionals:
            services = (prof.data or {}).get('professional_services') or []

            # Optionally filter by search text against service name/description
            filtered_services = []
            for svc in services:
                name = (svc.get('name') or '').lower()
                desc = (svc.get('description') or '').lower()
                if not search or search in name or search in desc:
                    filtered_services.append(svc)

            if not filtered_services:
                # Skip professionals without matching services
                if search:
                    continue

            # Compute minimum hourly rate across services (if any)
            min_rate = None
            for svc in filtered_services:
                try:
                    rate = svc.get('hourly_rate')
                    if rate is None:
                        continue
                    rate_val = float(rate)
                    if min_rate is None or rate_val < min_rate:
                        min_rate = rate_val
                except (TypeError, ValueError):
                    continue

            results.append(
                {
                    'professional': prof.to_dict(),
                    'services': filtered_services,
                    'min_hourly_rate': min_rate,
                }
            )

        # Sort by minimum hourly rate if requested
        if order_by == 'rate':
            reverse = direction == 'desc'

            def sort_key(item):
                # Place professionals without a rate at the end
                return (item['min_hourly_rate'] is None, item['min_hourly_rate'] or 0.0)

            results.sort(key=sort_key, reverse=reverse)

        return success_response({'professionals': results})

    except Exception as e:
        current_app.logger.error(f"List professionals error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to list professionals', None, 500)

@bp.route('/service-providers', methods=['GET'])
@require_auth
def list_service_providers():
    """
    List service providers, including their services.
    Query params:
      - search: filter by service name/description (case-insensitive, contains)
    """
    try:
        search = (request.args.get('search') or '').strip().lower()

        # Base query: active, approved, paid service providers
        query = User.query.filter_by(role='service-provider', is_active=True, is_approved=True, is_paid=True)
        providers = query.all()

        results = []
        for provider in providers:
            services = (provider.data or {}).get('provider_services') or []

            # Optionally filter by search text against service name/description
            filtered_services = []
            for svc in services:
                name = (svc.get('name') or '').lower()
                desc = (svc.get('description') or '').lower()
                if not search or search in name or search in desc:
                    filtered_services.append(svc)

            if not filtered_services:
                # Skip providers without matching services
                if search:
                    continue

            results.append(
                {
                    'provider': provider.to_dict(),
                    'services': filtered_services,
                }
            )

        return success_response({'service_providers': results})

    except Exception as e:
        current_app.logger.error(f"List service providers error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to list service providers', None, 500)

@bp.route('/pay-registration-fee', methods=['POST'])
@require_auth
def pay_registration_fee():
    """Create Yoco checkout for registration fee payment"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return error_response('USER_NOT_FOUND', 'User not found', None, 404)
        
        # Check if user already paid
        if user.is_paid:
            return error_response('ALREADY_PAID', 'Registration fee already paid', None, 400)
        
        # Generate external_id for tracking this payment (format: reg_fee_{user_id_hex}_{random_hex})
        # Convert user.id (UUID) to hex for easier parsing
        user_id_hex = str(user.id).replace('-', '')
        external_id = f"reg_fee_{user_id_hex}_{uuid.uuid4().hex[:8]}"
        
        # Create checkout session
        base_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5000')
        checkout_result = PaymentService.create_checkout(
            amount=REGISTRATION_FEE_AMOUNT,
            currency='ZAR',
            external_id=external_id,
            success_url=f"{base_url}/api/profile/payment-callback?callback_status=success&external_id={external_id}",
            cancel_url=f"{base_url}/api/profile/payment-callback?callback_status=cancel&external_id={external_id}",
            failure_url=f"{base_url}/api/profile/payment-callback?callback_status=failure&external_id={external_id}"
        )
        
        return success_response({
            'redirect_url': checkout_result['redirect_url'],
            'checkout_id': checkout_result['checkout_id'],
            'external_id': external_id
        })
        
    except ValueError as e:
        return error_response('INVALID_REQUEST', str(e), None, 400)
    except Exception as e:
        current_app.logger.error(f"Pay registration fee error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to create checkout', None, 500)

@bp.route('/payment-callback', methods=['GET'])
def payment_callback():
    """Handle payment callback from Yoco"""
    try:
        callback_status = request.args.get('callback_status')
        external_id = request.args.get('external_id')
        
        current_app.logger.info(f"Payment callback received: status={callback_status}, external_id={external_id}")
        
        # Only process success callbacks
        if callback_status != 'success':
            # Redirect to profile with error message
            return current_app.make_response((
                f'<html><body><script>window.location.href="/profile?payment=error";</script></body></html>',
                302
            ))
        
        if not external_id:
            return current_app.make_response((
                f'<html><body><script>window.location.href="/profile?payment=error";</script></body></html>',
                302
            ))
        
        # Find payment by external_id
        payment = Payment.query.filter_by(external_id=external_id).first()
        if not payment:
            current_app.logger.error(f"Payment not found for external_id: {external_id}")
            return current_app.make_response((
                f'<html><body><script>window.location.href="/profile?payment=error";</script></body></html>',
                302
            ))
        
        # Extract user_id from external_id (format: reg_fee_{user_id_hex}_{random_hex})
        if external_id.startswith('reg_fee_'):
            # Extract user_id_hex (after 'reg_fee_', before last '_')
            parts = external_id.split('_')
            if len(parts) >= 4:
                # user_id_hex is between 'reg', 'fee', and the random hex
                user_id_hex = '_'.join(parts[2:-1])  # Get everything between 'reg', 'fee' and last part
            else:
                user_id_hex = parts[2] if len(parts) > 2 else None
            
            if user_id_hex:
                try:
                    # Convert hex string back to UUID (format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
                    user_id_hex_clean = user_id_hex.replace('-', '')
                    if len(user_id_hex_clean) == 32:
                        user_id_str = f"{user_id_hex_clean[:8]}-{user_id_hex_clean[8:12]}-{user_id_hex_clean[12:16]}-{user_id_hex_clean[16:20]}-{user_id_hex_clean[20:32]}"
                        user_id = uuid.UUID(user_id_str)
                        user = User.query.get(user_id)
                        
                        if user:
                            # Verify payment and update user
                            if payment.status == 'pending' and payment.amount * 100 >= REGISTRATION_FEE_AMOUNT:
                                user.is_paid = True
                                payment.status = 'completed'
                                db.session.commit()
                                current_app.logger.info(f"User {user.id} registration fee paid successfully")
                                
                                # Redirect to profile with success message
                                return current_app.make_response((
                                    f'<html><body><script>window.location.href="/profile?payment=success";</script></body></html>',
                                    302
                                ))
                            else:
                                current_app.logger.warning(f"Payment verification failed for user {user.id}")
                except (ValueError, IndexError) as e:
                    current_app.logger.error(f"Error parsing user_id from external_id: {e}")
        
        # Redirect to profile with error message
        return current_app.make_response((
            f'<html><body><script>window.location.href="/profile?payment=error";</script></body></html>',
            302
        ))
        
    except Exception as e:
        current_app.logger.error(f"Payment callback error: {str(e)}")
        return current_app.make_response((
            f'<html><body><script>window.location.href="/profile?payment=error";</script></body></html>',
            302
        ))


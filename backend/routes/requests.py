"""
Service Request Routes
"""
import math
import secrets
from datetime import datetime

from flask import Blueprint, request, current_app
from flask_jwt_extended import get_jwt_identity
from marshmallow import Schema, ValidationError, fields, validate
from sqlalchemy import and_, or_, func

from backend.extensions import db
from backend.models import AppSetting, Payment, ServiceRequest, User, Wallet, DriverRating, ClientRating, ProfessionalRating, ProviderRating
from backend.services.wallet_service import WalletService
from backend.services.payment_service import PaymentService
from backend.utils.decorators import require_auth, require_role
from backend.utils.response import error_response, success_response

bp = Blueprint('requests', __name__)


# --- Cab pricing configuration helpers ---

# Base price per kilometer for different car types (Rands per km)
CAR_TYPE_BASE_RATE_PER_KM = {
    # Sensible defaults – can be overridden by admin functionality later
    'small_hatchback': 8.12,
    'sedan': 8.44,
    'suv': 8.92,
    'bakkie': 9.40,
    'luxury': 11.80,
    'hybrid': 7.80,
    'electric': 6.52,
}


def _get_rate_per_km(preferences: dict) -> float:
    """
    Resolve price-per-km based on car-related preferences.

    Expected keys inside preferences:
      - car_type (e.g. 'small_hatchback', 'sedan', 'suv', 'bakkie', 'luxury', 'hybrid', 'electric')
      - car_make, car_model, car_year (optional – reserved for future fine-grained pricing)
    """
    if not isinstance(preferences, dict):
        return CAR_TYPE_BASE_RATE_PER_KM['sedan']

    car_type = (preferences.get('car_type') or '').lower().strip()
    if car_type in CAR_TYPE_BASE_RATE_PER_KM:
        return CAR_TYPE_BASE_RATE_PER_KM[car_type]

    # Fall back to sedan if unknown
    return CAR_TYPE_BASE_RATE_PER_KM['sedan']


def _haversine_distance_km(pickup: dict, dropoff: dict) -> float | None:
    """
    Approximate great-circle distance between two points on Earth given as:
      pickup = {'lat': float, 'lng': float}
      dropoff = {'lat': float, 'lng': float}

    Returns distance in kilometers, or None if coordinates are missing/invalid.
    """
    try:
        lat1 = float(pickup.get('lat'))
        lon1 = float(pickup.get('lng'))
        lat2 = float(dropoff.get('lat'))
        lon2 = float(dropoff.get('lng'))
    except (TypeError, ValueError, AttributeError):
        return None

    # Earth radius in kilometers
    R = 6371.0

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)

    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


class QuoteRequestSchema(Schema):
    """
    Schema for cab quote calculation.

    This does NOT create a service request in the database.
    It simply returns a distance and price quote based on the provided data.
    """

    type = fields.Str(required=True, validate=validate.Equal('cab'))
    pickup = fields.Dict(required=True)
    dropoff = fields.Dict(required=True)
    preferences = fields.Dict()
    # Optional pre-calculated distance in km (e.g. from frontend using Google Maps)
    distance_km = fields.Float()


class CreateRequestSchema(Schema):
    type = fields.Str(required=True, validate=validate.OneOf(['cab', 'professional', 'provider']))
    pickup = fields.Dict()  # For cab requests
    dropoff = fields.Dict()  # For cab requests
    location = fields.Dict()  # For service provider/professional requests
    date = fields.Str(required=True)
    time = fields.Str(required=True)
    preferences = fields.Dict()
    payment_amount = fields.Decimal(required=True)
    notes = fields.Str()


class CabCheckoutSchema(Schema):
    """Schema for creating a cab request and Yoco checkout in one step."""

    pickup = fields.Dict(required=True)
    dropoff = fields.Dict(required=True)
    date = fields.Str(required=True)
    time = fields.Str(required=True)
    preferences = fields.Dict()
    payment_amount = fields.Decimal(required=True)
    distance_km = fields.Float()
    notes = fields.Str()


class ProfessionalCheckoutSchema(Schema):
    """Schema for creating a professional request and Yoco checkout (call-out fee)."""

    location = fields.Dict(required=True)  # { lat, lng, address }
    date = fields.Str(required=True)
    time = fields.Str(required=True)
    preferences = fields.Dict(required=True)  # { professional_id, service_name }
    payment_amount = fields.Decimal(required=True)  # call-out fee
    notes = fields.Str()


@bp.route('/quote', methods=['POST'])
@require_auth
def get_cab_quote():
    """
    Calculate a cab quote based on pick-up/drop-off and car preferences.

    This endpoint does NOT persist anything to the database. It simply returns:
      - distance_km
      - calculated payment_amount (quote) in Rands
    """
    try:
        schema = QuoteRequestSchema()
        data = schema.load(request.json or {})

        pickup = data['pickup']
        dropoff = data['dropoff']
        preferences = data.get('preferences') or {}

        # Prefer client-provided distance if available (e.g. Google Maps on frontend)
        distance_km = data.get('distance_km')
        if distance_km is None:
            distance_km = _haversine_distance_km(pickup, dropoff)

        if distance_km is None or distance_km <= 0:
            return error_response(
                'INVALID_DISTANCE',
                'Could not determine distance between pick-up and drop-off points.',
                None,
                400,
            )

        rate_per_km = _get_rate_per_km(preferences)
        quote_amount = round(float(distance_km) * float(rate_per_km), 2)

        return success_response(
            {
                'type': 'cab',
                'distance_km': float(distance_km),
                'rate_per_km': float(rate_per_km),
                'payment_amount': quote_amount,
                'preferences': preferences,
            },
            'Quote calculated successfully',
        )

    except ValidationError as e:
        return error_response('VALIDATION_ERROR', 'Invalid input data', e.messages, 400)
    except Exception as e:
        current_app.logger.error(f"Get cab quote error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to calculate quote', None, 500)

@bp.route('', methods=['POST'])
@require_auth
def create_request():
    """Create service request"""
    try:
        schema = CreateRequestSchema()
        data = schema.load(request.json)
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # Generate request ID
        request_id = f"REQ-{secrets.token_hex(8).upper()}"
        
        # Prepare location data
        location_data = {}
        if data.get('pickup') and data.get('dropoff'):
            location_data = {
                'pickup': data['pickup'],
                'dropoff': data['dropoff']
            }
        elif data.get('location'):
            location_data = {'location': data['location']}
        
        # Determine payment amount based on request type. Use admin-configured call-out fees.
        payment_amount = float(data['payment_amount'])
        if data['type'] == 'professional':
            setting = AppSetting.query.get('professional_callout_fee_amount') or AppSetting.query.get('callout_fee_amount')
            payment_amount = float(setting.value) if setting else 150.0
        elif data['type'] == 'provider':
            setting = AppSetting.query.get('provider_callout_fee_amount') or AppSetting.query.get('callout_fee_amount')
            payment_amount = float(setting.value) if setting else 150.0

        # Create service request
        service_request = ServiceRequest(
            id=request_id,
            request_type=data['type'],
            requester_id=user_id,
            scheduled_date=data['date'],
            scheduled_time=data['time'],
            location_data=location_data,
            details=data.get('preferences', {}),
            payment_amount=payment_amount,
            payment_status='pending'
        )
        
        if data.get('notes'):
            service_request.details['notes'] = data['notes']
        
        db.session.add(service_request)
        
        # Check wallet balance
        wallet = Wallet.query.filter_by(user_id=user_id).first()
        wallet_balance = float(wallet.balance) if wallet and wallet.balance else 0.0
        sufficient_funds = wallet_balance >= payment_amount
        
        db.session.commit()
        
        return success_response({
            'id': request_id,
            'status': 'pending',
            'payment_amount': payment_amount,
            'wallet_balance': wallet_balance,
            'sufficient_funds': sufficient_funds
        }, 'Service request created successfully', 201)
        
    except ValidationError as e:
        return error_response('VALIDATION_ERROR', 'Invalid input data', e.messages, 400)
    except Exception as e:
        current_app.logger.error(f"Create request error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to create request', None, 500)


@bp.route('/cab-checkout', methods=['POST'])
@require_auth
def create_cab_checkout():
    """
    Create a cab service request and initiate Yoco checkout in one step.

    This corresponds to the \"Accept Quote & Create Request\" action on the
    Request Cab page. The user is redirected to Yoco for payment, and
    on success the service request payment_status is updated via callback.
    """
    try:
        schema = CabCheckoutSchema()
        data = schema.load(request.json or {})

        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        # Generate request ID
        request_id = f"REQ-{secrets.token_hex(8).upper()}"

        # Prepare location data
        location_data = {
            'pickup': data['pickup'],
            'dropoff': data['dropoff'],
        }

        quote_amount = float(data['payment_amount'])
        distance_km = data.get('distance_km')
        if distance_km is None or distance_km <= 0:
            distance_km = _haversine_distance_km(data['pickup'], data['dropoff'])

        # Create service request with unpaid status until payment completes
        service_request = ServiceRequest(
            id=request_id,
            request_type='cab',
            requester_id=user_id,
            scheduled_date=data['date'],
            scheduled_time=data['time'],
            location_data=location_data,
            distance_km=distance_km,
            details=data.get('preferences', {}),
            payment_amount=quote_amount,
            payment_status='pending',
            status='unpaid',
        )

        if data.get('notes'):
            service_request.details['notes'] = data['notes']

        db.session.add(service_request)
        db.session.flush()  # ensure request exists before creating payment

        # Prepare Yoco checkout
        amount_cents = int(round(quote_amount * 100))
        external_id = f"request_{request_id}_{secrets.token_hex(6)}"

        base_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5000')
        success_url = f"{base_url}/api/payments/request-callback?callback_status=success&external_id={external_id}&request_id={request_id}"
        cancel_url = f"{base_url}/api/payments/request-callback?callback_status=cancel&external_id={external_id}&request_id={request_id}"
        failure_url = f"{base_url}/api/payments/request-callback?callback_status=failure&external_id={external_id}&request_id={request_id}"

        checkout = PaymentService.create_checkout(
            amount=amount_cents,
            currency='ZAR',
            external_id=external_id,
            success_url=success_url,
            cancel_url=cancel_url,
            failure_url=failure_url,
        )

        # Optionally, link payment ID on the request for easier tracking
        payment = Payment.query.filter_by(external_id=external_id).first()
        if payment:
            if service_request.details is None:
                service_request.details = {}
            service_request.details['payment_id'] = str(payment.id)

        db.session.commit()

        return success_response(
            {
                'request_id': request_id,
                'checkout_id': checkout['checkout_id'],
                'redirect_url': checkout['redirect_url'],
                'external_id': external_id,
            },
            'Cab request created. Redirect to checkout.',
        )

    except ValidationError as e:
        db.session.rollback()
        return error_response('VALIDATION_ERROR', 'Invalid input data', e.messages, 400)
    except ValueError as e:
        db.session.rollback()
        return error_response('INVALID_REQUEST', str(e), None, 400)
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Create cab checkout error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to create cab checkout', None, 500)


@bp.route('/professional-checkout', methods=['POST'])
@require_auth
def create_professional_checkout():
    """
    Create a professional service request and initiate Yoco checkout for the call-out fee.

    The user is redirected to Yoco for payment. On success, the service request
    payment_status is updated via the same request-callback used for cab.
    """
    try:
        schema = ProfessionalCheckoutSchema()
        data = schema.load(request.json or {})

        user_id = get_jwt_identity()
        request_id = f"REQ-{secrets.token_hex(8).upper()}"

        location = data['location']
        location_data = {'location': location}
        payment_amount = float(data['payment_amount'])
        # Enforce admin-configured professional call-out fee
        setting = AppSetting.query.get('professional_callout_fee_amount') or AppSetting.query.get('callout_fee_amount')
        if setting:
            payment_amount = float(setting.value)
        else:
            payment_amount = 150.0

        service_request = ServiceRequest(
            id=request_id,
            request_type='professional',
            requester_id=user_id,
            scheduled_date=data['date'],
            scheduled_time=data['time'],
            location_data=location_data,
            details=dict(data.get('preferences', {})),
            payment_amount=payment_amount,
            payment_status='pending',
            status='unpaid',
        )
        if data.get('notes'):
            service_request.details['notes'] = data['notes']

        db.session.add(service_request)
        db.session.flush()

        amount_cents = int(round(payment_amount * 100))
        external_id = f"request_{request_id}_{secrets.token_hex(6)}"
        base_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5000')
        success_url = f"{base_url}/api/payments/request-callback?callback_status=success&external_id={external_id}&request_id={request_id}"
        cancel_url = f"{base_url}/api/payments/request-callback?callback_status=cancel&external_id={external_id}&request_id={request_id}"
        failure_url = f"{base_url}/api/payments/request-callback?callback_status=failure&external_id={external_id}&request_id={request_id}"

        checkout = PaymentService.create_checkout(
            amount=amount_cents,
            currency='ZAR',
            external_id=external_id,
            success_url=success_url,
            cancel_url=cancel_url,
            failure_url=failure_url,
        )

        payment = Payment.query.filter_by(external_id=external_id).first()
        if payment and service_request.details is not None:
            service_request.details['payment_id'] = str(payment.id)

        db.session.commit()

        return success_response(
            {
                'request_id': request_id,
                'checkout_id': checkout['checkout_id'],
                'redirect_url': checkout['redirect_url'],
                'external_id': external_id,
            },
            'Professional request created. Redirect to checkout.',
        )
    except ValidationError as e:
        db.session.rollback()
        return error_response('VALIDATION_ERROR', 'Invalid input data', e.messages, 400)
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Create professional checkout error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to create checkout', None, 500)


@bp.route('/recent-rides-made', methods=['GET'])
@require_auth
def get_recent_rides_made():
    """Get recent rides made"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if user.role != 'driver' and user.role != 'admin':
            return error_response('FORBIDDEN', 'Only drivers and admins can view recent rides made', None, 403)
        request_params = request.args
        limit = int(request_params.get('limit', 3))
        offset = int(request_params.get('offset', 0))
        query = ServiceRequest.query.filter_by(request_type='cab', provider_id=user_id).order_by(ServiceRequest.created_at.desc())
        total = query.count()
        paginated = query.limit(limit).offset(offset).all()
        ride_ids = [r.id for r in paginated]
        rated_ids = set(
            row[0] for row in
            db.session.query(ClientRating.service_request_id).filter(
                ClientRating.service_request_id.in_(ride_ids)
            ).all()
        )

        def _ride_with_client(r):
            d = r.to_dict()
            d['has_client_rating'] = r.id in rated_ids
            if r.requester_id and r.requester:
                requester = r.requester
                pdata = requester.data or {}
                first = (pdata.get('full_name') or '').strip()
                last = (pdata.get('surname') or '').strip()
                d['client_name'] = f"{first} {last}".strip() or 'Client'
                d['client_profile_image_url'] = requester.profile_image_url
                d['client_id'] = str(requester.id)
            return d

        return success_response({
            'rides': [_ride_with_client(r) for r in paginated],
            'total': total,
            'limit': limit,
            'offset': offset
        })
    except Exception as e:
        current_app.logger.error(f"Get recent rides made error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to get recent rides made', None, 500)

@bp.route('', methods=['GET'])
@require_auth
def list_requests():
    """List service requests with preference matching"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        request_type = request.args.get('type')
        status = request.args.get('status')
        limit = int(request.args.get('limit', 50))
        offset = int(request.args.get('offset', 0))
        
        # Filter by role
        if user.role == 'client':
            # Clients see only their own requests
            query = ServiceRequest.query.filter_by(requester_id=user_id)
        elif user.role in ('driver', 'professional', 'service-provider'):
            # Providers see:
            # 1. Requests they've accepted (provider_id matches)
            # 2. Pending requests that match their profile preferences
            
            # Map request_type to role
            role_to_request_type = {
                'driver': 'cab',
                'professional': 'professional',
                'service-provider': 'provider'
            }
            expected_request_type = role_to_request_type.get(user.role)
            
            # Get all relevant requests (accepted by this provider OR pending of correct type)
            from sqlalchemy import or_
            query = ServiceRequest.query.filter(
                or_(
                    ServiceRequest.provider_id == user_id,  # Already accepted
                    and_(
                        ServiceRequest.request_type == expected_request_type,
                        ServiceRequest.status == 'pending',
                        ServiceRequest.provider_id.is_(None)  # Not yet accepted
                    )
                )
            )
        else:
            # Admin or other roles - show all requests
            query = ServiceRequest.query
        
        if request_type:
            # Map role to request_type for filtering
            if request_type == 'cab':
                query = query.filter_by(request_type='cab')
            elif request_type == 'professional':
                query = query.filter_by(request_type='professional')
            elif request_type == 'provider':
                query = query.filter_by(request_type='provider')
        
        if status:
            query = query.filter_by(status=status)
        
        # Get all matching requests
        all_requests = query.order_by(ServiceRequest.created_at.desc()).all()
        
        # Apply preference matching in Python (for JSONB fields)
        filtered_requests = []
        user_data = user.data or {}
        
        for req in all_requests:
            # Clients always see their own requests
            if user.role == 'client':
                if req.requester_id and str(req.requester_id) == str(user.id):
                    filtered_requests.append(req)
                continue
            
            # For providers (driver, professional, service-provider)
            # If already accepted by this provider, always include
            if req.provider_id and str(req.provider_id) == str(user.id):
                filtered_requests.append(req)
                continue
            
            # For pending requests not yet accepted, apply matching logic
            if req.status == 'pending' and (req.provider_id is None or str(req.provider_id) != str(user.id)):
                request_details = req.details or {}
                
                if user.role == 'driver':
                    # Match by car_type
                    driver_services = user_data.get('driver_services', [])
                    if not driver_services:
                        continue  # Skip if driver has no services
                    
                    # Get driver's car types
                    driver_car_types = set()
                    for service in driver_services:
                        car_type = service.get('car_type')
                        if car_type:
                            driver_car_types.add(car_type.lower())
                    
                    if not driver_car_types:
                        continue  # Skip if no car types
                    
                    # Check if request has car_type preference
                    request_car_type = request_details.get('car_type')
                    if request_car_type:
                        # Request has preference - must match
                        if request_car_type.lower() not in driver_car_types:
                            continue  # Skip - doesn't match
                    # If no preference, show to all drivers
                    
                    filtered_requests.append(req)
                
                elif user.role in ('professional', 'service-provider'):
                    # Match by gender
                    provider_gender = user_data.get('gender')
                    
                    # Check if request has gender preference
                    request_gender_pref = request_details.get('gender')
                    if request_gender_pref:
                        # Request has gender preference - must match provider's gender
                        if provider_gender and provider_gender.lower() != request_gender_pref.lower():
                            continue  # Skip - doesn't match
                    # If no gender preference in request, show to all providers
                    
                    filtered_requests.append(req)
                else:
                    # For other roles, include all
                    filtered_requests.append(req)
        
        # Apply pagination
        total = len(filtered_requests)
        paginated_requests = filtered_requests[offset:offset + limit]
        request_ids = [r.id for r in paginated_requests]
        rated_driver_ids = set(
            row[0] for row in
            db.session.query(DriverRating.service_request_id).filter(
                DriverRating.service_request_id.in_(request_ids)
            ).all()
        )
        rated_professional_ids = set(
            row[0] for row in
            db.session.query(ProfessionalRating.service_request_id).filter(
                ProfessionalRating.service_request_id.in_(request_ids)
            ).all()
        )
        rated_provider_ids = set(
            row[0] for row in
            db.session.query(ProviderRating.service_request_id).filter(
                ProviderRating.service_request_id.in_(request_ids)
            ).all()
        )
        requests_data = []
        for r in paginated_requests:
            d = r.to_dict()
            d['has_driver_rating'] = r.id in rated_driver_ids
            d['has_professional_rating'] = r.id in rated_professional_ids
            d['has_provider_rating'] = r.id in rated_provider_ids
            # For cab requests with an accepted driver, include driver display info
            if r.request_type == 'cab' and r.provider_id and r.provider:
                driver_user = r.provider
                pdata = driver_user.data or {}
                first = (pdata.get('full_name') or '').strip()
                last = (pdata.get('surname') or '').strip()
                d['driver_name'] = f"{first} {last}".strip() or 'Driver'
                d['driver_profile_image_url'] = driver_user.profile_image_url
                d['driver_id'] = str(driver_user.id)
            requests_data.append(d)
        return success_response({
            'requests': requests_data,
            'total': total,
            'limit': limit,
            'offset': offset
        })
        
    except Exception as e:
        current_app.logger.error(f"List requests error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to list requests', None, 500)

@bp.route('/<request_id>', methods=['GET'])
@require_auth
def get_request(request_id):
    """Get service request details"""
    try:
        service_request = ServiceRequest.query.get(request_id)
        
        if not service_request:
            return error_response('NOT_FOUND', 'Service request not found', None, 404)
        
        return success_response(service_request.to_dict())
        
    except Exception as e:
        current_app.logger.error(f"Get request error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to get request', None, 500)

@bp.route('/<request_id>/accept', methods=['POST'])
@require_auth
def accept_request(request_id):
    """Accept service request (provider)"""
    try:
        user_id = get_jwt_identity()
        service_request = ServiceRequest.query.get(request_id)
        
        if not service_request:
            return error_response('NOT_FOUND', 'Service request not found', None, 404)
        
        if service_request.status != 'pending':
            return error_response('INVALID_STATUS', 'Request cannot be accepted', None, 400)
        
        service_request.provider_id = user_id
        service_request.status = 'accepted'
        db.session.commit()
        
        return success_response(service_request.to_dict(), 'Request accepted successfully')
        
    except Exception as e:
        current_app.logger.error(f"Accept request error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to accept request', None, 500)

@bp.route('/<request_id>/cancel', methods=['POST'])
@require_auth
def cancel_request(request_id):
    """Cancel service request"""
    try:
        user_id = get_jwt_identity()
        service_request = ServiceRequest.query.get(request_id)
        
        if not service_request:
            return error_response('NOT_FOUND', 'Service request not found', None, 404)
        
        # Only requester can cancel
        if str(service_request.requester_id) != user_id:
            return error_response('FORBIDDEN', 'Only requester can cancel', None, 403)
        
        cancellation_charge = 0.0
        refund_amount = 0.0
        
        if service_request.status == 'accepted':
            # Charge cancellation fee (20% of payment amount)
            cancellation_charge = float(service_request.payment_amount) * 0.2
            refund_amount = float(service_request.payment_amount) - cancellation_charge
            
            # Refund to wallet
            if service_request.requester_id:
                wallet = Wallet.query.filter_by(user_id=service_request.requester_id).first()
                if wallet:
                    WalletService.add_transaction(
                        wallet_id=wallet.id,
                        user_id=service_request.requester_id,
                        transaction_type='cancellation_refund',
                        amount=refund_amount,
                        external_id=request_id,
                        description='Cancellation refund'
                    )
        
        service_request.status = 'cancelled'
        service_request.cancellation_charge = cancellation_charge
        db.session.commit()
        
        wallet = Wallet.query.filter_by(user_id=user_id).first()
        wallet_balance = float(wallet.balance) if wallet and wallet.balance else 0.0
        
        return success_response({
            'request_id': request_id,
            'status': 'cancelled',
            'refund_amount': refund_amount,
            'cancellation_charge': cancellation_charge,
            'wallet_balance': wallet_balance
        }, 'Request cancelled successfully')
        
    except Exception as e:
        current_app.logger.error(f"Cancel request error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to cancel request', None, 500)


def _require_cab_requester(service_request, user_id):
    """Ensure request is cab, accepted, and user is the requester."""
    if not service_request:
        return 'NOT_FOUND', 'Service request not found', 404
    if service_request.request_type != 'cab':
        return 'INVALID_REQUEST', 'Not a cab request', 400
    if service_request.status != 'accepted':
        return 'INVALID_REQUEST', 'Request must be accepted', 400
    if str(service_request.requester_id) != user_id:
        return 'FORBIDDEN', 'Only requester can perform this action', 403
    return None, None, None


def _require_cab_requester_can_rate(service_request, user_id):
    """Ensure request is cab, requester is current user, and ride is at 'arrived at location' (accepted or completed)."""
    if not service_request:
        return 'NOT_FOUND', 'Service request not found', 404
    if service_request.request_type != 'cab':
        return 'INVALID_REQUEST', 'Not a cab request', 400
    if service_request.status not in ('accepted', 'completed'):
        return 'INVALID_REQUEST', 'Request must be at arrived-at-location stage', 400
    if str(service_request.requester_id) != user_id:
        return 'FORBIDDEN', 'Only requester can rate the driver', 403
    details = service_request.details or {}
    if not details.get('cab_arrived_at_location'):
        return 'INVALID_REQUEST', 'Must mark arrived at location before rating', 400
    return None, None, None


@bp.route('/<request_id>/cab-driver-arrived', methods=['PATCH'])
@require_auth
def cab_driver_arrived(request_id):
    """Mark that the driver has arrived (requester only)."""
    try:
        user_id = get_jwt_identity()
        service_request = ServiceRequest.query.get(request_id)
        err_code, err_msg, status = _require_cab_requester(service_request, user_id)
        if err_code:
            return error_response(err_code, err_msg, None, status)
        # Reassign details so SQLAlchemy detects JSONB change
        details = dict(service_request.details or {})
        details['cab_driver_arrived'] = True
        service_request.details = details
        db.session.commit()
        return success_response(service_request.to_dict(), 'Driver marked as arrived')
    except Exception as e:
        current_app.logger.error(f"Cab driver arrived error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to update', None, 500)


@bp.route('/<request_id>/cab-arrived-at-location', methods=['PATCH'])
@require_auth
def cab_arrived_at_location(request_id):
    """Mark that requester has arrived at location (requester only)."""
    try:
        user_id = get_jwt_identity()
        service_request = ServiceRequest.query.get(request_id)
        err_code, err_msg, status = _require_cab_requester(service_request, user_id)
        if err_code:
            return error_response(err_code, err_msg, None, status)
        details = service_request.details or {}
        if not details.get('cab_driver_arrived'):
            return error_response('INVALID_REQUEST', 'Driver must be marked as arrived first', None, 400)
        details = dict(details)
        details['cab_arrived_at_location'] = True
        service_request.details = details
        service_request.status = 'completed'
        db.session.commit()
        return success_response(service_request.to_dict(), 'Arrived at location. You can rate your driver.')
    except Exception as e:
        current_app.logger.error(f"Cab arrived at location error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to update', None, 500)


@bp.route('/<request_id>/cab-mark-no-show', methods=['POST'])
@require_auth
def cab_mark_no_show(request_id):
    """Mark driver as no-show: release request so another driver can accept (requester only)."""
    try:
        user_id = get_jwt_identity()
        service_request = ServiceRequest.query.get(request_id)
        err_code, err_msg, status = _require_cab_requester(service_request, user_id)
        if err_code:
            return error_response(err_code, err_msg, None, status)
        details = dict(service_request.details or {})
        details['cab_driver_no_show'] = True
        service_request.details = details
        service_request.status = 'pending'
        service_request.provider_id = None
        db.session.commit()
        return success_response(service_request.to_dict(), 'Driver marked as no-show. Request is available for another driver.')
    except Exception as e:
        current_app.logger.error(f"Cab mark no-show error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to update', None, 500)


@bp.route('/<request_id>/rate-driver', methods=['POST'])
@require_auth
def rate_driver(request_id):
    """Submit driver rating and review (requester only). Request is already completed when arrived at location."""
    try:
        user_id = get_jwt_identity()
        service_request = ServiceRequest.query.get(request_id)
        err_code, err_msg, status = _require_cab_requester_can_rate(service_request, user_id)
        if err_code:
            return error_response(err_code, err_msg, None, status)
        data = request.json or {}
        rating = data.get('rating')
        if rating is None:
            return error_response('MISSING_FIELDS', 'Rating is required', None, 400)
        try:
            rating = int(rating)
        except (TypeError, ValueError):
            rating = None
        if not (1 <= rating <= 5):
            return error_response('INVALID_REQUEST', 'Rating must be between 1 and 5', None, 400)
        review_text = (data.get('review_text') or '').strip() or None
        existing = DriverRating.query.filter_by(service_request_id=request_id).first()
        if existing:
            return error_response('INVALID_REQUEST', 'This ride has already been rated', None, 400)
        driver_rating = DriverRating(
            service_request_id=request_id,
            driver_id=service_request.provider_id,
            requester_id=service_request.requester_id,
            rating=rating,
            review_text=review_text,
        )
        db.session.add(driver_rating)
        if service_request.status != 'completed':
            service_request.status = 'completed'
        db.session.commit()
        return success_response({
            'request': service_request.to_dict(),
            'rating': driver_rating.to_dict(),
        }, 'Thank you for your rating. Ride marked as completed.')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Rate driver error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to submit rating', None, 500)


@bp.route('/<request_id>/driver-info', methods=['GET'])
@require_auth
def get_driver_info(request_id):
    """Get driver profile and rating summary for a cab request (requester only)."""
    try:
        user_id = get_jwt_identity()
        service_request = ServiceRequest.query.get(request_id)
        if not service_request:
            return error_response('NOT_FOUND', 'Service request not found', None, 404)
        if service_request.request_type != 'cab':
            return error_response('INVALID_REQUEST', 'Not a cab request', 400)
        if str(service_request.requester_id) != user_id:
            return error_response('FORBIDDEN', 'Only the requester can view driver info', 403)
        driver = service_request.provider
        if not driver:
            return error_response('INVALID_REQUEST', 'No driver assigned to this request', 400)
        pdata = driver.data or {}
        first = (pdata.get('full_name') or '').strip()
        last = (pdata.get('surname') or '').strip()
        driver_name = f"{first} {last}".strip() or 'Driver'
        # Average rating and review count for this driver
        agg = db.session.query(
            func.coalesce(func.avg(DriverRating.rating), 0),
            func.count(DriverRating.id)
        ).filter(DriverRating.driver_id == driver.id).first()
        avg_rating = round(float(agg[0]), 1) if agg and agg[0] is not None else None
        reviews_count = int(agg[1]) if agg and agg[1] is not None else 0
        return success_response({
            'driver': {
                'id': str(driver.id),
                'name': driver_name,
                'profile_image_url': driver.profile_image_url,
                'average_rating': avg_rating,
                'reviews_count': reviews_count,
            },
            'request_id': request_id,
        })
    except Exception as e:
        current_app.logger.error(f"Driver info error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to get driver info', None, 500)


@bp.route('/<request_id>/request-another-driver', methods=['POST'])
@require_auth
def request_another_driver(request_id):
    """Request a different driver: set status back to pending and clear provider (requester only)."""
    try:
        user_id = get_jwt_identity()
        service_request = ServiceRequest.query.get(request_id)
        err_code, err_msg, status = _require_cab_requester(service_request, user_id)
        if err_code:
            return error_response(err_code, err_msg, None, status)
        data = request.json or {}
        reason = (data.get('reason') or '').strip() or None
        details = dict(service_request.details or {})
        details['request_another_driver_reason'] = reason
        service_request.details = details
        service_request.status = 'pending'
        service_request.provider_id = None
        db.session.commit()
        return success_response(service_request.to_dict(), 'Request is now pending for another driver.')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Request another driver error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to update', None, 500)


def _require_cab_driver(service_request, user_id):
    """Ensure request is cab and user is the driver (provider)."""
    if not service_request:
        return 'NOT_FOUND', 'Service request not found', 404
    if service_request.request_type != 'cab':
        return 'INVALID_REQUEST', 'Not a cab request', 400
    if str(service_request.provider_id) != user_id:
        return 'FORBIDDEN', 'Only the driver can perform this action', 403
    return None, None, None


@bp.route('/<request_id>/client-info', methods=['GET'])
@require_auth
def get_client_info(request_id):
    """Get client (requester) profile and rating summary for a cab request (driver only: available or their ride)."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        service_request = ServiceRequest.query.get(request_id)
        if not service_request:
            return error_response('NOT_FOUND', 'Service request not found', None, 404)
        if service_request.request_type != 'cab':
            return error_response('INVALID_REQUEST', 'Not a cab request', 400)
        # Driver can view client info for: (1) their accepted/completed ride, or (2) pending request (browsing available)
        if user.role != 'driver':
            return error_response('FORBIDDEN', 'Only drivers can view client info', 403)
        if str(service_request.provider_id) != user_id and service_request.status != 'pending':
            return error_response('FORBIDDEN', 'Only the driver for this ride can view client info', 403)
        client = service_request.requester
        if not client:
            return error_response('INVALID_REQUEST', 'No client assigned to this request', 400)
        pdata = client.data or {}
        first = (pdata.get('full_name') or '').strip()
        last = (pdata.get('surname') or '').strip()
        client_name = f"{first} {last}".strip() or 'Client'
        agg = db.session.query(
            func.coalesce(func.avg(ClientRating.rating), 0),
            func.count(ClientRating.id)
        ).filter(ClientRating.client_id == client.id).first()
        avg_rating = round(float(agg[0]), 1) if agg and agg[0] is not None else None
        reviews_count = int(agg[1]) if agg and agg[1] is not None else 0
        return success_response({
            'client': {
                'id': str(client.id),
                'name': client_name,
                'profile_image_url': client.profile_image_url,
                'average_rating': avg_rating,
                'reviews_count': reviews_count,
            },
            'request_id': request_id,
        })
    except Exception as e:
        current_app.logger.error(f"Client info error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to get client info', None, 500)


@bp.route('/<request_id>/rate-client', methods=['POST'])
@require_auth
def rate_client(request_id):
    """Driver rates the client (requester) after a completed cab ride."""
    try:
        user_id = get_jwt_identity()
        service_request = ServiceRequest.query.get(request_id)
        if not service_request:
            return error_response('NOT_FOUND', 'Service request not found', None, 404)
        if service_request.request_type != 'cab':
            return error_response('INVALID_REQUEST', 'Not a cab request', 400)
        if str(service_request.provider_id) != user_id:
            return error_response('FORBIDDEN', 'Only the driver can rate the client', 403)
        if service_request.status not in ('accepted', 'completed'):
            return error_response('INVALID_REQUEST', 'Request must be accepted or completed to rate', 400)
        existing = ClientRating.query.filter_by(service_request_id=request_id).first()
        if existing:
            return error_response('INVALID_REQUEST', 'You have already rated this client for this ride', 400)
        data = request.json or {}
        rating = data.get('rating')
        if rating is None:
            return error_response('MISSING_FIELDS', 'Rating is required', None, 400)
        try:
            rating = int(rating)
        except (TypeError, ValueError):
            rating = None
        if not (1 <= rating <= 5):
            return error_response('INVALID_REQUEST', 'Rating must be between 1 and 5', None, 400)
        review_text = (data.get('review_text') or '').strip() or None
        client_rating = ClientRating(
            service_request_id=request_id,
            client_id=service_request.requester_id,
            rater_id=user_id,
            rating=rating,
            review_text=review_text,
        )
        db.session.add(client_rating)
        db.session.commit()
        return success_response({
            'request': service_request.to_dict(),
            'rating': client_rating.to_dict(),
        }, 'Thank you for your rating.')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Rate client error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to submit rating', None, 500)


def _require_professional_requester(service_request, user_id):
    """Ensure request is professional, accepted, and user is the requester."""
    if not service_request:
        return 'NOT_FOUND', 'Service request not found', 404
    if service_request.request_type != 'professional':
        return 'INVALID_REQUEST', 'Not a professional request', 400
    if service_request.status != 'accepted':
        return 'INVALID_REQUEST', 'Request must be accepted', 400
    if str(service_request.requester_id) != user_id:
        return 'FORBIDDEN', 'Only the requester can perform this action', 403
    return None, None, None


def _require_provider_requester(service_request, user_id):
    """Ensure request is provider, accepted, and user is the requester."""
    if not service_request:
        return 'NOT_FOUND', 'Service request not found', 404
    if service_request.request_type != 'provider':
        return 'INVALID_REQUEST', 'Not a service provider request', 400
    if service_request.status != 'accepted':
        return 'INVALID_REQUEST', 'Request must be accepted', 400
    if str(service_request.requester_id) != user_id:
        return 'FORBIDDEN', 'Only the requester can perform this action', 403
    return None, None, None


@bp.route('/<request_id>/professional-has-arrived', methods=['PATCH'])
@require_auth
def professional_has_arrived(request_id):
    """Mark professional as arrived and complete the request (requester only)."""
    try:
        user_id = get_jwt_identity()
        service_request = ServiceRequest.query.get(request_id)
        err_code, err_msg, status = _require_professional_requester(service_request, user_id)
        if err_code:
            return error_response(err_code, err_msg, None, status)
        details = dict(service_request.details or {})
        details['professional_has_arrived'] = True
        service_request.details = details
        service_request.status = 'completed'
        db.session.commit()
        return success_response(service_request.to_dict(), 'Professional has arrived. You can rate your service.')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Professional has arrived error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to update', None, 500)


@bp.route('/<request_id>/professional-mark-no-show', methods=['POST'])
@require_auth
def professional_mark_no_show(request_id):
    """Mark professional as no-show: release request for another professional (requester only)."""
    try:
        user_id = get_jwt_identity()
        service_request = ServiceRequest.query.get(request_id)
        err_code, err_msg, status = _require_professional_requester(service_request, user_id)
        if err_code:
            return error_response(err_code, err_msg, None, status)
        details = dict(service_request.details or {})
        details['professional_no_show'] = True
        service_request.details = details
        service_request.status = 'pending'
        service_request.provider_id = None
        db.session.commit()
        return success_response(service_request.to_dict(), 'Request is now pending for another professional.')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Professional mark no-show error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to update', None, 500)


@bp.route('/<request_id>/rate-professional', methods=['POST'])
@require_auth
def rate_professional(request_id):
    """Requester rates the professional after completed service."""
    try:
        user_id = get_jwt_identity()
        service_request = ServiceRequest.query.get(request_id)
        if not service_request:
            return error_response('NOT_FOUND', 'Service request not found', None, 404)
        if service_request.request_type != 'professional':
            return error_response('INVALID_REQUEST', 'Not a professional request', 400)
        if str(service_request.requester_id) != user_id:
            return error_response('FORBIDDEN', 'Only the requester can rate the professional', 403)
        if service_request.status not in ('accepted', 'completed'):
            return error_response('INVALID_REQUEST', 'Request must be completed to rate', 400)
        details = service_request.details or {}
        if not details.get('professional_has_arrived'):
            return error_response('INVALID_REQUEST', 'Mark professional as arrived before rating', 400)
        existing = ProfessionalRating.query.filter_by(service_request_id=request_id).first()
        if existing:
            return error_response('INVALID_REQUEST', 'You have already rated this professional', 400)
        data = request.json or {}
        rating = data.get('rating')
        if rating is None:
            return error_response('MISSING_FIELDS', 'Rating is required', None, 400)
        try:
            rating = int(rating)
        except (TypeError, ValueError):
            rating = None
        if not (1 <= rating <= 5):
            return error_response('INVALID_REQUEST', 'Rating must be between 1 and 5', None, 400)
        review_text = (data.get('review_text') or '').strip() or None
        prof_rating = ProfessionalRating(
            service_request_id=request_id,
            professional_id=service_request.provider_id,
            requester_id=user_id,
            rating=rating,
            review_text=review_text,
        )
        db.session.add(prof_rating)
        db.session.commit()
        return success_response({
            'request': service_request.to_dict(),
            'rating': prof_rating.to_dict(),
        }, 'Thank you for your rating.')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Rate professional error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to submit rating', None, 500)


@bp.route('/<request_id>/provider-has-arrived', methods=['PATCH'])
@require_auth
def provider_has_arrived(request_id):
    """Mark service provider as arrived and complete the request (requester only)."""
    try:
        user_id = get_jwt_identity()
        service_request = ServiceRequest.query.get(request_id)
        err_code, err_msg, status = _require_provider_requester(service_request, user_id)
        if err_code:
            return error_response(err_code, err_msg, None, status)
        details = dict(service_request.details or {})
        details['provider_has_arrived'] = True
        service_request.details = details
        service_request.status = 'completed'
        db.session.commit()
        return success_response(service_request.to_dict(), 'Service provider has arrived. You can rate your service.')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Provider has arrived error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to update', None, 500)


@bp.route('/<request_id>/provider-mark-no-show', methods=['POST'])
@require_auth
def provider_mark_no_show(request_id):
    """Mark service provider as no-show: release request for another provider (requester only)."""
    try:
        user_id = get_jwt_identity()
        service_request = ServiceRequest.query.get(request_id)
        err_code, err_msg, status = _require_provider_requester(service_request, user_id)
        if err_code:
            return error_response(err_code, err_msg, None, status)
        details = dict(service_request.details or {})
        details['provider_no_show'] = True
        service_request.details = details
        service_request.status = 'pending'
        service_request.provider_id = None
        db.session.commit()
        return success_response(service_request.to_dict(), 'Request is now pending for another service provider.')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Provider mark no-show error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to update', None, 500)


@bp.route('/<request_id>/rate-provider', methods=['POST'])
@require_auth
def rate_provider(request_id):
    """Requester rates the service provider after completed service."""
    try:
        user_id = get_jwt_identity()
        service_request = ServiceRequest.query.get(request_id)
        if not service_request:
            return error_response('NOT_FOUND', 'Service request not found', None, 404)
        if service_request.request_type != 'provider':
            return error_response('INVALID_REQUEST', 'Not a service provider request', 400)
        if str(service_request.requester_id) != user_id:
            return error_response('FORBIDDEN', 'Only the requester can rate the service provider', 403)
        if service_request.status not in ('accepted', 'completed'):
            return error_response('INVALID_REQUEST', 'Request must be completed to rate', 400)
        details = service_request.details or {}
        if not details.get('provider_has_arrived'):
            return error_response('INVALID_REQUEST', 'Mark service provider as arrived before rating', 400)
        existing = ProviderRating.query.filter_by(service_request_id=request_id).first()
        if existing:
            return error_response('INVALID_REQUEST', 'You have already rated this service provider', 400)
        data = request.json or {}
        rating = data.get('rating')
        if rating is None:
            return error_response('MISSING_FIELDS', 'Rating is required', None, 400)
        try:
            rating = int(rating)
        except (TypeError, ValueError):
            rating = None
        if not (1 <= rating <= 5):
            return error_response('INVALID_REQUEST', 'Rating must be between 1 and 5', None, 400)
        review_text = (data.get('review_text') or '').strip() or None
        prov_rating = ProviderRating(
            service_request_id=request_id,
            provider_id=service_request.provider_id,
            requester_id=user_id,
            rating=rating,
            review_text=review_text,
        )
        db.session.add(prov_rating)
        db.session.commit()
        return success_response({
            'request': service_request.to_dict(),
            'rating': prov_rating.to_dict(),
        }, 'Thank you for your rating.')
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Rate provider error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to submit rating', None, 500)


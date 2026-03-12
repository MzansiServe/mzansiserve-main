"""
Authentication Routes
"""
import json
import logging
import os
import uuid

from flask import Blueprint, request, current_app, jsonify
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required
from google.oauth2 import id_token
from google.auth.transport.requests import Request
from marshmallow import Schema, fields, ValidationError, validate

from backend.models import User, PasswordResetToken, EmailVerificationToken, Country, ServiceType, UserSelectedService, Agent, VehicleImage, Subscription, SubscriptionPlan
from backend.extensions import db
from backend.utils.response import success_response, error_response
from backend.utils.auth import create_password_reset_token, create_email_verification_token, generate_tracking_number, validate_sa_id
from backend.services.email_service import EmailService
from backend.services.wallet_service import WalletService
from backend.services.payment_service import PaymentService
from backend.services.agent_service import AgentService

bp = Blueprint('auth', __name__)
logger = logging.getLogger(__name__)

# Validation Schemas
class RegisterSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8))
    role = fields.Str(required=True, validate=validate.OneOf(['client', 'driver', 'professional', 'service-provider']))
    full_name = fields.Str()
    phone = fields.Str()

class LoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)
    role = fields.Str(required=True, validate=validate.OneOf(['client', 'driver', 'professional', 'service-provider']))

class ForgotPasswordSchema(Schema):
    email = fields.Email(required=True)
    role = fields.Str(validate=validate.OneOf(['client', 'driver', 'professional', 'service-provider']))

class ResetPasswordSchema(Schema):
    token = fields.Str(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=8))

class VerifyEmailSchema(Schema):
    token = fields.Str(required=True)

class ResendVerificationSchema(Schema):
    email = fields.Email(required=True)
    role = fields.Str(required=True, validate=validate.OneOf(['client', 'driver', 'professional', 'service-provider']))

@bp.route('/register', methods=['POST'])
def register():
    """User registration endpoint"""
    try:
        logger.info("register: request received")
        schema = RegisterSchema()
        data = schema.load(request.json)
        logger.debug("register: email=%s role=%s", data.get('email'), data.get('role'))
        if User.query.filter_by(email=data['email'], role=data['role']).first():
            logger.warning("register: user exists email=%s role=%s", data['email'], data['role'])
            return error_response('USER_EXISTS', 'An account with this email and role already exists', None, 400)
        
        # Create user
        user = User(
            email=data['email'],
            role=data['role'],
            is_admin=False,
            is_paid=False,
            is_approved=False,
            is_active=True,
            email_verified=False,
            tracking_number=generate_tracking_number()
        )
        user.set_password(data['password'])
        
        # Store basic info in data JSONB
        if data.get('full_name'):
            user.data = {
                'full_name': data['full_name'],
                'phone': data.get('phone', '')
            }
        
        db.session.add(user)
        db.session.commit()
        
        # Create wallet for user
        WalletService.get_or_create_wallet(user.id)
        
        # Generate email verification token
        token = create_email_verification_token(user.id)
        
        # Queue verification email
        try:
            logger.info("register: sending verification email to user_id=%s", user.id)
            EmailService.send_verification_email(user, token)
            logger.info("register: verification email sent to user_id=%s", user.id)
        except Exception as e:
            logger.warning("register: failed to send verification email: %s", e)
        
        # Generate JWT token
        access_token = create_access_token(identity=str(user.id))
        
        logger.info("register: success user_id=%s", user.id)
        return success_response({
            'user': user.to_dict(),
            'token': access_token
        }, 'User registered successfully', 201)
    except ValidationError as e:
        logger.warning("register: validation error %s", e.messages)
        return error_response('VALIDATION_ERROR', 'Invalid input data', e.messages, 400)
    except Exception as e:
        logger.exception("register: failed")
        return error_response('INTERNAL_ERROR', 'Registration failed', None, 500)

@bp.route('/login', methods=['POST'])
def login():
    """User login endpoint. Requires email, password, and role. User must have registered that (email, role) combination."""
    try:
        logger.info("login: request received")
        schema = LoginSchema()
        data = schema.load(request.json)
        user = User.query.filter_by(email=data['email'], role=data['role']).first()
        if not user or not user.check_password(data['password']):
            logger.warning("login: invalid credentials email=%s role=%s", data['email'], data['role'])
            return error_response('INVALID_CREDENTIALS', 'Invalid email, password, or role combination', None, 401)
        if not user.is_active:
            logger.warning("login: account inactive user_id=%s", user.id)
            return error_response('ACCOUNT_INACTIVE', 'Account is inactive', None, 403)
        if not user.email_verified:
            logger.warning("login: email not verified user_id=%s", user.id)
            return error_response('EMAIL_NOT_VERIFIED', 'Your email address is not verified. Please check your inbox or resend the verification email.', None, 403)
        access_token = create_access_token(identity=str(user.id))
        logger.info("login: success user_id=%s", user.id)
        return success_response({
            'user': user.to_dict(),
            'token': access_token
        }, 'Login successful')
    except ValidationError as e:
        logger.warning("login: validation error %s", e.messages)
        return error_response('VALIDATION_ERROR', 'Invalid input data', e.messages, 400)
    except Exception as e:
        logger.exception("login: failed")
        return error_response('INTERNAL_ERROR', 'Login failed', None, 500)

@bp.route('/google-login', methods=['POST'])
def google_login():
    """Google OAuth login endpoint"""
    try:
        logger.info("google_login: request received")
        data = request.json
        token = data.get('token')
        role = data.get('role', 'client')

        if not token:
            return error_response('MISSING_TOKEN', 'Google token is required', None, 400)

        # Verify Google Token
        client_id = current_app.config.get('GOOGLE_CLIENT_ID')
        if not client_id:
            logger.error("google_login: GOOGLE_CLIENT_ID not configured")
            return error_response('CONFIG_ERROR', 'Google Client ID not configured', None, 500)

        try:
            idinfo = id_token.verify_oauth2_token(token, Request(), client_id)
            
            # ID token is valid. Get user's Google ID and email.
            google_id = idinfo['sub']
            email = idinfo['email']
            name = idinfo.get('name', '')
            
            # Check if user exists
            user = User.query.filter_by(email=email, role=role).first()
            
            if not user:
                # Create new user
                logger.info("google_login: creating new user email=%s role=%s", email, role)
                user = User(
                    email=email,
                    role=role,
                    is_admin=False,
                    is_paid=True, # Google users are often considered verified
                    is_approved=True,
                    is_active=True,
                    email_verified=True,
                    tracking_number=generate_tracking_number()
                )
                # Set a dummy password for Google users to satisfy non-nullable constraint
                user.set_password(str(uuid.uuid4()))
                user.data = {
                    'full_name': name,
                    'google_id': google_id,
                    'registration_method': 'google'
                }
                db.session.add(user)
                db.session.commit()
                
                # Create wallet
                WalletService.get_or_create_wallet(user.id)
            
            # Login successful
            access_token = create_access_token(identity=str(user.id))
            logger.info("google_login: success user_id=%s", user.id)
            
            return success_response({
                'user': user.to_dict(),
                'token': access_token
            }, 'Google login successful')

        except ValueError:
            # Invalid token
            logger.warning("google_login: invalid token")
            return error_response('INVALID_TOKEN', 'Invalid Google token', None, 401)

    except Exception as e:
        logger.exception("google_login: failed")
        return error_response('INTERNAL_ERROR', 'Google login failed', None, 500)

class AdminLoginSchema(Schema):
    email = fields.Email(required=True)
    password = fields.Str(required=True)


@bp.route('/admin-login', methods=['POST'])
def admin_login():
    """Admin login endpoint. Role is assumed to be admin. Only email and password required."""
    try:
        logger.info("admin_login: request received")
        schema = AdminLoginSchema()
        data = schema.load(request.json)
        user = User.query.filter_by(email=data['email'], role='admin').first()
        if not user or not user.check_password(data['password']):
            logger.warning("admin_login: invalid credentials")
            return error_response('INVALID_CREDENTIALS', 'Invalid email or password', None, 401)
        if not user.is_active:
            logger.warning("admin_login: account inactive user_id=%s", user.id)
            return error_response('ACCOUNT_INACTIVE', 'Account is inactive', None, 403)
        if not user.is_admin:
            logger.warning("admin_login: not admin user_id=%s", user.id)
            return error_response('FORBIDDEN', 'Not an admin account', None, 403)
        access_token = create_access_token(identity=str(user.id))
        logger.info("admin_login: success user_id=%s", user.id)
        return success_response({
            'user': user.to_dict(),
            'token': access_token
        }, 'Admin login successful')
    except ValidationError as e:
        logger.warning("admin_login: validation error %s", e.messages)
        return error_response('VALIDATION_ERROR', 'Invalid input data', e.messages, 400)
    except Exception as e:
        logger.exception("admin_login: failed")
        return error_response('INTERNAL_ERROR', 'Login failed', None, 500)


@bp.route('/roles-for-email', methods=['GET'])
def roles_for_email():
    """Return roles that have accounts for the given email. Used by login form to show role options."""
    try:
        email = request.args.get('email', '').strip().lower()
        if not email:
            return success_response({'roles': []})
        users = User.query.filter_by(email=email).all()
        roles = sorted(set(u.role for u in users if u.role and u.role != 'admin'))
        return success_response({'roles': roles})
    except Exception as e:
        logger.warning("roles_for_email: %s", e)
        return success_response({'roles': []})

@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """User logout endpoint"""
    # With JWT, logout is handled client-side by removing the token
    # This endpoint exists for consistency and can be used for token blacklisting in the future
    return success_response(None, 'Logged out successfully')

@bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    """Request password reset endpoint"""
    try:
        logger.info("forgot_password: request received")
        schema = ForgotPasswordSchema()
        data = schema.load(request.json)
        if data.get('role'):
            user = User.query.filter_by(email=data['email'], role=data['role']).first()
        else:
            user = User.query.filter_by(email=data['email']).first()
        
        if user:
            # Generate password reset token
            token = create_password_reset_token(user.id)
            
            # Queue password reset email
            try:
                EmailService.send_password_reset_email(user, token)
            except Exception as e:
                logger.warning("forgot_password: failed to send reset email: %s", e)
        
        return success_response(None, 'If the email exists, a password reset link has been sent')
    except ValidationError as e:
        logger.warning("forgot_password: validation error %s", e.messages)
        return error_response('VALIDATION_ERROR', 'Invalid input data', e.messages, 400)
    except Exception as e:
        logger.exception("forgot_password: failed")
        return error_response('INTERNAL_ERROR', 'Failed to process request', None, 500)

@bp.route('/reset-password', methods=['POST'])
def reset_password():
    """Reset password with token endpoint"""
    try:
        logger.info("reset_password: request received")
        schema = ResetPasswordSchema()
        data = schema.load(request.json)
        token = PasswordResetToken.query.filter_by(token=data['token']).first()
        if not token or not token.is_valid():
            logger.warning("reset_password: invalid or expired token")
            return error_response('INVALID_TOKEN', 'Invalid or expired reset token', None, 400)
        user = token.user
        user.set_password(data['password'])
        token.used = True
        db.session.commit()
        logger.info("reset_password: success user_id=%s", user.id)
        return success_response(None, 'Password reset successfully')
    except ValidationError as e:
        logger.warning("reset_password: validation error %s", e.messages)
        return error_response('VALIDATION_ERROR', 'Invalid input data', e.messages, 400)
    except Exception as e:
        logger.exception("reset_password: failed")
        return error_response('INTERNAL_ERROR', 'Failed to reset password', None, 500)

@bp.route('/verify-email', methods=['POST'])
def verify_email():
    """Verify email with token endpoint"""
    try:
        logger.info("verify_email: request received")
        schema = VerifyEmailSchema()
        data = schema.load(request.json)
        token = EmailVerificationToken.query.filter_by(token=data['token']).first()
        if not token or not token.is_valid():
            logger.warning("verify_email: invalid or expired token")
            return error_response('INVALID_TOKEN', 'Invalid or expired verification token', None, 400)
        user = token.user
        user.email_verified = True
        token.used = True
        db.session.commit()
        
        # Generate JWT token for immediate payment or login
        access_token = create_access_token(identity=str(user.id))
        
        logger.info("verify_email: success user_id=%s", user.id)
        return success_response({
            'user': user.to_dict(),
            'token': access_token
        }, 'Email verified successfully')
    except ValidationError as e:
        logger.warning("verify_email: validation error %s", e.messages)
        return error_response('VALIDATION_ERROR', 'Invalid input data', e.messages, 400)
    except Exception as e:
        logger.exception("verify_email: failed")
        return error_response('INTERNAL_ERROR', 'Failed to verify email', None, 500)

@bp.route('/initiate-registration-payment', methods=['POST'])
@jwt_required()
def initiate_registration_payment():
    """Initiate registration payment for a verified user"""
    try:
        data = request.json or {}
        provider = data.get('provider', 'paypal')  # PayPal as default
        
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            return error_response('USER_NOT_FOUND', 'User not found', None, 404)
        
        if not user.email_verified:
            return error_response('EMAIL_NOT_VERIFIED', 'Please verify your email address first', None, 403)
            
        if user.is_paid:
            return error_response('ALREADY_PAID', 'Registration fee already paid', None, 400)
            
        # Generate external_id for payment
        user_id_hex = str(user.id).replace('-', '')
        external_id = f"reg_fee_{user_id_hex}_{uuid.uuid4().hex[:8]}"
        
        # Check if user needs a subscription
        # Providers and Professionals pay a recurring fee (subscription)
        needs_subscription = user.role in ('professional', 'service-provider')
        
        backend_url = current_app.config.get('BACKEND_URL', 'https://mzansiserve.co.za').rstrip('/')
        success_url = f"{backend_url}/api/auth/registration-callback?callback_status=success&external_id={external_id}&provider={provider}"
        cancel_url = f"{backend_url}/api/auth/registration-callback?callback_status=cancel&external_id={external_id}&provider={provider}"
        
        if provider == 'paypal' and needs_subscription:
            from backend.models import SubscriptionPlan
            # Handle subscription flow
            plan_name = f"{user.role.title()} Subscription"
            plan = SubscriptionPlan.query.filter_by(name=plan_name).first()
            if not plan:
                plan = SubscriptionPlan(
                    name=plan_name,
                    description=f"Monthly subscription fee for {user.role}",
                    price=100.00,
                    currency='ZAR',
                    interval='month'
                )
                db.session.add(plan)
                db.session.commit()
            
            # Sync with PayPal if needed
            if not plan.paypal_plan_id:
                try:
                    pp_plan = PaymentService.create_subscription_plan(
                        name=plan.name,
                        description=plan.description,
                        price=float(plan.price),
                        currency=plan.currency,
                        interval=plan.interval,
                        provider='paypal'
                    )
                    plan.paypal_plan_id = pp_plan['plan_id']
                    db.session.commit()
                except Exception as e:
                    logger.error("Failed to create PayPal plan: %s", e)
                    return error_response('PAYMENT_ERROR', 'Could not initialize subscription plan', None, 500)
            
            checkout_result = PaymentService.create_subscription(
                user_id=str(user.id),
                plan_id=plan.paypal_plan_id,
                success_url=success_url,
                cancel_url=cancel_url,
                provider='paypal',
                external_id=external_id
            )
        else:
            # One-time payment flow
            REGISTRATION_FEE_AMOUNT = 10000  # R100.00 in cents
            checkout_result = PaymentService.create_checkout(
                amount=REGISTRATION_FEE_AMOUNT,
                currency='ZAR',
                external_id=external_id,
                success_url=success_url,
                cancel_url=cancel_url,
                failure_url=f"{backend_url}/api/auth/registration-callback?callback_status=failure&external_id={external_id}&provider={provider}",
                provider=provider
            )
        
        logger.info("initiate_registration_payment: success user_id=%s external_id=%s", user.id, external_id)
        return success_response({
            'redirect_url': checkout_result['redirect_url'],
            'checkout_id': checkout_result['checkout_id'],
            'external_id': external_id
        })
    except Exception as e:
        logger.exception("initiate_registration_payment: failed")
        return error_response('INTERNAL_ERROR', 'Failed to initiate payment', None, 500)

@bp.route('/resend-verification', methods=['POST'])
def resend_verification():
    """Resend email verification token"""
    try:
        logger.info("resend_verification: request received")
        schema = ResendVerificationSchema()
        data = schema.load(request.json)
        user = User.query.filter_by(email=data['email'], role=data['role']).first()
        
        if not user:
            # Return success to prevent enumeration
            return success_response(None, 'If the account exists, a verification email has been sent')
            
        if user.email_verified:
            return success_response(None, 'Email is already verified')
            
        # Create new verification token
        token = create_email_verification_token(user.id)
        
        # Queue verification email
        try:
            EmailService.send_verification_email(user, token)
        except Exception as e:
            logger.warning("resend_verification: failed to send email: %s", e)
            
        return success_response(None, 'Verification email has been resent')
    except ValidationError as e:
        logger.warning("resend_verification: validation error %s", e.messages)
        return error_response('VALIDATION_ERROR', 'Invalid input data', e.messages, 400)
    except Exception as e:
        logger.exception("resend_verification: failed")
        return error_response('INTERNAL_ERROR', 'Failed to resend verification email', None, 500)

@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user endpoint"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        if not user:
            logger.warning("get_current_user: user not found user_id=%s", user_id)
            return error_response('USER_NOT_FOUND', 'User not found', None, 404)
        return success_response(user.to_dict())
    except Exception as e:
        logger.exception("get_current_user: failed")
        return error_response('INTERNAL_ERROR', 'Failed to get user', None, 500)

@bp.route('/agents', methods=['GET'])
def list_agents():
    """List agents for registration dropdown (displays agent_id)."""
    try:
        agents = Agent.query.order_by(Agent.agent_id).all()
        return success_response([a.to_dict() for a in agents])
    except Exception as e:
        logger.exception("list_agents: failed")
        return error_response('INTERNAL_ERROR', 'Failed to list agents', None, 500)


@bp.route('/register-with-payment', methods=['POST'])
def register_with_payment():
    """User registration with payment checkout"""
    try:
        from backend.routes.profile import UpdateProfileSchema
        from werkzeug.utils import secure_filename

        logger.info("register_with_payment: request received")
        registration_data_str = request.form.get('registration_data')
        logger.info("register_with_payment: registration_data_str=%s", registration_data_str)
        if not registration_data_str:
            logger.info("register_with_payment: missing registration_data")
            return error_response('MISSING_DATA', 'Registration data is required', None, 400)
        registration_data = json.loads(registration_data_str)
        logger.info("register_with_payment: role=%s email=%s", registration_data.get('role'), registration_data.get('email'))
        
        # Validate basic registration fields
        if not registration_data.get('email') or not registration_data.get('password') or not registration_data.get('role'):
            logger.warning("register_with_payment: missing email, password, or role")
            return error_response('MISSING_FIELDS', 'Email, password, and role are required', None, 400)
        
        # Validate password confirmation
        if registration_data.get('password_confirm') is None:
            logger.warning("register_with_payment: missing password_confirm")
            return error_response('MISSING_FIELDS', 'Password confirmation is required', None, 400)
        if registration_data.get('password') != registration_data.get('password_confirm'):
            logger.warning("register_with_payment: password mismatch")
            return error_response('PASSWORD_MISMATCH', 'Password and confirmation do not match', None, 400)
        
        # Check if (email, role) combination already exists
        if User.query.filter_by(email=registration_data['email'], role=registration_data['role']).first():
            logger.warning("register_with_payment: user already exists email=%s role=%s", registration_data['email'], registration_data['role'])
            return error_response('USER_EXISTS', 'An account with this email and role already exists', None, 400)

        # Optional agent_id: validate if provided (supports UUID or short code)
        agent_code_raw = registration_data.get('agent_id')
        agent_uuid = None
        if agent_code_raw:
            # Try to find by short code first (e.g. AGT001)
            agent_by_code = Agent.query.filter_by(agent_id=agent_code_raw).first()
            if agent_by_code:
                agent_uuid = agent_by_code.id
            else:
                # Try to parse as UUID
                try:
                    agent_uuid = uuid.UUID(agent_code_raw)
                    if not Agent.query.get(agent_uuid):
                        logger.warning("register_with_payment: agent not found by UUID=%s", agent_uuid)
                        return error_response('INVALID_FIELDS', 'Invalid agent code.', None, 400)
                except (ValueError, TypeError):
                    logger.warning("register_with_payment: invalid agent code format=%s", agent_code_raw)
                    return error_response('INVALID_FIELDS', 'Invalid agent code format.', None, 400)
        
        # All roles: ID/Passport number, profile photo, and next of kin are mandatory
        if not registration_data.get('id_number') or not str(registration_data.get('id_number', '')).strip():
            logger.warning("register_with_payment: missing id_number")
            return error_response('MISSING_FIELDS', 'ID/Passport number is required for all roles', None, 400)
        
        profile_photo = request.files.get('profile_photo')
        if not profile_photo or not (profile_photo.filename or '').strip():
            logger.warning("register_with_payment: missing profile_photo")
            return error_response('MISSING_FIELDS', 'Profile photo is required for all roles', None, 400)
            
        nok = registration_data.get('next_of_kin')
        if not nok or not isinstance(nok, dict):
            logger.warning("register_with_payment: missing next_of_kin or not a dict")
            return error_response('MISSING_FIELDS', 'Next of kin is required for all roles', None, 400)
        if not (nok.get('full_name') or '').strip():
            logger.warning("register_with_payment: missing next_of_kin full_name")
            return error_response('MISSING_FIELDS', 'Next of kin full name is required', None, 400)
        if not (nok.get('contact_number') or '').strip() and not (nok.get('contact_email') or '').strip():
            logger.warning("register_with_payment: missing next_of_kin contact info")
            return error_response('MISSING_FIELDS', 'Next of kin contact number or email is required', None, 400)
        
        contact_number = (nok.get('contact_number') or '').strip()
        if contact_number and not contact_number.replace('+', '').replace(' ', '').isdigit():
            logger.warning("register_with_payment: invalid next_of_kin contact_number=%s", contact_number)
            return error_response('INVALID_FIELDS', 'Next of kin contact number must contain numbers only', None, 400)
        
        # All roles: ID document (upload) is mandatory
        id_doc = request.files.get('id_document')
        if not id_doc or not (id_doc.filename or '').strip():
            logger.warning("register_with_payment: missing id_document")
            return error_response('MISSING_FIELDS', 'ID document (upload) is required for all roles', None, 400)
        
        # Driver role: proof of residence and driver's license files are mandatory (ID document already required above)
        if registration_data.get('role') == 'driver':
            missing = []
            for key, label in [
                ('proof_of_residence', 'Proof of residence'),
                ('drivers_license', "Driver's license"),
            ]:
                f = request.files.get(key)
                if not f or not f.filename or not f.filename.strip():
                    missing.append(label)
            if missing:
                logger.warning("register_with_payment: driver missing documents: %s", missing)
                return error_response(
                    'MISSING_DRIVER_DOCUMENTS',
                    f"For driver registration, the following are required: {', '.join(missing)}.",
                    None,
                    400,
                )
        # Service-provider and professional: proof of residence is mandatory
        if registration_data.get('role') in ('service-provider', 'professional'):
            f = request.files.get('proof_of_residence')
            if not f or not f.filename or not f.filename.strip():
                logger.warning("register_with_payment: missing proof_of_residence for %s", registration_data.get('role'))
                return error_response(
                    'MISSING_FIELDS',
                    'Proof of residence is required for service provider and professional registration.',
                    None,
                    400,
                )
        # Professional: Highest qualification, CV/Resume and qualification documents are mandatory
        if registration_data.get('role') == 'professional':
            if not (registration_data.get('highest_qualification') or '').strip():
                logger.warning("register_with_payment: missing highest_qualification")
                return error_response('MISSING_FIELDS', 'Highest qualification is required for professional registration.', None, 400)
            cv_file = request.files.get('cv_resume')
            if not cv_file or not (cv_file.filename or '').strip():
                logger.warning("register_with_payment: missing cv_resume")
                return error_response('MISSING_FIELDS', 'CV/Resume is required for professional registration.', None, 400)
            qual_files = request.files.getlist('qualification_documents')
            if not qual_files or not any(f and (f.filename or '').strip() for f in qual_files):
                logger.warning("register_with_payment: missing qualification_documents")
                return error_response('MISSING_FIELDS', 'At least one qualification document is required for professional registration.', None, 400)
        
        # Create user (not paid yet)
        user = User(
            email=registration_data['email'],
            role=registration_data['role'],
            is_admin=False,
            is_paid=False,
            is_approved=False,
            is_active=True,
            email_verified=False,
            tracking_number=generate_tracking_number(),
            nationality=registration_data.get('nationality'),
            agent_id=agent_uuid,
        )
        user.set_password(registration_data['password'])
        
        # Build user data JSONB
        user_data = {
            'full_name': registration_data.get('full_name'),
            'surname': registration_data.get('surname'),
            'phone': registration_data.get('phone'),
            'gender': registration_data.get('gender'),
            'id_number': registration_data.get('id_number'),  # Will be sa_id or passport
            'next_of_kin': registration_data.get('next_of_kin')
        }
        
        # Add role-specific data
        if registration_data.get('role') == 'professional':
            user_data['highest_qualification'] = registration_data.get('highest_qualification')
            user_data['professional_body'] = registration_data.get('professional_body')
            user_data['professional_services'] = registration_data.get('professional_services', [])
        elif registration_data.get('role') == 'service-provider':
            # Services will be saved to UserSelectedService after payment
            pass
        elif registration_data.get('role') == 'driver':
            user_data['driver_services'] = registration_data.get('driver_services', [])
        
        # Handle nationality and ID
        nationality = registration_data.get('nationality', '')
        if nationality == 'South Africa':
            user_data['sa_citizen'] = True
            if registration_data.get('id_number'):
                user_data['sa_id'] = registration_data.get('id_number')
        else:
            user_data['sa_citizen'] = False
            if registration_data.get('id_number'):
                user_data['passport_number'] = registration_data.get('id_number')
        
        user.data = user_data
        
        # Handle file uploads
        upload_folder = current_app.config.get('UPLOAD_FOLDER')
        if not os.path.exists(upload_folder):
            os.makedirs(upload_folder)
        
        file_urls = []
        
        # ID Document
        if 'id_document' in request.files:
            file = request.files['id_document']
            if file and file.filename:
                file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'pdf'
                unique_filename = f"temp_{uuid.uuid4().hex[:8]}.{file_ext}"
                filepath = os.path.join(upload_folder, unique_filename)
                file.save(filepath)
                file_urls.append(f"/uploads/{unique_filename}")
        
        # Proof of Residence
        if 'proof_of_residence' in request.files:
            file = request.files['proof_of_residence']
            if file and file.filename:
                file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'pdf'
                unique_filename = f"temp_proof_{uuid.uuid4().hex[:8]}.{file_ext}"
                filepath = os.path.join(upload_folder, unique_filename)
                file.save(filepath)
                user_data['proof_of_residence_url'] = f"/uploads/{unique_filename}"
        
        # Driver's License
        if 'drivers_license' in request.files:
            file = request.files['drivers_license']
            if file and file.filename:
                file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'pdf'
                unique_filename = f"temp_license_{uuid.uuid4().hex[:8]}.{file_ext}"
                filepath = os.path.join(upload_folder, unique_filename)
                file.save(filepath)
                user_data['driver_license_url'] = f"/uploads/{unique_filename}"
        
        # CV/Resume (professional role)
        if registration_data.get('role') == 'professional' and 'cv_resume' in request.files:
            file = request.files['cv_resume']
            if file and file.filename:
                file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'pdf'
                if file_ext not in ('pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'):
                    file_ext = 'pdf'
                unique_filename = f"cv_resume_{uuid.uuid4().hex[:8]}.{file_ext}"
                filepath = os.path.join(upload_folder, unique_filename)
                file.save(filepath)
                user_data['cv_resume_url'] = f"/uploads/{unique_filename}"
        
        # Qualification Documents
        if 'qualification_documents' in request.files:
            files = request.files.getlist('qualification_documents')
            qual_urls = []
            for file in files:
                if file and file.filename:
                    file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'pdf'
                    unique_filename = f"temp_qual_{uuid.uuid4().hex[:8]}.{file_ext}"
                    filepath = os.path.join(upload_folder, unique_filename)
                    file.save(filepath)
                    qual_urls.append(f"/uploads/{unique_filename}")
            if qual_urls:
                user_data['qualification_urls'] = qual_urls
        
        # Profile photo (optional)
        if 'profile_photo' in request.files:
            file = request.files['profile_photo']
            if file and file.filename:
                file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
                if file_ext in ('jpg', 'jpeg', 'png'):
                    unique_filename = f"profile_{uuid.uuid4().hex[:12]}.{file_ext}"
                    filepath = os.path.join(upload_folder, unique_filename)
                    file.save(filepath)
                    user.profile_image_url = f"/uploads/{unique_filename}"
        
        user.file_urls = file_urls
        user.data = user_data
        
        # Save user (temporarily, will be updated after payment)
        db.session.add(user)
        db.session.flush()  # Get user.id without committing
        
        # Create wallet
        WalletService.get_or_create_wallet(user.id)
        logger.info("register_with_payment: wallet created for user_id=%s", user.id)
        # Driver: save vehicle images (vehicle_images_0, vehicle_images_1, ...)
        if registration_data.get('role') == 'driver':
            import re
            for key in request.files:
                m = re.match(r'vehicle_images_(\d+)', key)
                if m:
                    car_index = int(m.group(1))
                    files = request.files.getlist(key)
                    for file in files:
                        if file and file.filename and (file.filename or '').strip():
                            file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else 'jpg'
                            if file_ext not in ('jpg', 'jpeg', 'png'):
                                file_ext = 'jpg'
                            unique_filename = f"vehicle_{uuid.uuid4().hex[:12]}.{file_ext}"
                            filepath = os.path.join(upload_folder, unique_filename)
                            file.save(filepath)
                            img = VehicleImage(user_id=user.id, car_index=car_index, image_url=f"/uploads/{unique_filename}")
                            db.session.add(img)
        
        # Store provider services data temporarily in user.data for later processing
        if registration_data.get('role') == 'service-provider':
            user_data['provider_services'] = registration_data.get('provider_services', [])
            user.data = user_data
        db.session.commit()
        
        # Send Verification Email instead of initiating payment
        try:
            logger.info("register_with_payment: sending verification email to user_id=%s", user.id)
            token = create_email_verification_token(user.id)
            EmailService.send_verification_email(user, token)
            logger.info("register_with_payment: verification email sent to user_id=%s", user.id)
        except Exception as e:
            logger.warning("register_with_payment: failed to send verification email: %s", e)
        
        logger.info("register_with_payment: success (pending verification) user_id=%s", user.id)
        return success_response({
            'user': user.to_dict(),
            'message': 'Registration successful. Please check your email to verify your account and complete payment.'
        }, 'Registration successful. Check email for verification.', 201)
    except json.JSONDecodeError:
        logger.info("register_with_payment: invalid JSON")
        return error_response('INVALID_DATA', 'Invalid registration data format', None, 400)
    except Exception as e:
        db.session.rollback()
        logger.exception("register_with_payment: failed")
        return error_response('INTERNAL_ERROR', 'Registration failed', None, 500)

@bp.route('/complete-registration', methods=['POST'])
def complete_registration():
    """Complete registration after successful payment"""
    try:
        logger.info("complete_registration: request received")
        data = request.json
        external_id = data.get('external_id')
        registration_data = data.get('registration_data')
        if not external_id:
            logger.warning("complete_registration: missing external_id")
            return error_response('MISSING_EXTERNAL_ID', 'External ID is required', None, 400)
        from backend.models import Payment
        payment = Payment.query.filter_by(external_id=external_id).first()
        if not payment:
            logger.warning("complete_registration: payment not found external_id=%s", external_id)
            return error_response('PAYMENT_NOT_FOUND', 'Payment not found', None, 404)
        if payment.status != 'completed':
            logger.warning("complete_registration: payment not completed external_id=%s status=%s", external_id, payment.status)
            return error_response('PAYMENT_NOT_COMPLETED', 'Payment not completed', None, 400)
        
        # Extract user_id from external_id
        if external_id.startswith('reg_fee_'):
            parts = external_id.split('_')
            if len(parts) >= 4:
                user_id_hex = '_'.join(parts[2:-1])
                user_id_hex_clean = user_id_hex.replace('-', '')
                if len(user_id_hex_clean) == 32:
                    user_id_str = f"{user_id_hex_clean[:8]}-{user_id_hex_clean[8:12]}-{user_id_hex_clean[12:16]}-{user_id_hex_clean[16:20]}-{user_id_hex_clean[20:32]}"
                    user_id = uuid.UUID(user_id_str)
                    user = User.query.get(user_id)
                    
                    if user:
                        # Mark user as paid
                        user.is_paid = True
                        
                        # Custom services will be processed during admin approval
                        
                        db.session.commit()
                        access_token = create_access_token(identity=str(user.id))
                        logger.info("complete_registration: success user_id=%s", user.id)
                        return success_response({
                            'user': user.to_dict(),
                            'token': access_token
                        }, 'Registration completed successfully')
        logger.warning("complete_registration: invalid external_id=%s", external_id)
        return error_response('INVALID_EXTERNAL_ID', 'Could not extract user ID from external ID', None, 400)
    except Exception as e:
        db.session.rollback()
        logger.exception("complete_registration: failed: %s", str(e))
        return error_response('INTERNAL_ERROR', 'Failed to complete registration', None, 500)

@bp.route('/countries', methods=['GET'])
def get_countries():
    """Get all active countries"""
    try:
        countries = Country.query.filter_by(is_active=True).order_by(Country.name.asc()).all()
        return success_response({
            'countries': [c.to_dict() for c in countries]
        })
    except Exception as e:
        logger.exception("get_countries: failed")
        return error_response('INTERNAL_ERROR', 'Failed to load countries', None, 500)

@bp.route('/service-types', methods=['GET'])
def get_service_types():
    """Get service types with optional filters"""
    try:
        category = request.args.get('category')
        is_active = request.args.get('is_active', 'true').lower() == 'true'
        
        query = ServiceType.query
        if category:
            query = query.filter_by(category=category)
        if is_active:
            query = query.filter_by(is_active=True)
        
        service_types = query.order_by(ServiceType.order.asc(), ServiceType.name.asc()).all()
        return success_response({
            'service_types': [st.to_dict() for st in service_types]
        })
    except Exception as e:
        logger.exception("get_service_types: failed")
        return error_response('INTERNAL_ERROR', 'Failed to load service types', None, 500)

@bp.route('/registration-callback', methods=['GET'])
def registration_payment_callback():
    """Handle registration payment callback from Yoco"""
    try:
        from backend.models import Payment
        
        callback_status = request.args.get('callback_status')
        external_id = request.args.get('external_id')
        
        logger.info("registration_callback: status=%s external_id=%s", callback_status, external_id)
        
        frontend_url = current_app.config.get('FRONTEND_URL', 'https://mzansiserve.co.za')
        
        if not external_id:
            return current_app.make_response((
                f'<html><body><script>window.location.href="{frontend_url}/payment-status?payment=error&external_id=";</script></body></html>',
                302
            ))
        
        # Find payment or subscription
        payment = Payment.query.filter_by(external_id=external_id).first()
        subscription = None
        if not payment:
            from backend.models import Subscription
            subscription = Subscription.query.filter_by(provider_subscription_id=request.args.get('subscription_id')).first()
            if not subscription and external_id:
                # Some providers might use external_id as provider_subscription_id
                subscription = Subscription.query.filter_by(provider_subscription_id=external_id).first()
                
        if not payment and not subscription:
            logger.warning("registration_callback: payment/subscription not found external_id=%s sub_id=%s", 
                           external_id, request.args.get('subscription_id'))
            return current_app.make_response((
                f'<html><body><script>window.location.href="{frontend_url}/payment-status?payment=error&external_id=' + (external_id or '') + '";</script></body></html>',
                302
            ))
        
        # Extract user_id from external_id
        if external_id.startswith('reg_fee_'):
            parts = external_id.split('_')
            if len(parts) >= 4:
                user_id_hex = '_'.join(parts[2:-1])
                user_id_hex_clean = user_id_hex.replace('-', '')
                if len(user_id_hex_clean) == 32:
                    user_id_str = f"{user_id_hex_clean[:8]}-{user_id_hex_clean[8:12]}-{user_id_hex_clean[12:16]}-{user_id_hex_clean[16:20]}-{user_id_hex_clean[20:32]}"
                    user_id = uuid.UUID(user_id_str)
                    user = User.query.get(user_id)
                    
                    if user:
                        # Verify payment status with provider
                        verified_status = PaymentService.get_payment_status(external_id)
                        
                        if verified_status == 'completed':
                            # Verify payment and mark user as paid
                            success_verified = False
                            payment_amount = 0.0
                            
                            if payment:
                                payment_amount = float(payment.amount) if payment.amount else 0.0
                                # If payment is already completed (e.g. via webhook), still show success to user
                                if payment.status in ['pending', 'completed'] and payment_amount >= 99.0:
                                    success_verified = True
                                    payment.status = 'completed'
                            elif subscription:
                                # For subscriptions, we assume initial success if redirected here
                                # Webhooks will confirm later, but for UI we allow it
                                success_verified = True
                                subscription.status = 'active'
                                payment_amount = 100.0 # Default reg fee
                            
                            if success_verified:
                                if user and (not user.is_paid):
                                    user.is_paid = True
                                    # Award commission to agent if applicable
                                    try:
                                        from backend.services.agent_service import AgentService
                                        AgentService.award_commission(user)
                                    except ImportError:
                                        logger.warning("registration_callback: AgentService not found")
                                    
                                    # Send registration payment confirmation email
                                    try:
                                        from backend.services.email_service import EmailService
                                        EmailService.send_registration_payment_confirmation(user, payment_amount)
                                    except Exception as e:
                                        logger.warning("registration_callback: failed to send payment confirmation email: %s", e)
                                
                                db.session.commit()
                                
                                logger.info("registration_callback: payment/subscription successful user_id=%s", user.id)
                                return current_app.make_response((
                                    f'<html><body><script>window.location.href="{frontend_url}/payment-status?payment=success&external_id=' + (external_id or '') + '";</script></body></html>',
                                    302
                                ))
                            else:
                                logger.warning("registration_callback: payment verification failed user_id=%s", user.id)
                                return current_app.make_response((
                                    f'<html><body><script>window.location.href="{frontend_url}/payment-status?payment=error&reason=verification_failed&external_id=' + (external_id or '') + '";</script></body></html>',
                                    302
                                ))
                        elif callback_status == 'cancel':
                            if payment:
                                payment.status = 'cancelled'
                                db.session.commit()
                            return current_app.make_response((
                                f'<html><body><script>window.location.href="{frontend_url}/payment-status?payment=cancel&external_id=' + external_id + '";</script></body></html>',
                                302
                            ))
        
        # Failure case
        if payment and payment.status == 'pending':
            payment.status = 'failed'
            db.session.commit()
        
        return current_app.make_response((
            f'<html><body><script>window.location.href="{frontend_url}/payment-status?payment=error&external_id=' + external_id + '";</script></body></html>',
            302
        ))
        
    except Exception as e:
        logger.exception("registration_callback: failed")
        frontend_url_fallback = current_app.config.get('FRONTEND_URL', 'https://mzansiserve.co.za')
        return current_app.make_response((
            f'<html><body><script>window.location.href="{frontend_url_fallback}/?payment=error";</script></body></html>',
            302
        ))


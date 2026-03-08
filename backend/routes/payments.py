"""
Payment Routes
"""
import uuid
from flask import Blueprint, request, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from marshmallow import Schema, fields, ValidationError
from backend.models import Payment, ServiceRequest, User, Wallet
from backend.services.payment_service import PaymentService
from backend.services.wallet_service import WalletService
from backend.utils.response import success_response, error_response
from backend.utils.decorators import require_auth
from backend.extensions import db

bp = Blueprint('payments', __name__)

class CreateOrderSchema(Schema):
    items = fields.List(fields.Dict(), required=True)
    shipping_address = fields.Str(required=True)
    total = fields.Float(required=True)

@bp.route('/create-order', methods=['POST'])
@require_auth
def create_order():
    """Create a new shop order and initialize Yoco checkout"""
    try:
        from backend.models.shop import Order
        schema = CreateOrderSchema()
        data = schema.load(request.json)
        
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return error_response('USER_NOT_FOUND', 'User not found', None, 404)

        # 1. Create the Order in the database first
        order_id = f"ORD-{uuid.uuid4().hex[:8].upper()}"
        
        # Calculate amount in cents for Yoco
        amount_in_cents = int(data['total'] * 100)
        
        # 2. Initialize Yoco payment checkout
        backend_url = request.host_url.rstrip('/')
        success_url = f"{backend_url}/api/payments/order-callback?callback_status=success&external_id={order_id}&order_id={order_id}"
        cancel_url = f"{backend_url}/api/payments/order-callback?callback_status=cancel&external_id={order_id}&order_id={order_id}"
        failure_url = f"{backend_url}/api/payments/order-callback?callback_status=failure&external_id={order_id}&order_id={order_id}"
        
        checkout_result = PaymentService.create_checkout(
            amount=amount_in_cents,
            currency='ZAR',
            external_id=order_id,
            success_url=success_url,
            cancel_url=cancel_url,
            failure_url=failure_url
        )
        
        # 3. Save Order (Pending status)
        new_order = Order(
            id=order_id,
            customer_id=user.id,
            customer_email=user.email,
            status='pending',
            total=data['total'],
            items=data['items'],
            shipping={"address": data['shipping_address']},
            payment_id=checkout_result['payment_id']
        )
        db.session.add(new_order)
        db.session.commit()
        
        return success_response({
            'order_id': order_id,
            'checkout_id': checkout_result['checkout_id'],
            'redirect_url': checkout_result['redirect_url']
        })
        
    except ValidationError as e:
        return error_response('VALIDATION_ERROR', 'Invalid input data', e.messages, 400)
    except Exception as e:
        current_app.logger.error(f"Create order error: {str(e)}")
        db.session.rollback()
        return error_response('INTERNAL_ERROR', 'Failed to create order', None, 500)

class CreateCheckoutSchema(Schema):
    amount = fields.Int(required=True, validate=lambda x: x > 0)
    currency = fields.Str(required=True)
    external_id = fields.Str(required=True)
    success_url = fields.Str()
    cancel_url = fields.Str()
    failure_url = fields.Str()

@bp.route('/create-checkout', methods=['POST'])
@require_auth
def create_checkout():
    """Create payment checkout"""
    try:
        schema = CreateCheckoutSchema()
        data = schema.load(request.json)
        
        result = PaymentService.create_checkout(
            amount=data['amount'],
            currency=data['currency'],
            external_id=data['external_id'],
            success_url=data.get('success_url'),
            cancel_url=data.get('cancel_url'),
            failure_url=data.get('failure_url')
        )
        
        return success_response(result)
        
    except ValidationError as e:
        return error_response('VALIDATION_ERROR', 'Invalid input data', e.messages, 400)
    except ValueError as e:
        return error_response('INVALID_REQUEST', str(e), None, 400)
    except Exception as e:
        current_app.logger.error(f"Create checkout error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to create checkout', None, 500)

@bp.route('/status/<external_id>', methods=['GET'])
@require_auth
def get_payment_status(external_id):
    """Get payment status"""
    try:
        payment = Payment.query.filter_by(external_id=external_id).first()
        
        if not payment:
            return error_response('NOT_FOUND', 'Payment not found', None, 404)
        
        return success_response(payment.to_dict())
        
    except Exception as e:
        current_app.logger.error(f"Get payment status error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to get payment status', None, 500)

@bp.route('/webhook', methods=['POST'])
def payment_webhook():
    """Payment webhook handler"""
    try:
        data = request.json
        external_id = data.get('external_id')
        status = data.get('status')
        
        if not external_id or not status:
            return error_response('INVALID_REQUEST', 'Missing required fields', None, 400)
        
        PaymentService.update_payment_status(external_id, status, data)
        
        return success_response(None, 'Webhook processed successfully')
        
    except Exception as e:
        current_app.logger.error(f"Payment webhook error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to process webhook', None, 500)

@bp.route('/order-callback', methods=['GET'])
def order_payment_callback():
    """Handle order payment callback from Yoco"""
    try:
        from backend.models import Order
        
        callback_status = request.args.get('callback_status')
        external_id = request.args.get('external_id')
        order_id = request.args.get('order_id')
        
        current_app.logger.info(f"Order payment callback received: status={callback_status}, external_id={external_id}, order_id={order_id}")
        
        if not external_id or not order_id:
            frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:8080')
            return current_app.make_response((
                f'<html><body><script>window.location.href="{frontend_url}/shopping-history?payment=error";</script></body></html>',
                302
            ))
        
        # Find order and payment
        order = Order.query.get(order_id)
        payment = Payment.query.filter_by(external_id=external_id).first()
        
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:8080')
        if not order:
            current_app.logger.error(f"Order not found: {order_id}")
            return current_app.make_response((
                f'<html><body><script>window.location.href="{frontend_url}/shopping-history?payment=error";</script></body></html>',
                302
            ))
        
        if callback_status == 'success':
            if payment and payment.status == 'pending' and payment.amount > 0:
                # Update payment status
                payment.status = 'completed'
                # Update order status to 'paid'
                order.status = 'paid'
                order.payment_id = str(payment.id)
                db.session.commit()
                
                # Update inventory quantities for purchased products
                from backend.services.inventory_service import update_inventory_on_order_payment
                inventory_success, inventory_message = update_inventory_on_order_payment(order)
                if not inventory_success:
                    current_app.logger.error(f"Inventory update failed for order {order_id}: {inventory_message}")
                    # Payment is already processed, so we continue but log the error
                else:
                    current_app.logger.info(f"Inventory updated successfully for order {order_id}")
                
                current_app.logger.info(f"Order {order_id} payment successful: R{payment.amount:.2f}")
                
                # Send shop purchase confirmation email
                try:
                    from backend.models import User
                    from backend.services.email_service import EmailService
                    user = User.query.get(order.customer_id)
                    if user:
                        EmailService.send_shop_purchase_confirmation(user, order)
                except Exception as e:
                    current_app.logger.error(f"Failed to send shop purchase email: {str(e)}")
                
                return current_app.make_response((
                    f'<html><body><script>window.location.href="{frontend_url}/shopping-history?payment=success";</script></body></html>',
                    302
                ))
            else:
                current_app.logger.warning(f"Payment verification failed for order {order_id}")
        
        # Handle cancel - order remains pending, payment marked as cancelled
        if callback_status == 'cancel':
            if payment:
                payment.status = 'cancelled'
                # Order status remains 'pending' so user can retry payment
                db.session.commit()
            return current_app.make_response((
                f'<html><body><script>window.location.href="{frontend_url}/shopping-history?payment=cancelled";</script></body></html>',
                302
            ))
        
        # Failure case - order remains pending, payment marked as failed
        if payment:
            payment.status = 'failed'
            # Order status remains 'pending' so user can retry payment
            db.session.commit()
        
        return current_app.make_response((
            f'<html><body><script>window.location.href="{frontend_url}/shopping-history?payment=error";</script></body></html>',
            302
        ))
        
    except Exception as e:
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:8080')
        current_app.logger.error(f"Order payment callback error: {str(e)}")
        return current_app.make_response((
            f'<html><body><script>window.location.href="{frontend_url}/shopping-history?payment=error";</script></body></html>',
            302
        ))

@bp.route('/wallet-topup-callback', methods=['GET'])
def wallet_topup_callback():
    """Handle wallet top-up payment callback from Yoco"""
    try:
        callback_status = request.args.get('callback_status')
        external_id = request.args.get('external_id')
        
        current_app.logger.info(f"Wallet top-up callback received: status={callback_status}, external_id={external_id}")
        
        # Only process success callbacks
        if callback_status != 'success':
            frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:8080')
            return current_app.make_response((
                f'<html><body><script>window.location.href="{frontend_url}/wallet?payment=error";</script></body></html>',
                302
            ))
        
        if not external_id:
            frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:8080')
            return current_app.make_response((
                f'<html><body><script>window.location.href="{frontend_url}/wallet?payment=error";</script></body></html>',
                302
            ))
        
        # Find payment by external_id
        payment = Payment.query.filter_by(external_id=external_id).first()
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:8080')
        if not payment:
            current_app.logger.error(f"Payment not found for external_id: {external_id}")
            return current_app.make_response((
                f'<html><body><script>window.location.href="{frontend_url}/wallet?payment=error";</script></body></html>',
                302
            ))
        
        # Extract user_id and wallet_id from external_id (format: topup_{user_id_hex}_{random_hex})
        if external_id.startswith('topup_'):
            # Extract user_id_hex
            parts = external_id.split('_')
            if len(parts) >= 3:
                user_id_hex = parts[1]
                
                try:
                    # Convert hex string back to UUID
                    user_id_hex_clean = user_id_hex.replace('-', '')
                    if len(user_id_hex_clean) == 32:
                        user_id_str = f"{user_id_hex_clean[:8]}-{user_id_hex_clean[8:12]}-{user_id_hex_clean[12:16]}-{user_id_hex_clean[16:20]}-{user_id_hex_clean[20:32]}"
                        user_id = uuid.UUID(user_id_str)
                        user = User.query.get(user_id)
                        
                        if user:
                            # Get wallet
                            wallet = Wallet.query.filter_by(user_id=user_id).first()
                            if not wallet:
                                wallet = WalletService.get_or_create_wallet(user_id)
                            
                            # Verify payment and update wallet
                            if payment.status == 'pending' and payment.amount > 0:
                                # Add top-up transaction to wallet
                                top_up_amount = float(payment.amount)
                                WalletService.add_transaction(
                                    wallet_id=wallet.id,
                                    user_id=user_id,
                                    transaction_type='top-up',
                                    amount=top_up_amount,
                                    currency=payment.currency,
                                    external_id=external_id,
                                    description=f'Wallet top-up of R{top_up_amount:.2f}',
                                    metadata={'payment_id': str(payment.id)}
                                )
                                
                                # Update payment status
                                payment.status = 'completed'
                                db.session.commit()
                                
                                current_app.logger.info(f"User {user.id} wallet top-up successful: R{top_up_amount:.2f}")
                                
                                # Redirect to wallet with success message
                                return current_app.make_response((
                                    f'<html><body><script>window.location.href="{frontend_url}/wallet?payment=success";</script></body></html>',
                                    302
                                ))
                            else:
                                current_app.logger.warning(f"Payment verification failed for user {user.id}")
                except (ValueError, IndexError) as e:
                    current_app.logger.error(f"Error parsing user_id from external_id: {e}")
        
        # Redirect to wallet with error message
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:8080')
        return current_app.make_response((
            f'<html><body><script>window.location.href="{frontend_url}/wallet?payment=error";</script></body></html>',
            302
        ))
        
    except Exception as e:
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:8080')
        current_app.logger.error(f"Wallet top-up callback error: {str(e)}")
        return current_app.make_response((
            f'<html><body><script>window.location.href="{frontend_url}/wallet?payment=error";</script></body></html>',
            302
        ))


@bp.route('/request-callback', methods=['GET'])
def request_payment_callback():
    """
    Handle cab service request payment callback from Yoco.

    On success, mark the associated service request payment_status as 'paid'
    and show a brief message before redirecting the user to /requested-services.
    """
    try:
        callback_status = request.args.get('callback_status')
        external_id = request.args.get('external_id')
        request_id = request.args.get('request_id')

        current_app.logger.info(
            f"Request payment callback received: status={callback_status}, "
            f"external_id={external_id}, request_id={request_id}"
        )

        if not external_id or not request_id:
            frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:8080')
            # Missing data – redirect to requested-services with error
            return current_app.make_response((
                f'<html><body><script>window.location.href="{frontend_url}/my-bookings?payment=error";</script></body></html>',
                302
            ))

        service_request = ServiceRequest.query.get(request_id)
        payment = Payment.query.filter_by(external_id=external_id).first()

        if not service_request or not payment:
            frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:8080')
            current_app.logger.error(
                f"Request or payment not found for request_id={request_id}, external_id={external_id}"
            )
            return current_app.make_response((
                f'<html><body><script>window.location.href="{frontend_url}/my-bookings?payment=error";</script></body></html>',
                302
            ))

        # Only handle success with a 3-second information screen
        if callback_status == 'success':
            try:
                # Verify payment and update request/payment
                if payment.status == 'pending' and float(payment.amount) > 0:
                    payment.status = 'completed'
                    service_request.payment_status = 'paid'
                    service_request.status = 'pending'  # unpaid -> pending so providers can see it
                    db.session.commit()
                    current_app.logger.info(
                        f"Service request {request_id} payment successful: R{float(payment.amount):.2f}"
                    )
                    
                    # Send call-out payment confirmation email
                    try:
                        from backend.models import User
                        from backend.services.email_service import EmailService
                        user = User.query.get(service_request.requester_id)
                        if user:
                            EmailService.send_callout_payment_confirmation(user, service_request, float(payment.amount))
                    except Exception as e:
                        current_app.logger.error(f"Failed to send call-out payment email: {str(e)}")
            except Exception as e:
                current_app.logger.error(f"Error finalizing request payment: {e}")

            # Show brief message then redirect after 3 seconds
            html = """
                <html>
                  <head>
                    <title>Payment Successful</title>
                    <style>
                      body { margin:0; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
                      .overlay {
                        position: fixed;
                        inset: 0;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        background: rgba(15, 23, 42, 0.85);
                        color: white;
                        z-index: 50;
                      }
                      .card {
                        background: #0f172a;
                        padding: 2rem 3rem;
                        border-radius: 0.75rem;
                        box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.8);
                        text-align: center;
                      }
                      .card h1 { font-size: 1.5rem; margin-bottom: 0.75rem; }
                      .card p { font-size: 0.95rem; opacity: 0.9; }
                    </style>
                    <script>
                      setTimeout(function () {
                        var frontend_url = "%s";
                        window.location.href = frontend_url + "/my-bookings";
                      }, 3000);
                    </script>
                  </head>
                  <body>
                    <div class="overlay">
                      <div class="card">
                        <h1>Payment Successful</h1>
                        <p>Your service request has been created and paid successfully.</p>
                        <p>You will be redirected to your booked services in a moment...</p>
                      </div>
                    </div>
                  </body>
                </html>
            """
            frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:8080')
            return current_app.make_response((html % frontend_url, 200))

        # Cancel or failure - just redirect back with an error flag
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:8080')
        return current_app.make_response((
            f'<html><body><script>window.location.href="{frontend_url}/my-bookings?payment=error";</script></body></html>',
            302
        ))

    except Exception as e:
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:8080')
        current_app.logger.error(f"Request payment callback error: {str(e)}")
        return current_app.make_response((
            f'<html><body><script>window.location.href="{frontend_url}/my-bookings?payment=error";</script></body></html>',
            302
        ))


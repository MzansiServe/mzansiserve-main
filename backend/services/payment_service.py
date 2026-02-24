"""
Payment Service - Yoco Integration
"""
import logging
import time

import requests
from flask import current_app

from backend.models import Payment
from backend.extensions import db
from backend.utils.logging import log_external_api

logger = logging.getLogger(__name__)


class PaymentService:
    """Service for payment processing with Yoco"""
    
    @staticmethod
    def create_checkout(amount, currency, external_id, success_url=None, cancel_url=None, failure_url=None):
        """
        Create a Yoco checkout session
        
        Args:
            amount: Amount in cents (integer)
            currency: Currency code (e.g., 'ZAR')
            external_id: External ID to track payment
            success_url: Success redirect URL
            cancel_url: Cancel redirect URL
            failure_url: Failure redirect URL
        
        Returns:
            dict: Checkout response with checkout_id and redirect_url
        """
        yoco_secret_key = current_app.config.get('YOCO_SECRET_KEY')
        yoco_api_url = current_app.config.get('YOCO_API_URL', 'https://payments.yoco.com')
        
        if not yoco_secret_key:
            logger.error("create_checkout: YOCO_SECRET_KEY not configured")
            raise ValueError("YOCO_SECRET_KEY not configured")

        logger.info("create_checkout: external_id=%s amount=%s currency=%s", external_id, amount, currency)

        # Prepare checkout data
        checkout_data = {
            'amount': amount,
            'currency': currency,
            'externalId': external_id
        }
        
        # Set callback URLs (use default if not provided)
        base_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5000')
        checkout_data['successUrl'] = success_url or f"{base_url}/api/payments/callback?callback_status=success"
        checkout_data['cancelUrl'] = cancel_url or f"{base_url}/api/payments/callback?callback_status=cancel"
        checkout_data['failureUrl'] = failure_url or f"{base_url}/api/payments/callback?callback_status=failure"
        
        # Make request to Yoco API
        headers = {
            'Authorization': f'Bearer {yoco_secret_key}',
            'Content-Type': 'application/json'
        }
        
        try:
            last_error = None
            for attempt, i in enumerate(range(3)):
                if i > 0:
                    delay = 2 ** i
                    logger.debug("create_checkout: retry attempt %s after %ss sleep", attempt + 1, delay)
                    time.sleep(delay)
                response = requests.post(
                    f"{yoco_api_url}/api/checkouts",
                    json=checkout_data,
                    headers=headers,
                    timeout=30
                )
                
                # Log the API call
                try:
                    resp_json = response.json()
                except:
                    resp_json = {'text': response.text}
                    
                log_external_api(
                    provider='yoco',
                    endpoint='/api/checkouts',
                    method='POST',
                    request_payload=checkout_data,
                    response_payload=resp_json,
                    status_code=response.status_code
                )

                if response.ok:
                    try:
                        response_data = response.json()
                    except Exception as e:
                        last_error = f"Invalid JSON response: {e}"
                        logger.warning("create_checkout: attempt %s invalid JSON: %s", attempt + 1, e)
                        continue
                    if response_data.get('redirectUrl') is not None:
                        last_error = None
                        logger.info("create_checkout: success attempt=%s checkout_id=%s", attempt + 1, response_data.get('id'))
                        break
                    last_error = "Yoco API response missing redirectUrl"
                    logger.warning("create_checkout: attempt %s missing redirectUrl", attempt + 1)
                    continue
                try:
                    err_body = response.json()
                    msg = f"Yoco error ({response.status_code}): {err_body.get('message', 'No message')} | {err_body}"
                except Exception:
                    msg = f"Yoco error ({response.status_code}): {response.text or 'Unknown error'}"
                last_error = msg
                logger.warning("create_checkout: attempt %s response not ok: %s", attempt + 1, msg)

            if last_error:
                logger.warning("create_checkout: failed after 3 attempts: %s", last_error)
                raise Exception(last_error)

            # Create payment record
            payment = Payment(
                external_id=external_id,
                amount=amount / 100.0,  # Convert cents to currency units
                currency=currency,
                status='pending',
                payment_method='yoco',
                payment_provider_id=response_data.get('id'),
                meta_data=response_data
            )
            db.session.add(payment)
            db.session.commit()

            return {
                'checkout_id': response_data.get('id'),
                'redirect_url': response_data.get('redirectUrl'),
                'payment_id': str(payment.id)
            }
        except requests.RequestException as e:
            logger.exception("create_checkout: request failed")
            raise Exception(f"Failed to connect to Yoco API: {str(e)}")
    
    @staticmethod
    def update_payment_status(external_id, status, metadata=None):
        """Update payment status"""
        payment = Payment.query.filter_by(external_id=external_id).first()
        if not payment:
            logger.warning("update_payment_status: payment not found external_id=%s", external_id)
            return None
        payment.status = status
        if metadata:
            payment.meta_data.update(metadata)
        db.session.commit()
        logger.debug("update_payment_status: external_id=%s status=%s", external_id, status)
        return payment


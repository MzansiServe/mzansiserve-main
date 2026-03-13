"""
Payment Service - Abstraction Layer for Multiple Providers
"""
import logging
from flask import current_app
from typing import Dict, Any, Optional

from backend.models import Payment, Subscription, SubscriptionPlan
from backend.extensions import db
from backend.services.payment_providers.yoco import YocoProvider
from backend.services.payment_providers.paypal import PayPalProvider

logger = logging.getLogger(__name__)

class PaymentService:
    """Service for payment processing with multiple providers"""
    
    @staticmethod
    def _get_provider(provider_name: str = 'yoco'):
        """Factory method to get the correct payment provider"""
        provider = None
        if provider_name == 'yoco':
            provider = YocoProvider()
        elif provider_name == 'paypal':
            provider = PayPalProvider()
        else:
            raise ValueError(f"Unsupported payment provider: {provider_name}")
            
        if not getattr(provider, 'enabled', False):
            logger.warning(f"Payment provider {provider_name} is disabled.")
            raise ValueError(f"Payment provider {provider_name} is currently disabled.")
            
        return provider

    @staticmethod
    def create_checkout(amount, currency, external_id, success_url=None, cancel_url=None, failure_url=None, provider='yoco'):
        """
        Create a checkout session using the specified provider
        """
        p = PaymentService._get_provider(provider)
        return p.create_checkout(
            amount=amount,
            currency=currency,
            external_id=external_id,
            success_url=success_url,
            cancel_url=cancel_url,
            failure_url=failure_url
        )
    
    @staticmethod
    def get_payment_status(external_id: str) -> str:
        """Get payment status from the correct provider"""
        payment = Payment.query.filter_by(external_id=external_id).first()
        if not payment:
            logger.warning("get_payment_status: payment not found external_id=%s", external_id)
            return 'not_found'
            
        provider_name = payment.payment_method or 'yoco'
        try:
            p = PaymentService._get_provider(provider_name)
            return p.get_payment_status(external_id)
        except Exception as e:
            logger.error("get_payment_status: error with provider %s: %s", provider_name, str(e))
            return payment.status

    @staticmethod
    def update_payment_status(external_id, status, metadata=None):
        """Update payment status in database"""
        payment = Payment.query.filter_by(external_id=external_id).first()
        if payment:
            payment.status = status
            if metadata:
                payment.meta_data = metadata
            db.session.commit()
            logger.info(f"Payment {external_id} updated to {status}")
            return True
        return False
    @staticmethod
    def create_subscription(user_id, plan_id, success_url, cancel_url, provider='paypal'):
        """
        Create a recurring subscription
        """
        p = PaymentService._get_provider(provider)
        return p.create_subscription(
            user_id=user_id,
            plan_id=plan_id,
            success_url=success_url,
            cancel_url=cancel_url
        )

    @staticmethod
    def create_subscription_plan(name, description, price, currency, interval, provider='paypal'):
        """
        Create a subscription plan
        """
        p = PaymentService._get_provider(provider)
        return p.create_subscription_plan(
            name=name,
            description=description,
            price=price,
            currency=currency,
            interval=interval
        )

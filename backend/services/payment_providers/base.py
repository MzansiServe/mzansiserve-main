from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class PaymentProvider(ABC):
    @abstractmethod
    def create_checkout(
        self,
        amount: int,
        currency: str,
        external_id: str,
        success_url: Optional[str] = None,
        cancel_url: Optional[str] = None,
        failure_url: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Create a checkout/payment session.
        Amount should be in the smallest currency unit (e.g., cents).
        """
        pass

    @abstractmethod
    def handle_webhook(self, data: Dict[str, Any], headers: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Handle incoming webhook notifications from the provider.
        """
        pass

    @abstractmethod
    def create_subscription(
        self,
        user_id: str,
        plan_id: str,
        success_url: str,
        cancel_url: str
    ) -> Dict[str, Any]:
        """
        Create a recurring subscription for a user.
        """
        pass

    @abstractmethod
    def create_subscription_plan(
        self,
        name: str,
        description: str,
        price: float,
        currency: str,
        interval: str
    ) -> Dict[str, Any]:
        """
        Create a subscription plan in the provider's system.
        """
        pass

    @abstractmethod
    def get_payment_status(self, external_id: str) -> str:
        """
        Query the provider for the status of a payment.
        """
        pass

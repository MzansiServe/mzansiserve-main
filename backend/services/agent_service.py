"""
Agent and Affiliate Service
"""
import logging
from decimal import Decimal
from backend.models import User, AgentCommission, AppSetting, Wallet
from backend.services.wallet_service import WalletService
from backend.extensions import db

logger = logging.getLogger(__name__)

class AgentService:
    """Service for managing agent commissions and rewards"""
    
    @staticmethod
    def award_commission(recruited_user):
        """
        Award commission to an agent when a recruited user pays their registration fee.
        
        Args:
            recruited_user (User): The user who just paid their fee
        """
        if not recruited_user.agent_id:
            return None
            
        try:
            # The agent_id on User model currently refers to the Agent table (legacy)
            # We need to find if there's a User with role='agent' that matches the agent code
            # For simplicity, let's assume the agent_id on User refers to the Agent model's ID
            from backend.models import Agent
            agent_record = Agent.query.get(recruited_user.agent_id)
            if not agent_record:
                logger.warning(f"Agent record not found for user {recruited_user.id}")
                return None
                
            # Find the actual User account for this agent to award funds to their wallet
            # We match by agent_id (the code like AGT001)
            agent_user = User.query.filter_by(role='agent', tracking_number=agent_record.agent_id).first()
            if not agent_user:
                logger.warning(f"Agent user account not found for code {agent_record.agent_id}")
                return None
                
            # Get commission rate from settings
            # We can have different rates per recruited user role
            setting_key = f'agent_commission_{recruited_user.role}'
            setting = AppSetting.query.get(setting_key) or AppSetting.query.get('agent_commission_default')
            
            # Default to R20 if not set
            commission_amount = Decimal(str(setting.value)) if setting else Decimal('20.00')
            
            # Create commission record
            commission = AgentCommission(
                agent_id=agent_user.id,
                recruited_user_id=recruited_user.id,
                amount=commission_amount
            )
            db.session.add(commission)
            
            # Award to agent's wallet
            wallet = WalletService.get_or_create_wallet(agent_user.id)
            WalletService.add_transaction(
                wallet_id=wallet.id,
                user_id=agent_user.id,
                transaction_type='credit',
                amount=float(commission_amount),
                external_id=str(recruited_user.id),
                description=f"Commission for recruiting {recruited_user.role} ({recruited_user.email})"
            )
            
            db.session.commit()
            logger.info(f"Awarded R{commission_amount} commission to agent {agent_user.email} for user {recruited_user.email}")
            return commission
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Failed to award commission: {str(e)}")
            return None

    @staticmethod
    def get_agent_stats(agent_user_id):
        """Get performance stats for an agent"""
        try:
            total_earned = db.session.query(db.func.sum(AgentCommission.amount))\
                .filter_by(agent_id=agent_user_id).scalar() or 0
                
            total_recruits = AgentCommission.query.filter_by(agent_id=agent_user_id).count()
            
            recent_commissions = AgentCommission.query.filter_by(agent_id=agent_user_id)\
                .order_by(AgentCommission.created_at.desc()).limit(10).all()
                
            return {
                'total_earned': float(total_earned),
                'total_recruits': total_recruits,
                'recent_commissions': [c.to_dict() for c in recent_commissions]
            }
        except Exception as e:
            logger.error(f"Error getting agent stats: {str(e)}")
            return None

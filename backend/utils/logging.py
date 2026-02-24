"""
API Logging Utilities
"""
from backend.models.api_log import ExternalApiLog
from backend.extensions import db
from flask import current_app

def log_external_api(provider, endpoint, method, request_payload=None, response_payload=None, status_code=None, error_message=None):
    """Log an external API call to the database"""
    try:
        log = ExternalApiLog(
            provider=provider,
            endpoint=endpoint,
            method=method,
            request_payload=request_payload,
            response_payload=response_payload,
            status_code=status_code,
            error_message=error_message
        )
        db.session.add(log)
        db.session.commit()
        return log
    except Exception as e:
        # Don't let logging failures crash the main process
        if current_app:
            current_app.logger.error(f"Failed to log external API call: {str(e)}")
        return None

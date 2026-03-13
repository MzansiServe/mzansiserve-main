import logging
import traceback
import uuid
from flask import request, current_app, jsonify
from backend.utils.response import error_response

class RequestIdFilter(logging.Filter):
    """Logging filter to inject request_id into log records."""
    def filter(self, record):
        record.request_id = getattr(request, 'request_id', 'no-id') if request else 'no-id'
        return True

def setup_error_handlers(app):
    """Register global error handlers for the Flask application."""
    
    @app.errorhandler(Exception)
    def handle_exception(e):
        """Handle unhandled exceptions and return a consistent JSON response."""
        # Log the full stack trace for internal debugging
        current_app.logger.error(f"Unhandled Exception: {str(e)}\n{traceback.format_exc()}")
        
        # Determine status code
        status_code = getattr(e, 'code', 500)
        
        # For API requests, return JSON
        if request.path.startswith('/api/'):
            return error_response(
                'INTERNAL_SERVER_ERROR',
                str(e) if current_app.debug else 'An unexpected error occurred.',
                None,
                status_code
            )
        
        # Fallback for non-API requests (if any)
        return jsonify({
            'success': False,
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred.'
        }), status_code

def request_trace_middleware(app):
    """Middleware to add a unique request ID to every request for tracing."""
    
    @app.before_request
    def add_request_id():
        request_id = request.headers.get('X-Request-ID') or str(uuid.uuid4())
        # Attach to request context
        request.request_id = request_id
        
    @app.after_request
    def add_request_id_to_response(response):
        if hasattr(request, 'request_id'):
            response.headers['X-Request-ID'] = request.request_id
        return response

"""
Response Utilities
"""
from flask import jsonify

def success_response(data=None, message=None, status_code=200):
    """Create a success response"""
    response = {
        'success': True,
        'data': data
    }
    if message:
        response['message'] = message
    return jsonify(response), status_code

def error_response(error_code, message, details=None, status_code=400):
    """Create an error response"""
    response = {
        'success': False,
        'error': {
            'code': error_code,
            'message': message
        }
    }
    if details:
        response['error']['details'] = details
    return jsonify(response), status_code


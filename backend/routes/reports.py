"""
User Reporting Routes
"""
from flask import Blueprint, request, current_app
from flask_jwt_extended import get_jwt_identity
from backend.models import Report, ServiceRequest, User
from backend.extensions import db
from backend.utils.response import success_response, error_response
from backend.utils.decorators import require_auth

bp = Blueprint('reports', __name__)

@bp.route('', methods=['POST'])
@require_auth
def create_report():
    """Submit a new report"""
    try:
        user_id = get_jwt_identity()
        data = request.json
        
        reason = data.get('reason')
        description = data.get('description')
        request_id = data.get('request_id')
        reported_user_id = data.get('reported_user_id')
        
        if not reason or not description:
            return error_response('INVALID_REQUEST', 'Reason and description are required', None, 400)
            
        # Optional: Verify request ownership or participation
        if request_id:
            service_req = ServiceRequest.query.get(request_id)
            if service_req:
                if not reported_user_id:
                    # Auto-detect reported user if it's about a request
                    if str(service_req.requester_id) == user_id:
                        reported_user_id = service_req.provider_id
                    elif str(service_req.provider_id) == user_id:
                        reported_user_id = service_req.requester_id
        
        new_report = Report(
            reporter_id=user_id,
            reported_user_id=reported_user_id,
            service_request_id=request_id,
            reason=reason,
            description=description
        )
        
        db.session.add(new_report)
        db.session.commit()
        
        return success_response(new_report.to_dict(), 'Report submitted successfully')
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Create report error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to submit report', None, 500)

@bp.route('/my-reports', methods=['GET'])
@require_auth
def get_my_reports():
    """Get reports made by the current user"""
    try:
        user_id = get_jwt_identity()
        reports = Report.query.filter_by(reporter_id=user_id).order_by(Report.created_at.desc()).all()
        return success_response([r.to_dict() for r in reports])
    except Exception as e:
        current_app.logger.error(f"Get my reports error: {str(e)}")
        return error_response('INTERNAL_ERROR', 'Failed to get reports', None, 500)

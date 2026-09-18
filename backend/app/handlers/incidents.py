import json
import logging
from typing import Any, Dict
from app.repositories.incident_repository import IncidentRepository
from app.domain.enums import IncidentStatus

logger = logging.getLogger("incidents_handler")
logger.setLevel(logging.INFO)

repository = IncidentRepository()

def build_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps(body)
    }

def lambda_handler(event: dict, context: Any) -> dict:
    http_method = event.get("requestContext", {}).get("http", {}).get("method", "")

    if http_method == "GET":
        path_parameters = event.get("pathParameters") or {}
        if "incidentId" in path_parameters:
            return handle_get_incident(event, context)
        else:
            return handle_list_incidents(event, context)
    else:
        return build_response(405, {"error": {"code": "METHOD_NOT_ALLOWED", "message": "Method not allowed"}})

def handle_get_incident(event: dict, context: Any) -> dict:
    try:
        incident_id = event["pathParameters"]["incidentId"]
        incident = repository.get_incident(incident_id)
        if not incident:
            return build_response(404, {"error": {"code": "NOT_FOUND", "message": "Incident not found"}})
            
        return build_response(200, incident)
    except Exception as e:
        logger.error(f"Internal Error fetching incident: {str(e)}")
        return build_response(500, {"error": {"code": "INTERNAL_SERVER_ERROR", "message": "An unexpected error occurred"}})

def handle_list_incidents(event: dict, context: Any) -> dict:
    try:
        query_params = event.get("queryStringParameters") or {}
        # Default to new/analyzed if not specified for testing
        status_str = query_params.get("status", "analyzed")
        
        try:
            status = IncidentStatus(status_str)
        except ValueError:
            return build_response(400, {"error": {"code": "INVALID_REQUEST", "message": f"Invalid status: {status_str}"}})
            
        limit = min(int(query_params.get("limit", 10)), 50)
        
        incidents = repository.list_recent_incidents(status=status, limit=limit)
        return build_response(200, {"incidents": incidents})
        
    except ValueError as e:
        return build_response(400, {"error": {"code": "INVALID_REQUEST", "message": "Invalid query parameters"}})
    except Exception as e:
        logger.error(f"Internal Error listing incidents: {str(e)}")
        return build_response(500, {"error": {"code": "INTERNAL_SERVER_ERROR", "message": "An unexpected error occurred"}})

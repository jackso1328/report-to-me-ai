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
    elif http_method == "PATCH":
        return handle_update_incident_review(event, context)
    else:
        return build_response(405, {"error": {"code": "METHOD_NOT_ALLOWED", "message": "Method not allowed"}})

def handle_get_incident(event: dict, context: Any) -> dict:
    try:
        incident_id = event["pathParameters"]["incidentId"]
        incident = repository.get_incident(incident_id)
        if not incident:
            return build_response(404, {"error": {"code": "NOT_FOUND", "message": "Incident not found"}})
            
        incident.pop("taskToken", None)
        
        # Append latest Response Packet if available
        packet = repository.get_latest_response_packet(incident_id)
        if packet:
            incident["responsePacket"] = packet
            
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
        for incident in incidents:
            incident.pop("taskToken", None)
        return build_response(200, {"incidents": incidents})
        
    except ValueError as e:
        return build_response(400, {"error": {"code": "INVALID_REQUEST", "message": "Invalid query parameters"}})
    except Exception as e:
        logger.error(f"Internal Error listing incidents: {str(e)}")
        return build_response(500, {"error": {"code": "INTERNAL_SERVER_ERROR", "message": "An unexpected error occurred"}})

def handle_update_incident_review(event: dict, context: Any) -> dict:
    try:
        incident_id = event["pathParameters"]["incidentId"]
        body = json.loads(event.get("body", "{}"))
        new_status_str = body.get("status")
        comments = body.get("comments", "")
        
        if not new_status_str:
            return build_response(400, {"error": {"code": "INVALID_REQUEST", "message": "Missing 'status' in body"}})
            
        try:
            new_status = IncidentStatus(new_status_str)
        except ValueError:
            return build_response(400, {"error": {"code": "INVALID_REQUEST", "message": f"Invalid status: {new_status_str}"}})
            
        # Fetch incident to check active review and get taskToken
        incident = repository.get_incident(incident_id)
        if not incident:
            return build_response(404, {"error": {"code": "NOT_FOUND", "message": "Incident not found"}})
            
        if incident.get("status") != IncidentStatus.human_review.value:
            return build_response(400, {"error": {"code": "INVALID_REQUEST", "message": "Incident is not awaiting human review"}})
            
        task_token = incident.get("taskToken")
        if not task_token:
            return build_response(400, {"error": {"code": "INVALID_REQUEST", "message": "No active review workflow found"}})
            
        # SendTaskSuccess to Step Functions
        import boto3
        from app.config.settings import settings
        
        sfn = boto3.client('stepfunctions', region_name=settings.aws_region)
        output_payload = {
            "status": new_status_str,
            "comments": comments,
            "reviewer": "human_reviewer"  # In a real app, from auth token
        }
        
        try:
            sfn.send_task_success(
                taskToken=task_token,
                output=json.dumps(output_payload)
            )
        except Exception as sfn_err:
            logger.error(f"Failed to send task success to Step Functions: {sfn_err}")
            return build_response(500, {"error": {"code": "INTERNAL_SERVER_ERROR", "message": "Failed to submit review"}})
            
        # Do NOT update DynamoDB here. Step Functions will persist the decision.
        # We return the exact authoritative state from DynamoDB, but we can set processingState 
        # to indicate it was submitted. The UI should not pretend the decision is durable yet.
        incident["processingState"] = "review_submitted"
        incident.pop("taskToken", None)
        
        return build_response(200, incident)
        
    except json.JSONDecodeError:
        return build_response(400, {"error": {"code": "INVALID_REQUEST", "message": "Invalid JSON body"}})
    except Exception as e:
        logger.error(f"Internal Error updating incident: {str(e)}")
        return build_response(500, {"error": {"code": "INTERNAL_SERVER_ERROR", "message": "An unexpected error occurred"}})

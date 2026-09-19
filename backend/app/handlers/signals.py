import json
import logging
from typing import Any, Dict
from app.services.signal_processor import SignalProcessor
from app.repositories.incident_repository import IncidentRepository
from pydantic import ValidationError

logger = logging.getLogger("signals_handler")
logger.setLevel(logging.INFO)

processor = SignalProcessor()
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
    path = event.get("rawPath", "")

    if http_method == "POST":
        return handle_post(event, context)
    elif http_method == "GET":
        return handle_get(event, context)
    else:
        return build_response(405, {"error": {"code": "METHOD_NOT_ALLOWED", "message": "Method not allowed"}})

def handle_post(event: dict, context: Any) -> dict:
    try:
        body = json.loads(event.get("body", "{}"))
        
        # Idempotency
        headers = event.get("headers", {})
        idempotency_key = headers.get("idempotency-key") or headers.get("Idempotency-Key")
        
        incident = processor.process_signal(body, idempotency_key=idempotency_key)
        
        # If it was queued or failed queueing, it's accepted. We return 202.
        # If it was a duplicate, it will just return the existing incident.
        status_code = 202 if incident.get("processingState") in ["queued", "pending", "failed"] else 200
        return build_response(status_code, incident)
        
    except ValueError as e:
        logger.warning(f"Validation Error: {str(e)}")
        return build_response(400, {"error": {"code": "INVALID_REQUEST", "message": str(e)}})
    except ValidationError as e:
        logger.warning(f"Schema Validation Error: {str(e)}")
        return build_response(400, {"error": {"code": "INVALID_REQUEST", "message": "Invalid request schema"}})
    except Exception as e:
        logger.error(f"Internal Error: {str(e)}")
        # Check if it's an AI error
        if "ValidationException" in str(e) or "AccessDeniedException" in str(e) or "Bedrock" in str(e):
            return build_response(502, {"error": {"code": "AI_ANALYSIS_FAILED", "message": "AI Provider analysis failed"}})
        
        return build_response(500, {"error": {"code": "INTERNAL_SERVER_ERROR", "message": "An unexpected error occurred"}})

def handle_get(event: dict, context: Any) -> dict:
    try:
        path_parameters = event.get("pathParameters", {})
        signal_id = path_parameters.get("signalId")
        if not signal_id:
            return build_response(400, {"error": {"code": "INVALID_REQUEST", "message": "Missing signalId"}})
            
        signal = repository.get_signal(signal_id)
        if not signal:
            return build_response(404, {"error": {"code": "NOT_FOUND", "message": "Signal not found"}})
            
        return build_response(200, signal)
    except Exception as e:
        logger.error(f"Internal Error fetching signal: {str(e)}")
        return build_response(500, {"error": {"code": "INTERNAL_SERVER_ERROR", "message": "An unexpected error occurred"}})

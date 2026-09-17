import json
from app.utils.logging import get_logger

logger = get_logger("health_handler")

def lambda_handler(event, context):
    request_id = ""
    if context and hasattr(context, "aws_request_id"):
        request_id = context.aws_request_id
        
    logger.info(
        "Health check requested",
        requestId=request_id,
        operation="health_check"
    )

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps({
            "status": "ok",
            "service": "report-to-me-api"
        })
    }

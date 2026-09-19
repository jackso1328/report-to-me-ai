import json
import logging
import uuid
import os
import boto3
from typing import Any, Dict
from botocore.exceptions import ClientError

logger = logging.getLogger("evidence_handler")
logger.setLevel(logging.INFO)

# Config
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

s3_client = boto3.client('s3')

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
    if http_method != "POST":
        return build_response(405, {"error": {"code": "METHOD_NOT_ALLOWED", "message": "Method not allowed"}})

    try:
        body = json.loads(event.get("body", "{}"))
        content_type = body.get("contentType")
        size = body.get("size")

        if not content_type or not size:
            return build_response(400, {"error": {"code": "INVALID_REQUEST", "message": "Missing contentType or size"}})

        if content_type not in ALLOWED_CONTENT_TYPES:
            return build_response(400, {"error": {"code": "INVALID_CONTENT_TYPE", "message": "Content type not allowed"}})

        if not isinstance(size, int) or size > MAX_SIZE_BYTES or size <= 0:
            return build_response(400, {"error": {"code": "INVALID_SIZE", "message": "File size exceeds limit or is invalid"}})

        evidence_id = str(uuid.uuid4())
        object_key = f"evidence/{evidence_id}"
        bucket_name = os.environ.get("EVIDENCE_BUCKET")

        if not bucket_name:
            logger.error("EVIDENCE_BUCKET environment variable not set")
            return build_response(500, {"error": {"code": "INTERNAL_ERROR", "message": "Server configuration error"}})

        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': bucket_name,
                'Key': object_key,
                'ContentType': content_type
            },
            ExpiresIn=300 # 5 minutes
        )

        return build_response(201, {
            "uploadUrl": presigned_url,
            "evidenceId": evidence_id,
            "objectKey": object_key
        })

    except json.JSONDecodeError:
        return build_response(400, {"error": {"code": "INVALID_REQUEST", "message": "Invalid JSON body"}})
    except ClientError as e:
        logger.error(f"S3 ClientError: {e}")
        return build_response(500, {"error": {"code": "INTERNAL_SERVER_ERROR", "message": "Failed to generate upload URL"}})
    except Exception as e:
        logger.error(f"Internal Error: {str(e)}")
        return build_response(500, {"error": {"code": "INTERNAL_SERVER_ERROR", "message": "An unexpected error occurred"}})

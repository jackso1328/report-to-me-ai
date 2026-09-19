import os
import json
import logging
from typing import Any, Dict
from opensearchpy import OpenSearch, RequestsHttpConnection
from requests_aws4auth import AWS4Auth
import boto3

logger = logging.getLogger(__name__)
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

INDEX_NAME = os.environ.get("OPENSEARCH_INDEX_NAME", "incident-memory-v1")
OPENSEARCH_ENDPOINT = os.environ.get("OPENSEARCH_ENDPOINT", "")

# Initialize OpenSearch client outside handler for connection reuse
def get_opensearch_client():
    if not OPENSEARCH_ENDPOINT:
        return None
        
    region = os.environ.get('AWS_REGION', 'us-east-1')
    credentials = boto3.Session().get_credentials()
    
    # Ensure credentials exist (they might not in some local tests unless mocked)
    if not credentials:
        return None
        
    awsauth = AWS4Auth(
        credentials.access_key,
        credentials.secret_key,
        region,
        'aoss',  # Amazon OpenSearch Serverless service name
        session_token=credentials.token
    )

    # Use HTTP endpoint without https:// prefix for hosts list
    host = OPENSEARCH_ENDPOINT.replace("https://", "").replace("http://", "")
    
    client = OpenSearch(
        hosts=[{'host': host, 'port': 443}],
        http_auth=awsauth,
        use_ssl=True,
        verify_certs=True,
        connection_class=RequestsHttpConnection,
        timeout=10
    )
    return client

# Global client
os_client = get_opensearch_client()

def lambda_handler(event: Dict[str, Any], context: Any):
    if not os_client:
        logger.warning("OpenSearch client not initialized. Skipping indexing.")
        return

    # EventBridge sends a single dict. SQS/DynamoDB wrap in 'Records'.
    records = event.get('Records', [event])

    for record in records:
        try:
            # EventBridge wraps the event in "Records" if it comes via SQS (but we are direct from EventBridge)
            # Actually EventBridge to Lambda payload is just the event itself, not a list of Records.
            # So if event has 'detail', it's a direct EventBridge invocation.
            body = record if 'detail' in record else None
            
            # If it was wrapped (e.g. SQS DLQ), parse it
            if 'body' in record:
                body = json.loads(record['body'])
                
            if not body or 'detail' not in body:
                continue
                
            detail = body['detail']
            incident_id = detail.get('incidentId')
            
            if not incident_id:
                logger.warning("Missing incidentId in event payload")
                continue
                
            # Upsert into OpenSearch
            doc_id = incident_id
            doc = {
                "incidentId": incident_id,
                "category": detail.get('category'),
                "severity": detail.get('severity'),
                "status": detail.get('status'),
                "resolution": detail.get('resolution'),
                "resolutionStatus": detail.get('resolutionStatus'),
                "createdAt": detail.get('createdAt'),
                "eventType": detail.get('eventType'),
                "object": detail.get('object'),
                "summary": detail.get('summary'),
                "schemaVersion": "1.0"
            }
            
            logger.info(f"Indexing incident {incident_id}")
            response = os_client.index(
                index=INDEX_NAME,
                body=doc,
                id=doc_id,
                refresh=False # Eventual consistency is fine
            )
            logger.info(f"Indexed successfully: {response.get('result')}")
            
        except Exception as e:
            logger.error(f"Failed to index record: {e}")
            raise e

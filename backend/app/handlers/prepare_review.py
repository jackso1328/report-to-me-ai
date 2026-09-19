import os
import boto3
from typing import Any, Dict

dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('TABLE_NAME', '')
table = dynamodb.Table(table_name) if table_name else None

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    incident_id = event.get('incidentId')
    task_token = event.get('taskToken')
    execution_id = event.get('executionId')
    
    if not incident_id or not task_token:
        raise ValueError("Missing incidentId or taskToken")

    table.update_item(
        Key={
            'PK': f'INCIDENT#{incident_id}',
            'SK': 'META'
        },
        UpdateExpression='SET taskToken = :token, reviewState = :pending, reviewExecutionId = :execId',
        ConditionExpression='attribute_not_exists(reviewState)',
        ExpressionAttributeValues={
            ':token': task_token,
            ':pending': 'pending',
            ':execId': execution_id
        }
    )
    
    return {"status": "prepared"}

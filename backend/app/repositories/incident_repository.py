import boto3
from botocore.exceptions import ClientError
from datetime import datetime
from typing import Optional, List, Dict, Any
import json

from app.config.settings import settings
from app.domain.models import Signal, AIAnalysis, Decision
from app.domain.enums import IncidentStatus

class IncidentRepository:
    def __init__(self, dynamodb_client=None):
        self.dynamodb = dynamodb_client or boto3.client('dynamodb', region_name=settings.aws_region)
        self.table_name = settings.dynamodb_table_name

    def save_incident_aggregate(self, 
                                incident_id: str, 
                                signal: Signal, 
                                analysis: AIAnalysis, 
                                decision: Decision, 
                                status: IncidentStatus, 
                                idempotency_key: Optional[str] = None):
        
        timestamp = datetime.utcnow().isoformat() + "Z"
        
        # Incident Meta
        incident_item = {
            "PK": {"S": f"INCIDENT#{incident_id}"},
            "SK": {"S": "META"},
            "GSI1PK": {"S": f"STATUS#{status.value}"},
            "GSI1SK": {"S": f"{timestamp}#{incident_id}"},
            "id": {"S": incident_id},
            "createdAt": {"S": timestamp},
            "updatedAt": {"S": timestamp},
            "status": {"S": status.value},
            "category": {"S": analysis.classification.category.value},
            "severity": {"S": analysis.assessment.severity.value},
            "analysis": {"S": analysis.model_dump_json()}
        }

        # Signal
        signal_item = {
            "PK": {"S": f"INCIDENT#{incident_id}"},
            "SK": {"S": f"SIGNAL#{signal.id}"},
            "id": {"S": signal.id},
            "sourceType": {"S": signal.source_type.value},
            "content": {"S": signal.content},
            "createdAt": {"S": timestamp}
        }
        
        if signal.location:
            signal_item["location"] = {"S": signal.location.model_dump_json()}

        # Decision
        decision_item = {
            "PK": {"S": f"INCIDENT#{incident_id}"},
            "SK": {"S": "DECISION"},
            "id": {"S": decision.id},
            "path": {"S": decision.path.value},
            "reasoning": {"S": decision.reasoning},
            "requiresHumanReview": {"BOOL": decision.requires_human_review},
            "createdAt": {"S": timestamp}
        }

        # Signal Pointer (for direct signal lookups)
        signal_pointer_item = {
            "PK": {"S": f"SIGNAL#{signal.id}"},
            "SK": {"S": "META"},
            "incidentId": {"S": incident_id},
            "createdAt": {"S": timestamp}
        }

        transact_items = [
            {
                "Put": {
                    "TableName": self.table_name,
                    "Item": incident_item
                }
            },
            {
                "Put": {
                    "TableName": self.table_name,
                    "Item": signal_item
                }
            },
            {
                "Put": {
                    "TableName": self.table_name,
                    "Item": decision_item
                }
            },
            {
                "Put": {
                    "TableName": self.table_name,
                    "Item": signal_pointer_item
                }
            }
        ]

        if idempotency_key:
            transact_items.append({
                "Put": {
                    "TableName": self.table_name,
                    "Item": {
                        "PK": {"S": f"IDEMPOTENCY#{idempotency_key}"},
                        "SK": {"S": "META"},
                        "incidentId": {"S": incident_id},
                        "createdAt": {"S": timestamp}
                    },
                    "ConditionExpression": "attribute_not_exists(PK)"
                }
            })

        try:
            self.dynamodb.transact_write_items(TransactItems=transact_items)
        except ClientError as e:
            if e.response['Error']['Code'] == 'TransactionCanceledException':
                if 'ConditionalCheckFailed' in str(e):
                    raise ValueError(f"Idempotency key {idempotency_key} already exists")
            raise e

    def get_incident(self, incident_id: str) -> Optional[Dict[str, Any]]:
        try:
            response = self.dynamodb.query(
                TableName=self.table_name,
                KeyConditionExpression="PK = :pk",
                ExpressionAttributeValues={":pk": {"S": f"INCIDENT#{incident_id}"}}
            )
            items = response.get('Items', [])
            if not items:
                return None
            
            incident = {}
            signals = []
            
            for item in items:
                sk = item['SK']['S']
                if sk == 'META':
                    incident['id'] = item['id']['S']
                    incident['status'] = item['status']['S']
                    incident['category'] = item['category']['S']
                    incident['severity'] = item['severity']['S']
                    incident['createdAt'] = item['createdAt']['S']
                    incident['updatedAt'] = item['updatedAt']['S']
                    if 'analysis' in item:
                        incident['analysis'] = json.loads(item['analysis']['S'])
                elif sk.startswith('SIGNAL#'):
                    sig = {
                        'id': item['id']['S'],
                        'sourceType': item['sourceType']['S'],
                        'content': item['content']['S'],
                        'createdAt': item['createdAt']['S']
                    }
                    if 'location' in item:
                        sig['location'] = json.loads(item['location']['S'])
                    signals.append(sig)
                elif sk == 'DECISION':
                    incident['decision'] = {
                        'id': item['id']['S'],
                        'path': item['path']['S'],
                        'reasoning': item['reasoning']['S'],
                        'requiresHumanReview': item['requiresHumanReview']['BOOL']
                    }
                    
            if not incident:
                return None
                
            incident['signals'] = signals
            return incident
            
        except ClientError as e:
            raise e

    def get_signal(self, signal_id: str) -> Optional[Dict[str, Any]]:
        try:
            # First get the pointer
            pointer_response = self.dynamodb.get_item(
                TableName=self.table_name,
                Key={
                    "PK": {"S": f"SIGNAL#{signal_id}"},
                    "SK": {"S": "META"}
                }
            )
            pointer_item = pointer_response.get('Item')
            if not pointer_item:
                return None
            
            incident_id = pointer_item['incidentId']['S']
            return self.get_signal_from_incident(incident_id, signal_id)
        except ClientError as e:
            raise e

    def get_signal_from_incident(self, incident_id: str, signal_id: str) -> Optional[Dict[str, Any]]:
        try:
            response = self.dynamodb.get_item(
                TableName=self.table_name,
                Key={
                    "PK": {"S": f"INCIDENT#{incident_id}"},
                    "SK": {"S": f"SIGNAL#{signal_id}"}
                }
            )
            item = response.get('Item')
            if not item:
                return None
            
            sig = {
                'id': item['id']['S'],
                'sourceType': item['sourceType']['S'],
                'content': item['content']['S'],
                'createdAt': item['createdAt']['S']
            }
            if 'location' in item:
                sig['location'] = json.loads(item['location']['S'])
            return sig
        except ClientError as e:
            raise e

    def get_idempotent_incident_id(self, idempotency_key: str) -> Optional[str]:
        try:
            response = self.dynamodb.get_item(
                TableName=self.table_name,
                Key={
                    "PK": {"S": f"IDEMPOTENCY#{idempotency_key}"},
                    "SK": {"S": "META"}
                }
            )
            item = response.get('Item')
            if not item:
                return None
            return item['incidentId']['S']
        except ClientError as e:
            raise e

    def list_recent_incidents(self, status: IncidentStatus, limit: int = 10) -> List[Dict[str, Any]]:
        try:
            response = self.dynamodb.query(
                TableName=self.table_name,
                IndexName="StatusTimeIndex",
                KeyConditionExpression="GSI1PK = :gsi1pk",
                ExpressionAttributeValues={":gsi1pk": {"S": f"STATUS#{status.value}"}},
                ScanIndexForward=False, # Descending by time
                Limit=limit
            )
            items = response.get('Items', [])
            incidents = []
            for item in items:
                inc = {
                    'id': item['id']['S'],
                    'status': item['status']['S'],
                    'category': item['category']['S'],
                    'severity': item['severity']['S'],
                    'createdAt': item['createdAt']['S']
                }
                incidents.append(inc)
            return incidents
        except ClientError as e:
            raise e

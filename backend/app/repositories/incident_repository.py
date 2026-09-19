import boto3
from botocore.exceptions import ClientError
from datetime import datetime
from typing import Optional, List, Dict, Any
import json

from app.config.settings import settings
from app.domain.models import Signal, AIAnalysis, Decision
from app.domain.enums import IncidentStatus, ProcessingState

class IncidentRepository:
    def __init__(self, dynamodb_client=None):
        self.dynamodb = dynamodb_client or boto3.client('dynamodb', region_name=settings.aws_region)
        self.table_name = settings.dynamodb_table_name

    def save_incident_aggregate(self, 
                                incident_id: str, 
                                signal: Signal, 
                                analysis: Optional[AIAnalysis] = None, 
                                decision: Optional[Decision] = None, 
                                status: IncidentStatus = IncidentStatus.new, 
                                idempotency_key: Optional[str] = None,
                                recurrence_count: int = 1,
                                first_observed_at: Optional[str] = None,
                                related_signal_ids: Optional[List[str]] = None,
                                processing_state: str = "pending"):
        
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
            "category": {"S": analysis.classification.category.value if analysis else "other"},
            "severity": {"S": analysis.assessment.severity.value if analysis else "low"},
            "recurrenceCount": {"N": str(recurrence_count)},
            "firstObservedAt": {"S": first_observed_at or timestamp},
            "processingState": {"S": processing_state}
        }
        
        if related_signal_ids:
            incident_item["relatedSignalIds"] = {"S": json.dumps(related_signal_ids)}
        
        if analysis:
            incident_item["analysis"] = {"S": analysis.model_dump_json()}

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

        decision_item = None
        if decision:
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

        # Evidence Items
        evidence_items = []
        for ev in signal.evidence:
            evidence_items.append({
                "Put": {
                    "TableName": self.table_name,
                    "Item": {
                        "PK": {"S": f"INCIDENT#{incident_id}"},
                        "SK": {"S": f"EVIDENCE#{ev.evidenceId}"},
                        "signalId": {"S": signal.id},
                        "incidentId": {"S": incident_id},
                        "evidenceId": {"S": ev.evidenceId},
                        "objectKey": {"S": ev.objectKey},
                        "contentType": {"S": ev.contentType},
                        "size": {"N": str(ev.size)},
                        "createdAt": {"S": timestamp}
                    }
                }
            })

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
                    "Item": signal_pointer_item
                }
            }
        ]
        
        if decision_item:
            transact_items.append({
                "Put": {
                    "TableName": self.table_name,
                    "Item": decision_item
                }
            })

        transact_items.extend(evidence_items)

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
                    incident['processingState'] = item.get('processingState', {}).get('S', 'pending')
                    incident['recurrenceCount'] = int(item.get('recurrenceCount', {}).get('N', '1'))
                    incident['firstObservedAt'] = item.get('firstObservedAt', {}).get('S', incident['createdAt'])
                    if 'relatedSignalIds' in item:
                        incident['relatedSignalIds'] = json.loads(item['relatedSignalIds']['S'])
                    if 'analysis' in item:
                        incident['analysis'] = json.loads(item['analysis']['S'])
                    if 'taskToken' in item:
                        incident['taskToken'] = item['taskToken']['S']
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

    def update_incident_status(self, incident_id: str, new_status: IncidentStatus, comments: str = "") -> None:
        try:
            timestamp = datetime.utcnow().isoformat() + "Z"
            # Update the META item
            self.dynamodb.update_item(
                TableName=self.table_name,
                Key={
                    "PK": {"S": f"INCIDENT#{incident_id}"},
                    "SK": {"S": "META"}
                },
                UpdateExpression="SET #status = :s, updatedAt = :u",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={
                    ":s": {"S": new_status.value},
                    ":u": {"S": timestamp}
                }
            )
            # The StatusTimeIndex uses GSI1PK = STATUS#<status> and GSI1SK = <createdAt>#<id>
            # But wait, DynamoDB GSIs are automatically updated when the base item attributes change!
            # We don't need to update the index directly, BUT we DO need to update the GSI1PK and GSI1SK attributes on the META item so the GSI gets updated.
            # Let's fix that.
            
            # Fetch the item first to get createdAt
            incident = self.get_incident(incident_id)
            if not incident:
                raise ValueError("Incident not found")
                
            created_at = incident.get('createdAt', timestamp)
            gsi1pk = f"STATUS#{new_status.value}"
            gsi1sk = f"{created_at}#{incident_id}"
            
            self.dynamodb.update_item(
                TableName=self.table_name,
                Key={
                    "PK": {"S": f"INCIDENT#{incident_id}"},
                    "SK": {"S": "META"}
                },
                UpdateExpression="SET #status = :s, updatedAt = :u, GSI1PK = :gpk, GSI1SK = :gsk",
                ExpressionAttributeNames={"#status": "status"},
                ExpressionAttributeValues={
                    ":s": {"S": new_status.value},
                    ":u": {"S": timestamp},
                    ":gpk": {"S": gsi1pk},
                    ":gsk": {"S": gsi1sk}
                }
            )
            
            # Optionally we could save the review comments in a REVIEW item or append to DECISION. 
            # For hackathon simplicity, we just change the status.
        except ClientError as e:
            raise e

    def update_processing_state(self, incident_id: str, new_state: ProcessingState) -> None:
        try:
            timestamp = datetime.utcnow().isoformat() + "Z"
            self.dynamodb.update_item(
                TableName=self.table_name,
                Key={
                    "PK": {"S": f"INCIDENT#{incident_id}"},
                    "SK": {"S": "META"}
                },
                UpdateExpression="SET #ps = :ps, updatedAt = :u",
                ExpressionAttributeNames={"#ps": "processingState"},
                ExpressionAttributeValues={
                    ":ps": {"S": new_state.value},
                    ":u": {"S": timestamp}
                }
            )
        except ClientError as e:
            raise e

    def find_related_incidents(self, category: str, location_description: str, limit: int = 50) -> List[Dict[str, Any]]:
        # Fetch recent incidents across all status types and filter in-memory.
        # This is a hackathon compromise avoiding a new GSI.
        # We will scan the last 50 items on StatusTimeIndex for relevant statuses and combine.
        try:
            statuses_to_check = [IncidentStatus.new, IncidentStatus.monitoring, IncidentStatus.emerging, IncidentStatus.analyzed, IncidentStatus.human_review]
            related = []
            
            for status in statuses_to_check:
                response = self.dynamodb.query(
                    TableName=self.table_name,
                    IndexName="StatusTimeIndex",
                    KeyConditionExpression="GSI1PK = :gsi1pk",
                    ExpressionAttributeValues={":gsi1pk": {"S": f"STATUS#{status.value}"}},
                    ScanIndexForward=False,
                    Limit=limit
                )
                
                for item in response.get('Items', []):
                    # We need the full incident to get the signals/location
                    inc_id = item['id']['S']
                    inc = self.get_incident(inc_id)
                    if not inc: continue
                    
                    if inc.get('category') != category: continue
                    
                    # Check location of the signals
                    for sig in inc.get('signals', []):
                        loc = sig.get('location', {})
                        if loc and loc.get('description') == location_description:
                            related.append(inc)
                            break # Found a match in this incident
            
            # Sort by createdAt descending
            related.sort(key=lambda x: x['createdAt'], reverse=True)
            return related
        except ClientError as e:
            raise e

    def save_response_packet(self, packet) -> None:
        try:
            timestamp = datetime.utcnow().isoformat() + "Z"
            # SK = PACKET#<createdAt>#<packetId> to keep them immutable and ordered
            sk = f"PACKET#{packet.generatedAt}#{packet.packetId}"
            self.dynamodb.put_item(
                TableName=self.table_name,
                Item={
                    "PK": {"S": f"INCIDENT#{packet.incidentId}"},
                    "SK": {"S": sk},
                    "data": {"S": packet.model_dump_json()},
                    "createdAt": {"S": timestamp}
                }
            )
        except ClientError as e:
            raise e
            
    def get_latest_response_packet(self, incident_id: str) -> Optional[Dict[str, Any]]:
        try:
            response = self.dynamodb.query(
                TableName=self.table_name,
                KeyConditionExpression="PK = :pk AND begins_with(SK, :sk_prefix)",
                ExpressionAttributeValues={
                    ":pk": {"S": f"INCIDENT#{incident_id}"},
                    ":sk_prefix": {"S": "PACKET#"}
                },
                ScanIndexForward=False, # Descending by sort key (time)
                Limit=1
            )
            items = response.get('Items', [])
            if not items:
                return None
            return json.loads(items[0]['data']['S'])
        except ClientError as e:
            raise e

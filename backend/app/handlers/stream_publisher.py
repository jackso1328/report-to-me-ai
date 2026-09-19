import os
import json
import logging
import boto3
from typing import Any, Dict

logger = logging.getLogger(__name__)
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

events_client = boto3.client('events')
EVENT_BUS_NAME = os.environ.get('EVENT_BUS_NAME')

def lambda_handler(event: Dict[str, Any], context: Any):
    if not EVENT_BUS_NAME:
        logger.warning("EVENT_BUS_NAME not configured. Exiting.")
        return

    entries = []
    
    for record in event.get('Records', []):
        event_name = record.get('eventName')
        if event_name not in ('INSERT', 'MODIFY'):
            continue
            
        new_image = record.get('dynamodb', {}).get('NewImage', {})
        if not new_image:
            continue
            
        pk = new_image.get('PK', {}).get('S', '')
        sk = new_image.get('SK', {}).get('S', '')
        
        # 1. SignalCreated (INSERT)
        # PK: INCIDENT#{incidentId}, SK: SIGNAL#{signalId}
        if event_name == 'INSERT' and pk.startswith("INCIDENT#") and sk.startswith("SIGNAL#"):
            incident_id = pk.split("INCIDENT#")[1]
            signal_id = sk.split("SIGNAL#")[1]
            
            # The EventBridge event should have a stable eventId derived from the originating stream record
            stream_event_id = record.get('eventID')
            occurred_at = new_image.get('createdAt', {}).get('S', '')
            
            event_payload = {
                "eventId": f"evt_{stream_event_id}",
                "eventType": "SignalCreated",
                "schemaVersion": "1.0",
                "occurredAt": occurred_at,
                "source": "report-to-me",
                "detail": {
                    "incidentId": incident_id,
                    "signalId": signal_id
                }
            }
            
            entries.append({
                'Source': 'report-to-me',
                'DetailType': 'SignalCreated',
                'Detail': json.dumps(event_payload),
                'EventBusName': EVENT_BUS_NAME
            })
            
            logger.info(f"Publishing SignalCreated for incident {incident_id}, signal {signal_id}")

        # 2. HumanReviewRequired (MODIFY)
        # PK: INCIDENT#{incidentId}, SK: META
        elif event_name == 'MODIFY' and pk.startswith("INCIDENT#") and sk == "META":
            old_image = record.get('dynamodb', {}).get('OldImage', {})
            new_status = new_image.get('status', {}).get('S', '')
            old_status = old_image.get('status', {}).get('S', '')
            
            if new_status == 'human_review' and old_status != 'human_review':
                incident_id = pk.split("INCIDENT#")[1]
                stream_event_id = record.get('eventID')
                occurred_at = new_image.get('updatedAt', {}).get('S', '')
                
                event_payload = {
                    "eventId": f"evt_{stream_event_id}",
                    "eventType": "HumanReviewRequired",
                    "schemaVersion": "1.0",
                    "occurredAt": occurred_at,
                    "source": "report-to-me",
                    "detail": {
                        "incidentId": incident_id,
                        "eventId": f"evt_{stream_event_id}"
                    }
                }
                
                entries.append({
                    'Source': 'report-to-me',
                    'DetailType': 'HumanReviewRequired',
                    'Detail': json.dumps(event_payload),
                    'EventBusName': EVENT_BUS_NAME
                })
                
                logger.info(f"Publishing HumanReviewRequired for incident {incident_id}")

    if entries:
        # PutEvents can handle max 10 entries per call, DynamoDB batch size is 10, so this is safe
        try:
            response = events_client.put_events(Entries=entries)
            failed_count = response.get('FailedEntryCount', 0)
            if failed_count > 0:
                logger.error(f"Failed to publish {failed_count} events to EventBridge")
                # If some failed, raise exception so stream retries (we rely on idempotent consumer)
                raise Exception(f"PutEvents failed for {failed_count} events")
        except Exception as e:
            logger.error(f"Error publishing to EventBridge: {e}")
            raise e

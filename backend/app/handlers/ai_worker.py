import json
import logging
from typing import Any, Dict
from app.services.ai_worker_service import AIWorkerService

logger = logging.getLogger("ai_worker")
logger.setLevel(logging.INFO)

worker_service = AIWorkerService()

def lambda_handler(event: dict, context: Any) -> dict:
    """
    SQS Event Handler for AI Processing.
    Uses ReportBatchItemFailures for partial batch failure handling.
    """
    records = event.get('Records', [])
    batch_item_failures = []
    
    for record in records:
        message_id = record.get('messageId')
        try:
            body = json.loads(record.get('body', '{}'))
            incident_id = body.get('incidentId')
            signal_id = body.get('signalId')
            
            if not incident_id or not signal_id:
                logger.error(f"Malformed message {message_id}: {body}")
                # We don't retry malformed messages; they are poison pills that should be discarded or DLQ'd.
                # Actually, raising an exception or returning it in batch_item_failures will send it back to queue then DLQ.
                # For safety against infinite loops, we can just skip it, or DLQ it. Returning it in failures sends to DLQ eventually.
                batch_item_failures.append({"itemIdentifier": message_id})
                continue
                
            logger.info(f"Processing incident {incident_id} (signal {signal_id}) from message {message_id}")
            
            success = worker_service.process_incident_analysis(incident_id, signal_id)
            if not success:
                logger.warning(f"Processing failed for incident {incident_id} in message {message_id}")
                batch_item_failures.append({"itemIdentifier": message_id})
                
        except Exception as e:
            logger.error(f"Error processing message {message_id}: {e}", exc_info=True)
            batch_item_failures.append({"itemIdentifier": message_id})

    return {
        "batchItemFailures": batch_item_failures
    }

import pytest
import json
from unittest.mock import MagicMock, patch
from app.handlers.ai_worker import lambda_handler
from app.domain.enums import IncidentStatus, ProcessingState

@pytest.fixture
def mock_worker_service():
    with patch('app.handlers.ai_worker.worker_service') as mock:
        yield mock

def test_ai_worker_successful_processing(mock_worker_service):
    mock_worker_service.process_incident_analysis.return_value = True
    
    event = {
        "Records": [
            {
                "messageId": "msg1",
                "body": json.dumps({
                    "incidentId": "inc-1",
                    "signalId": "sig-1"
                })
            }
        ]
    }
    
    result = lambda_handler(event, None)
    
    # Should not return this item in batchItemFailures
    assert len(result["batchItemFailures"]) == 0
    mock_worker_service.process_incident_analysis.assert_called_once_with("inc-1", "sig-1")

def test_ai_worker_partial_batch_failure(mock_worker_service):
    # Simulate processing two messages, one succeeds, one fails
    def mock_process(incident_id, signal_id):
        if incident_id == "inc-fail":
            return False
        return True
        
    mock_worker_service.process_incident_analysis.side_effect = mock_process
    
    event = {
        "Records": [
            {
                "messageId": "msg-success",
                "body": json.dumps({"incidentId": "inc-success", "signalId": "sig-1"})
            },
            {
                "messageId": "msg-fail",
                "body": json.dumps({"incidentId": "inc-fail", "signalId": "sig-2"})
            }
        ]
    }
    
    result = lambda_handler(event, None)
    
    assert len(result["batchItemFailures"]) == 1
    assert result["batchItemFailures"][0]["itemIdentifier"] == "msg-fail"

def test_ai_worker_malformed_message():
    event = {
        "Records": [
            {
                "messageId": "msg-malformed",
                "body": "this is not json"
            }
        ]
    }
    
    result = lambda_handler(event, None)
    
    assert len(result["batchItemFailures"]) == 1
    assert result["batchItemFailures"][0]["itemIdentifier"] == "msg-malformed"

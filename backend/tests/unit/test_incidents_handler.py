import unittest
import json
from unittest.mock import patch, MagicMock
from app.handlers.incidents import lambda_handler
from app.domain.enums import IncidentStatus

class TestIncidentsHandler(unittest.TestCase):
    @patch('app.handlers.incidents.repository')
    def test_get_incident_strips_task_token(self, mock_repo):
        mock_repo.get_incident.return_value = {
            "id": "inc-1",
            "status": "human_review",
            "taskToken": "super-secret-token"
        }
        
        event = {
            "requestContext": {"http": {"method": "GET"}},
            "pathParameters": {"incidentId": "inc-1"}
        }
        
        response = lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        
        body = json.loads(response["body"])
        self.assertNotIn("taskToken", body)
        self.assertEqual(body["id"], "inc-1")

    @patch('app.handlers.incidents.repository')
    @patch('boto3.client')
    def test_patch_review_sends_task_success(self, mock_boto, mock_repo):
        mock_sfn = MagicMock()
        mock_boto.return_value = mock_sfn
        
        mock_repo.get_incident.return_value = {
            "id": "inc-1",
            "status": "human_review",
            "taskToken": "token-123"
        }
        
        event = {
            "requestContext": {"http": {"method": "PATCH"}},
            "pathParameters": {"incidentId": "inc-1"},
            "body": json.dumps({"status": "approved", "comments": "LGTM"})
        }
        
        response = lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 200)
        
        # Verify SendTaskSuccess was called
        mock_sfn.send_task_success.assert_called_once()
        args, kwargs = mock_sfn.send_task_success.call_args
        self.assertEqual(kwargs['taskToken'], "token-123")
        
        output = json.loads(kwargs['output'])
        self.assertEqual(output['status'], "approved")
        self.assertEqual(output['comments'], "LGTM")
        
        # Verify response simulates updated status without DB modification
        body = json.loads(response["body"])
        self.assertEqual(body["status"], "human_review")
        self.assertEqual(body["processingState"], "review_submitted")
        self.assertNotIn("taskToken", body)
        
        # Verify DynamoDB wasn't directly updated by API
        mock_repo.update_incident_status.assert_not_called()

    @patch('app.handlers.incidents.repository')
    @patch('boto3.client')
    def test_patch_review_fails_safely_if_sfn_fails(self, mock_boto, mock_repo):
        mock_sfn = MagicMock()
        mock_sfn.send_task_success.side_effect = Exception("Task token expired")
        mock_boto.return_value = mock_sfn
        
        mock_repo.get_incident.return_value = {
            "id": "inc-1",
            "status": "human_review",
            "taskToken": "token-123"
        }
        
        event = {
            "requestContext": {"http": {"method": "PATCH"}},
            "pathParameters": {"incidentId": "inc-1"},
            "body": json.dumps({"status": "approved"})
        }
        
        response = lambda_handler(event, None)
        self.assertEqual(response["statusCode"], 500)
        
        # Verify business decision was NOT finalized
        mock_repo.update_incident_status.assert_not_called()

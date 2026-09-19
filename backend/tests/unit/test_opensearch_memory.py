import unittest
import json
from unittest.mock import patch, MagicMock
from app.handlers.indexer import lambda_handler
from app.services.memory_service import MemoryService
from app.domain.models import RelatedIncident

class TestOpenSearchMemory(unittest.TestCase):
    
    @patch('app.handlers.indexer.os_client')
    def test_indexer_constructs_document(self, mock_os_client):
        event = {
            "detail": {
                "incidentId": "inc-123",
                "category": "maintenance",
                "severity": "medium",
                "status": "new",
                "createdAt": "2026-09-19T10:00:00Z",
                "eventType": "equipment_issue",
                "object": "fan",
                "summary": "Fan makes noise"
            }
        }
        
        lambda_handler(event, None)
        
        mock_os_client.index.assert_called_once()
        args, kwargs = mock_os_client.index.call_args
        
        doc = kwargs['body']
        self.assertEqual(doc['incidentId'], 'inc-123')
        self.assertEqual(doc['category'], 'maintenance')
        self.assertEqual(doc['eventType'], 'equipment_issue')
        self.assertEqual(doc['object'], 'fan')
        self.assertEqual(doc['schemaVersion'], '1.0')
        self.assertEqual(kwargs['id'], 'inc-123')
        self.assertFalse(kwargs['refresh']) # Eventual consistency

    @patch('app.handlers.indexer.os_client')
    def test_indexer_ignores_empty_event(self, mock_os_client):
        lambda_handler({}, None)
        mock_os_client.index.assert_not_called()

    @patch('app.services.memory_service.OpenSearch')
    @patch('app.services.memory_service.AWS4Auth')
    @patch('app.services.memory_service.boto3')
    def test_memory_service_search_behavior(self, mock_boto3, mock_auth, mock_os):
        # Setup mock client
        mock_client = MagicMock()
        mock_os.return_value = mock_client
        
        # Mock search response
        mock_client.search.return_value = {
            "hits": {
                "hits": [
                    {
                        "_score": 12.73,
                        "_source": {
                            "incidentId": "inc-999",
                            "summary": "Historical fan issue",
                            "status": "resolved",
                            "resolution": "Fixed bearings",
                            "object": "fan",
                            "eventType": "equipment_issue"
                        }
                    }
                ]
            }
        }
        
        with patch.dict('os.environ', {'OPENSEARCH_ENDPOINT': 'https://test-endpoint'}):
            service = MemoryService()
        
        results = service.find_related_incidents(
            category="maintenance",
            event_type="equipment_issue",
            obj="fan",
            location_description="Block B",
            limit=5
        )
        
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0].incidentId, "inc-999")
        self.assertEqual(results[0].searchMetadata.score, 12.73)
        self.assertIn("same_object", results[0].searchMetadata.relationship)
        
        # Verify query was bounded
        args, kwargs = mock_client.search.call_args
        query = kwargs['body']
        self.assertEqual(query['size'], 5)
        self.assertEqual(query['query']['bool']['must'][0]['match']['category'], 'maintenance')

    @patch('app.services.memory_service.OpenSearch')
    @patch('app.services.memory_service.AWS4Auth')
    @patch('app.services.memory_service.boto3')
    def test_memory_service_graceful_degradation(self, mock_boto3, mock_auth, mock_os):
        # Setup mock client to throw exception
        mock_client = MagicMock()
        mock_client.search.side_effect = Exception("OpenSearch cluster unreachable")
        mock_os.return_value = mock_client
        
        with patch.dict('os.environ', {'OPENSEARCH_ENDPOINT': 'https://test-endpoint'}):
            service = MemoryService()
        
        results = service.find_related_incidents(
            category="maintenance",
            event_type="equipment_issue",
            obj="fan",
            location_description="Block B"
        )
        
        # Should catch exception and return empty list cleanly
        self.assertEqual(results, [])

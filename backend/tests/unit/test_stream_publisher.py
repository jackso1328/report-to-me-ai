import unittest
import json
from unittest.mock import patch, MagicMock
from app.handlers.stream_publisher import lambda_handler

class TestStreamPublisher(unittest.TestCase):
    @patch('app.handlers.stream_publisher.events_client')
    @patch('app.handlers.stream_publisher.EVENT_BUS_NAME', 'test-bus')
    def test_publishes_signal_created_event(self, mock_events_client):
        event = {
            "Records": [
                {
                    "eventID": "abcd123",
                    "eventName": "INSERT",
                    "dynamodb": {
                        "NewImage": {
                            "PK": {"S": "INCIDENT#inc-1"},
                            "SK": {"S": "SIGNAL#sig-1"},
                            "createdAt": {"S": "2026-01-01T00:00:00Z"}
                        }
                    }
                }
            ]
        }
        
        mock_events_client.put_events.return_value = {"FailedEntryCount": 0}
        lambda_handler(event, None)
        
        entries = mock_events_client.put_events.call_args[1]['Entries']
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0]['DetailType'], 'SignalCreated')
        
        detail = json.loads(entries[0]['Detail'])
        self.assertEqual(detail['eventId'], 'evt_abcd123')
        self.assertEqual(detail['detail']['incidentId'], 'inc-1')
        self.assertEqual(detail['detail']['signalId'], 'sig-1')

    @patch('app.handlers.stream_publisher.events_client')
    @patch('app.handlers.stream_publisher.EVENT_BUS_NAME', 'test-bus')
    def test_publishes_human_review_required_event(self, mock_events_client):
        event = {
            "Records": [
                {
                    "eventID": "abcd123",
                    "eventName": "MODIFY",
                    "dynamodb": {
                        "OldImage": {
                            "status": {"S": "analyzed"}
                        },
                        "NewImage": {
                            "PK": {"S": "INCIDENT#inc-1"},
                            "SK": {"S": "META"},
                            "status": {"S": "human_review"},
                            "updatedAt": {"S": "2026-01-01T00:00:00Z"}
                        }
                    }
                }
            ]
        }
        
        mock_events_client.put_events.return_value = {"FailedEntryCount": 0}
        lambda_handler(event, None)
        
        entries = mock_events_client.put_events.call_args[1]['Entries']
        self.assertEqual(len(entries), 2)
        types = [e['DetailType'] for e in entries]
        self.assertIn("HumanReviewRequired", types)
        self.assertIn("IncidentUpdated", types)
        self.assertEqual(entries[0]['DetailType'], 'HumanReviewRequired')
        
        detail = json.loads(entries[0]['Detail'])
        self.assertEqual(detail['eventId'], 'evt_abcd123')
        self.assertEqual(detail['detail']['incidentId'], 'inc-1')
        self.assertEqual(detail['detail']['eventId'], 'evt_abcd123')

    @patch('app.handlers.stream_publisher.events_client')
    @patch('app.handlers.stream_publisher.EVENT_BUS_NAME', 'test-bus')
    def test_ignores_non_human_review_modifications(self, mock_events_client):
        event = {
            "Records": [
                {
                    "eventID": "abcd123",
                    "eventName": "MODIFY",
                    "dynamodb": {
                        "OldImage": {
                            "status": {"S": "new"}
                        },
                        "NewImage": {
                            "PK": {"S": "INCIDENT#inc-1"},
                            "SK": {"S": "META"},
                            "status": {"S": "analyzed"},
                            "updatedAt": {"S": "2026-01-01T00:00:00Z"}
                        }
                    }
                },
                {
                    "eventID": "efg123",
                    "eventName": "MODIFY",
                    "dynamodb": {
                        "OldImage": {
                            "status": {"S": "human_review"}
                        },
                        "NewImage": {
                            "PK": {"S": "INCIDENT#inc-2"},
                            "SK": {"S": "META"},
                            "status": {"S": "human_review"},
                            "updatedAt": {"S": "2026-01-01T00:00:00Z"}
                        }
                    }
                }
            ]
        }
        
        mock_events_client.put_events.return_value = {"FailedEntryCount": 0}
        lambda_handler(event, None)
        
        # It should publish IncidentUpdated but not HumanReviewRequired
        entries = mock_events_client.put_events.call_args[1]['Entries']
        self.assertEqual(len(entries), 1)
        self.assertEqual(entries[0]['DetailType'], 'IncidentUpdated')

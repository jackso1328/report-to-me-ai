import unittest
from unittest.mock import MagicMock
import urllib.error
from app.services.signal_processor import SignalProcessor
from app.domain.enums import IncidentStatus

class TestAIFailures(unittest.TestCase):
    def setUp(self):
        self.mock_repo = MagicMock()
        self.processor = SignalProcessor(repository=self.mock_repo)
        
        self.mock_analyzer = MagicMock()
        self.processor.analyzer = self.mock_analyzer

    def test_ai_timeout_degrades_gracefully(self):
        payload = {
            "source": {
                "type": "text",
                "content": "The fan in Classroom 204 is making a noise."
            }
        }
        
        # Simulate OpenRouter timeout/failure
        self.mock_analyzer.analyze_signal.side_effect = Exception("OpenRouter Timeout")
        
        # We must return an incident with status 'new' so the caller doesn't fail
        self.mock_repo.get_incident.return_value = {"id": "test", "status": "new"}
        
        result = self.processor.process_signal(payload)
        
        # Should return an incident and save it with analysis=None and status=new
        self.assertIsNotNone(result)
        self.assertEqual(result["status"], "new")
        
        args, kwargs = self.mock_repo.save_incident_aggregate.call_args
        self.assertIsNone(kwargs['analysis'])
        self.assertIsNone(kwargs['decision'])
        self.assertEqual(kwargs['status'], IncidentStatus.new)

if __name__ == '__main__':
    unittest.main()

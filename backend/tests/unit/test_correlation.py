import unittest
from unittest.mock import MagicMock
from app.services.ai_worker_service import AIWorkerService
from app.domain.models import AIAnalysis, Signal, Location
from app.domain.enums import IncidentStatus, ProcessingState

class TestCorrelation(unittest.TestCase):
    def setUp(self):
        self.mock_analyzer = MagicMock()
        self.mock_repo = MagicMock()
        self.mock_repo.get_incident.return_value = {
            "id": "test-inc-1",
            "status": "new",
            "processingState": "queued",
            "createdAt": "2026-01-01T00:00:00Z"
        }
        
        self.worker = AIWorkerService(repository=self.mock_repo)
        
        # Override the analyzer specifically for tests
        self.worker.analyzer = self.mock_analyzer

    def test_emerging_incident(self):
        from app.domain.models import AIAnalysis, AIClassification, AIUnderstanding, AIAssessment, AIGuidance, AIUncertainty, AIMetadata
        from app.domain.enums import IncidentCategory, Severity, GuidanceMode
        
        mock_analysis = AIAnalysis(
            schemaVersion="1.0",
            classification=AIClassification(category=IncidentCategory.maintenance, eventType="noise", object="fan"),
            understanding=AIUnderstanding(summary="test", observedFacts=[]),
            assessment=AIAssessment(severity=Severity.low, confidence=0.9, riskFactors=[]),
            guidance=AIGuidance(recommendedAction="Monitor", mode=GuidanceMode.monitor),
            uncertainty=AIUncertainty(missingInformation=[], needsClarification=False),
            metadata=AIMetadata(modelId="test", promptVersion="v1", schemaVersion="1.0", analyzedAt="2026-01-01")
        )
        self.mock_analyzer.analyze_signal.return_value = mock_analysis
        
        # Scenario: It's the 3rd time we see this
        self.mock_repo.find_related_incidents.return_value = [
            {"id": "inc-1", "createdAt": "2026-01-01T00:00:00Z", "signals": [{"id": "sig-1"}]},
            {"id": "inc-2", "createdAt": "2026-01-02T00:00:00Z", "signals": [{"id": "sig-2"}]}
        ]
        
        self.mock_repo.get_signal_from_incident.return_value = {
            "id": "sig-test",
            "sourceType": "text",
            "content": "The fan in Classroom 204 is making a noise.",
            "location": {"description": "Classroom 204"},
            "createdAt": "2026-01-01T00:00:00Z"
        }
        
        self.worker.process_incident_analysis("test-inc-1", "sig-test")
        
        # Assert save_incident_aggregate was called with emerging status and recurrenceCount = 3
        args, kwargs = self.mock_repo.save_incident_aggregate.call_args
        self.assertEqual(kwargs['status'], IncidentStatus.emerging)
        self.assertEqual(kwargs['recurrence_count'], 3)
        self.assertIn("sig-1", kwargs['related_signal_ids'])
        self.assertIn("sig-2", kwargs['related_signal_ids'])

    def test_no_correlation_when_no_location(self):
        from app.domain.models import AIAnalysis, AIClassification, AIUnderstanding, AIAssessment, AIGuidance, AIUncertainty, AIMetadata
        from app.domain.enums import IncidentCategory, Severity, GuidanceMode
        
        mock_analysis = AIAnalysis(
            schemaVersion="1.0",
            classification=AIClassification(category=IncidentCategory.maintenance, eventType="noise", object="fan"),
            understanding=AIUnderstanding(summary="test", observedFacts=[]),
            assessment=AIAssessment(severity=Severity.low, confidence=0.9, riskFactors=[]),
            guidance=AIGuidance(recommendedAction="Monitor", mode=GuidanceMode.monitor),
            uncertainty=AIUncertainty(missingInformation=[], needsClarification=False),
            metadata=AIMetadata(modelId="test", promptVersion="v1", schemaVersion="1.0", analyzedAt="2026-01-01")
        )
        self.mock_analyzer.analyze_signal.return_value = mock_analysis
        
        self.mock_repo.get_signal_from_incident.return_value = {
            "id": "sig-test",
            "sourceType": "text",
            "content": "The fan is making a noise.",
            "createdAt": "2026-01-01T00:00:00Z"
        }
        
        self.worker.process_incident_analysis("test-inc-1", "sig-test")
        
        # Assert find_related_incidents was not called because location is missing
        self.mock_repo.find_related_incidents.assert_not_called()
        
        args, kwargs = self.mock_repo.save_incident_aggregate.call_args
        self.assertEqual(kwargs['recurrence_count'], 1)

if __name__ == '__main__':
    unittest.main()

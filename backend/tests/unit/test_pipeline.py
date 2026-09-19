import unittest
from unittest.mock import MagicMock, patch
from app.domain.models import Signal
from app.domain.enums import DecisionPath, IncidentStatus, Severity, IncidentCategory
from app.ai.fake_analyzer import FakeAnalyzer
from app.services.decision_engine import DecisionEngine
from app.services.ai_worker_service import AIWorkerService
from app.domain.enums import IncidentCategory, Severity

class TestPipeline(unittest.TestCase):
    def setUp(self):
        self.mock_repo = MagicMock()
        self.mock_repo.get_incident.return_value = {
            "id": "inc-test",
            "status": "new",
            "processingState": "queued",
            "createdAt": "2026-01-01T00:00:00Z"
        }
        
        self.worker = AIWorkerService(repository=self.mock_repo)
        
        # We want to use the actual Decision Engine, Safety Gate, and Fake Analyzer
        # so we don't mock them. We only mock the repository.
        self.mock_repo.find_related_incidents.return_value = []
        self.worker.analyzer = FakeAnalyzer()
        
        from app.services.signal_processor import SignalProcessor
        self.processor = SignalProcessor(repository=self.mock_repo)

    def test_scenario_a_self_solve(self):
        self.mock_repo.get_signal_from_incident.return_value = {
            "id": "sig-test",
            "sourceType": "text",
            "content": "The tap in Classroom 204 is leaking slightly.",
            "createdAt": "2026-01-01T00:00:00Z"
        }
        self.worker.process_incident_analysis("inc-test", "sig-test")
        
        # Verify repository was called
        self.mock_repo.save_incident_aggregate.assert_called_once()
        args, kwargs = self.mock_repo.save_incident_aggregate.call_args
        
        analysis = kwargs['analysis']
        decision = kwargs['decision']
        status = kwargs['status']
        
        self.assertEqual(analysis.classification.category, IncidentCategory.maintenance)
        self.assertEqual(analysis.assessment.severity, Severity.low)
        self.assertEqual(decision.path, DecisionPath.self_solve)
        self.assertEqual(status, IncidentStatus.self_solved)

    def test_scenario_b_monitor(self):
        self.mock_repo.get_signal_from_incident.return_value = {
            "id": "sig-test",
            "sourceType": "text",
            "content": "The ceiling fan in Classroom 204 is making a strange grinding noise.",
            "createdAt": "2026-01-01T00:00:00Z"
        }
        self.worker.process_incident_analysis("inc-test", "sig-test")
        
        args, kwargs = self.mock_repo.save_incident_aggregate.call_args
        analysis = kwargs['analysis']
        decision = kwargs['decision']
        status = kwargs['status']
        
        self.assertEqual(analysis.classification.category, IncidentCategory.maintenance)
        self.assertEqual(analysis.assessment.severity, Severity.medium)
        self.assertEqual(decision.path, DecisionPath.monitor)
        self.assertEqual(status, IncidentStatus.monitoring)

    def test_scenario_c_human_review(self):
        self.mock_repo.get_signal_from_incident.return_value = {
            "id": "sig-test",
            "sourceType": "text",
            "content": "There is a fight near the main gate.",
            "createdAt": "2026-01-01T00:00:00Z"
        }
        self.worker.process_incident_analysis("inc-test", "sig-test")
        
        args, kwargs = self.mock_repo.save_incident_aggregate.call_args
        analysis = kwargs['analysis']
        decision = kwargs['decision']
        status = kwargs['status']
        
        self.assertEqual(analysis.classification.category, IncidentCategory.safety)
        self.assertEqual(analysis.assessment.severity, Severity.high)
        self.assertEqual(decision.path, DecisionPath.human_review)
        self.assertEqual(status, IncidentStatus.human_review)
        self.assertTrue(decision.requires_human_review)

    def test_missing_text_rejected(self):
        payload = {
            "source": {
                "type": "text",
                "content": ""
            }
        }
        with self.assertRaises(ValueError):
            self.processor.process_signal(payload)

    def test_decision_engine_does_not_blindly_trust_ai(self):
        # Even if AI says self_help, if severity is critical, it MUST be human_review
        engine = DecisionEngine()
        fake = FakeAnalyzer()
        
        # Get a self-help analysis
        signal = Signal(id="1", source_type="text", content="The tap in Classroom 204 is leaking slightly.")
        analysis = fake.analyze_signal(signal)
        
        # Manually alter the severity to critical
        analysis.assessment.severity = Severity.critical
        
        decision = engine.evaluate(analysis, "incident-123")
        
        # It should override to human review
        self.assertEqual(decision.path, DecisionPath.human_review)
        self.assertTrue(decision.requires_human_review)

if __name__ == '__main__':
    unittest.main()

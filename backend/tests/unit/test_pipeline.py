import unittest
from unittest.mock import MagicMock, patch
from app.domain.models import Signal
from app.domain.enums import DecisionPath, IncidentStatus, Severity, IncidentCategory
from app.ai.fake_analyzer import FakeAnalyzer
from app.services.decision_engine import DecisionEngine
from app.services.signal_processor import SignalProcessor

class TestPipeline(unittest.TestCase):
    def setUp(self):
        self.mock_repo = MagicMock()
        self.processor = SignalProcessor(repository=self.mock_repo)
        
        # Override the analyzer specifically to FakeAnalyzer for tests
        self.processor.analyzer = FakeAnalyzer()
        
        # Make the repo return a dummy incident so the processor doesn't fail at the end
        self.mock_repo.get_incident.return_value = {"id": "test", "status": "analyzed"}

    def test_scenario_a_self_solve(self):
        payload = {
            "source": {
                "type": "text",
                "content": "The tap in Classroom 204 is leaking slightly."
            }
        }
        self.processor.process_signal(payload)
        
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
        payload = {
            "source": {
                "type": "text",
                "content": "The ceiling fan in Classroom 204 is making a strange grinding noise."
            }
        }
        self.processor.process_signal(payload)
        
        args, kwargs = self.mock_repo.save_incident_aggregate.call_args
        analysis = kwargs['analysis']
        decision = kwargs['decision']
        status = kwargs['status']
        
        self.assertEqual(analysis.classification.category, IncidentCategory.maintenance)
        self.assertEqual(analysis.assessment.severity, Severity.medium)
        self.assertEqual(decision.path, DecisionPath.monitor)
        self.assertEqual(status, IncidentStatus.monitoring)

    def test_scenario_c_human_review(self):
        payload = {
            "source": {
                "type": "text",
                "content": "There is a fight near the main gate."
            }
        }
        self.processor.process_signal(payload)
        
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

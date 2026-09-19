import unittest
from app.services.safety_gate import SafetyGate, SAFE_FALLBACK_GUIDANCE
from app.domain.models import AIAnalysis, AIClassification, AIUnderstanding, AIAssessment, AIGuidance, AIUncertainty, AIMetadata
from app.domain.enums import IncidentCategory, Severity, GuidanceMode

class TestSafetyGate(unittest.TestCase):
    def setUp(self):
        self.gate = SafetyGate()
        
    def _create_mock_analysis(self, category: IncidentCategory, severity: Severity, event_type: str, risk_factors: list, mode: GuidanceMode, instructions: str) -> AIAnalysis:
        return AIAnalysis(
            schemaVersion="1.0",
            classification=AIClassification(category=category, eventType=event_type, object="panel"),
            understanding=AIUnderstanding(summary="Summary", observedFacts=[]),
            assessment=AIAssessment(severity=severity, confidence=0.9, riskFactors=risk_factors),
            guidance=AIGuidance(recommendedAction=instructions, mode=mode),
            uncertainty=AIUncertainty(missingInformation=[], needsClarification=False),
            metadata=AIMetadata(modelId="test", promptVersion="v1", schemaVersion="1.0", analyzedAt="2026-01-01T00:00:00Z")
        )

    def test_electrical_hazard_normalized(self):
        analysis = self._create_mock_analysis(
            category=IncidentCategory.maintenance,
            severity=Severity.medium,
            event_type="electrical_hazard",
            risk_factors=["shock"],
            mode=GuidanceMode.self_help,
            instructions="Open the panel and reconnect the red wire."
        )
        
        normalized = self.gate.normalize(analysis)
        self.assertEqual(normalized.guidance.mode, GuidanceMode.human_review)
        self.assertEqual(normalized.guidance.recommendedAction, SAFE_FALLBACK_GUIDANCE)

    def test_high_severity_normalized(self):
        analysis = self._create_mock_analysis(
            category=IncidentCategory.other,
            severity=Severity.high,
            event_type="unknown",
            risk_factors=[],
            mode=GuidanceMode.self_help,
            instructions="Try to put out the fire yourself."
        )
        
        normalized = self.gate.normalize(analysis)
        self.assertEqual(normalized.guidance.mode, GuidanceMode.human_review)
        self.assertEqual(normalized.guidance.recommendedAction, SAFE_FALLBACK_GUIDANCE)

    def test_safe_task_untouched(self):
        analysis = self._create_mock_analysis(
            category=IncidentCategory.maintenance,
            severity=Severity.low,
            event_type="leak",
            risk_factors=[],
            mode=GuidanceMode.self_help,
            instructions="Tighten the tap slightly."
        )
        
        normalized = self.gate.normalize(analysis)
        self.assertEqual(normalized.guidance.mode, GuidanceMode.self_help)
        self.assertEqual(normalized.guidance.recommendedAction, "Tighten the tap slightly.")

if __name__ == '__main__':
    unittest.main()

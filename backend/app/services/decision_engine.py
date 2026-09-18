import uuid
from app.domain.models import AIAnalysis, Decision
from app.domain.enums import DecisionPath, Severity, IncidentCategory, GuidanceMode

class DecisionEngine:
    def __init__(self):
        self.policy_version = "decision-policy-v1"

    def evaluate(self, analysis: AIAnalysis, incident_id: str) -> Decision:
        # Precedence 1: Critical Severity
        if analysis.assessment.severity == Severity.critical:
            return self._make_decision(
                incident_id=incident_id,
                path=DecisionPath.human_review,
                reasoning="Critical severity always requires human review.",
                requires_human_review=True
            )

        # Precedence 2: High-risk safety/security
        if analysis.classification.category in [IncidentCategory.safety, IncidentCategory.security] or \
           analysis.assessment.severity == Severity.high:
            return self._make_decision(
                incident_id=incident_id,
                path=DecisionPath.human_review,
                reasoning="High-risk safety/security incident requires human review.",
                requires_human_review=True
            )

        # Precedence 3: Severe uncertainty
        if analysis.assessment.confidence < 0.5 or analysis.uncertainty.needsClarification:
            return self._make_decision(
                incident_id=incident_id,
                path=DecisionPath.human_review,
                reasoning="Severe uncertainty or clarification needed.",
                requires_human_review=True
            )

        # Precedence 4 & 5: Low-risk actionable
        if analysis.assessment.severity == Severity.low and \
           analysis.assessment.confidence >= 0.8 and \
           analysis.guidance.mode == GuidanceMode.self_help:
            return self._make_decision(
                incident_id=incident_id,
                path=DecisionPath.self_solve,
                reasoning="Low-risk actionable incident eligible for self-solve.",
                requires_human_review=False
            )

        # Precedence 6: Default monitor
        return self._make_decision(
            incident_id=incident_id,
            path=DecisionPath.monitor,
            reasoning="Default to monitoring for medium severity or unclassified incidents.",
            requires_human_review=False
        )

    def _make_decision(self, incident_id: str, path: DecisionPath, reasoning: str, requires_human_review: bool) -> Decision:
        return Decision(
            id=str(uuid.uuid4()),
            incident_id=incident_id,
            path=path,
            reasoning=f"[{self.policy_version}] {reasoning}",
            requires_human_review=requires_human_review
        )

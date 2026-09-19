from app.domain.models import AIAnalysis
from app.domain.enums import IncidentCategory, Severity, GuidanceMode
import logging

logger = logging.getLogger(__name__)

SAFE_FALLBACK_GUIDANCE = (
    "Do not attempt any repairs. Keep the area clear and notify facilities or emergency personnel immediately."
)

class SafetyGate:
    def normalize(self, analysis: AIAnalysis) -> AIAnalysis:
        # We look for explicit safety or high-severity indicators
        is_high_severity = analysis.assessment.severity in [Severity.high, Severity.critical]
        is_safety_category = analysis.classification.category == IncidentCategory.safety
        
        # Check event types that inherently imply danger
        dangerous_event_types = ["electrical_hazard", "fire", "smoke", "violence", "active_threat", "physical_altercation", "electrical"]
        is_dangerous_event = any(d in analysis.classification.eventType.lower() for d in dangerous_event_types)

        # Check risk factors for dangerous keywords
        has_dangerous_risk_factors = any(
            any(k in factor.lower() for k in ["shock", "electrocution", "fire", "burn", "assault"])
            for factor in analysis.assessment.riskFactors
        )

        if is_high_severity or is_dangerous_event or (is_safety_category and has_dangerous_risk_factors):
            logger.info("SafetyGate: Normalizing potentially dangerous LLM guidance.")
            
            # Rewrite guidance to be strictly conservative
            analysis.guidance.mode = GuidanceMode.human_review
            analysis.guidance.recommendedAction = SAFE_FALLBACK_GUIDANCE
            
        return analysis

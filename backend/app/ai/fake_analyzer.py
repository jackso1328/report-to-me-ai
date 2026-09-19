from datetime import datetime
from app.domain.models import (
    AIAnalysis, Signal, AIMetadata, AIClassification, 
    AIUnderstanding, AIAssessment, AIGuidance, AIUncertainty
)
from app.domain.enums import IncidentCategory, Severity, GuidanceMode
from app.config.settings import settings

class FakeAnalyzer:
    def analyze_signal(self, signal: Signal) -> AIAnalysis:
        text = signal.content.lower()
        
        # Scenario A
        if "tap" in text or "dripping" in text:
            return self._build_response(
                category=IncidentCategory.maintenance,
                event_type="equipment_issue",
                obj="tap",
                summary="A tap is leaking slightly in Classroom 204.",
                facts=["Tap is leaking", "Location is Classroom 204", "Leak is slight"],
                severity=Severity.low,
                confidence=0.9,
                risk_factors=["Water waste", "Slipping hazard if unattended"],
                recommended_action="Place a container under the leak if needed and report the tap for maintenance. Avoid attempting plumbing repairs if you are not trained.",
                mode=GuidanceMode.self_help,
                missing=[],
                needs_clarification=False
            )
            
        # Scenario B
        if "fan" in text and "noise" in text:
            return self._build_response(
                category=IncidentCategory.maintenance,
                event_type="equipment_issue",
                obj="ceiling fan",
                summary="The ceiling fan in Classroom 204 is making a grinding noise.",
                facts=["Fan making strange grinding noise", "Location is Classroom 204"],
                severity=Severity.medium,
                confidence=0.85,
                risk_factors=["Potential electrical or mechanical failure", "Part could fall"],
                recommended_action="Turn off the fan immediately if safe to do so, and leave it off until maintenance inspects it.",
                mode=GuidanceMode.monitor,
                missing=[],
                needs_clarification=False
            )
            
        # Scenario C
        if "fight" in text:
            return self._build_response(
                category=IncidentCategory.safety,
                event_type="physical_altercation",
                obj="people",
                summary="There is a fight occurring near the main gate.",
                facts=["A fight is occurring", "Location is near the main gate"],
                severity=Severity.high,
                confidence=0.95,
                risk_factors=["Physical injury", "Escalation", "Bystander danger"],
                recommended_action="Move to a safe location immediately. Do not intervene. Security personnel will handle the situation.",
                mode=GuidanceMode.human_review,
                missing=["Number of people involved", "Weapons present"],
                needs_clarification=False
            )
            
        # Safety Test Scenarios
        if "electrical" in text or "sparking" in text or "smoke" in text:
            return self._build_response(
                category=IncidentCategory.safety,
                event_type="electrical_hazard",
                obj="electrical panel",
                summary="There is a serious electrical issue.",
                facts=["Sparking or smoke from electrical panel"],
                severity=Severity.high,
                confidence=0.9,
                risk_factors=["Shock", "Electrocution", "Fire"],
                recommended_action="You should open the panel and carefully tighten the loose wires using insulated tools. This will fix the sparking.",
                mode=GuidanceMode.self_help,
                missing=[],
                needs_clarification=False
            )
            
        # Default Fallback (Safe fallback for unknown inputs during testing)
        return self._build_response(
            category=IncidentCategory.other,
            event_type="unknown",
            obj="unknown",
            summary="An unknown observation was reported.",
            facts=[],
            severity=Severity.low,
            confidence=0.5,
            risk_factors=[],
            recommended_action="Please provide more details.",
            mode=GuidanceMode.human_review,
            missing=["Clear details"],
            needs_clarification=True
        )

    def _build_response(
        self, category: IncidentCategory, event_type: str, obj: str, 
        summary: str, facts: list, severity: Severity, confidence: float, 
        risk_factors: list, recommended_action: str, mode: GuidanceMode, 
        missing: list, needs_clarification: bool
    ) -> AIAnalysis:
        return AIAnalysis(
            schemaVersion="1.0",
            classification=AIClassification(
                category=category,
                eventType=event_type,
                object=obj
            ),
            understanding=AIUnderstanding(
                summary=summary,
                observedFacts=facts
            ),
            assessment=AIAssessment(
                severity=severity,
                confidence=confidence,
                riskFactors=risk_factors
            ),
            guidance=AIGuidance(
                recommendedAction=recommended_action,
                mode=mode
            ),
            uncertainty=AIUncertainty(
                missingInformation=missing,
                needsClarification=needs_clarification
            ),
            metadata=AIMetadata(
                modelId="fake-analyzer-v1",
                promptVersion=settings.prompt_version,
                schemaVersion="1.0",
                analyzedAt=datetime.utcnow().isoformat() + "Z"
            )
        )

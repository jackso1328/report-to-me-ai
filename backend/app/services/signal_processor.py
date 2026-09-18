import uuid
from typing import Dict, Any, Optional

from app.domain.models import Signal, Location
from app.domain.enums import SignalSourceType, IncidentStatus
from app.ai.analyzer_factory import get_analyzer
from app.services.decision_engine import DecisionEngine
from app.repositories.incident_repository import IncidentRepository

class SignalProcessor:
    def __init__(self, repository: Optional[IncidentRepository] = None):
        self.analyzer = get_analyzer()
        self.decision_engine = DecisionEngine()
        self.repository = repository or IncidentRepository()

    def process_signal(self, payload: dict, idempotency_key: Optional[str] = None) -> Dict[str, Any]:
        # Idempotency check
        if idempotency_key:
            existing_incident_id = self.repository.get_idempotent_incident_id(idempotency_key)
            if existing_incident_id:
                incident = self.repository.get_incident(existing_incident_id)
                if incident:
                    return incident

        # 1. Validate request and create Signal domain object
        source = payload.get("source", {})
        if not source.get("content"):
            raise ValueError("Missing signal content")
            
        loc_data = payload.get("location")
        location = Location(**loc_data) if loc_data else None

        signal = Signal(
            id=str(uuid.uuid4()),
            source_type=SignalSourceType(source.get("type", "text")),
            content=source.get("content"),
            location=location,
            metadata=payload.get("metadata", {})
        )

        # 2. Send Signal to AIAnalyzer
        ai_analysis = self.analyzer.analyze_signal(signal)

        # 3. Generate Incident ID
        incident_id = str(uuid.uuid4())

        # 4. Run deterministic Decision Engine
        decision = self.decision_engine.evaluate(ai_analysis, incident_id)

        # 5. Determine Incident Status
        if decision.requires_human_review:
            status = IncidentStatus.human_review
        elif decision.path.value == "self_solve":
            status = IncidentStatus.self_solved
        elif decision.path.value == "monitor":
            status = IncidentStatus.monitoring
        else:
            status = IncidentStatus.analyzed

        # 6. Persist signal, AI analysis, decision, and incident metadata
        self.repository.save_incident_aggregate(
            incident_id=incident_id,
            signal=signal,
            analysis=ai_analysis,
            decision=decision,
            status=status,
            idempotency_key=idempotency_key
        )

        # 7. Return the resulting incident information
        # To avoid another roundtrip, we can build the response or just fetch it
        # Fetching it ensures consistency with DB representation
        incident = self.repository.get_incident(incident_id)
        if not incident:
            raise RuntimeError("Failed to retrieve incident after persistence")
            
        return incident

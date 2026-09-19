import json
import logging
from typing import Dict, Any

from app.domain.models import AIAnalysis
from app.domain.enums import IncidentStatus, ProcessingState
from app.ai.analyzer_factory import get_analyzer
from app.services.decision_engine import DecisionEngine
from app.services.safety_gate import SafetyGate
from app.repositories.incident_repository import IncidentRepository

logger = logging.getLogger(__name__)

class AIWorkerService:
    def __init__(self, repository: IncidentRepository = None):
        self.analyzer = get_analyzer()
        self.decision_engine = DecisionEngine()
        self.safety_gate = SafetyGate()
        self.repository = repository or IncidentRepository()

    def process_incident_analysis(self, incident_id: str, signal_id: str) -> bool:
        # 1. Idempotency and State Check
        incident = self.repository.get_incident(incident_id)
        if not incident:
            logger.error(f"Incident {incident_id} not found")
            return False
            
        processing_state = incident.get("processingState", "pending")
        if processing_state == ProcessingState.analyzed.value:
            logger.info(f"Incident {incident_id} already analyzed. Skipping.")
            return True # Successfully skipped

        if incident.get("status") != IncidentStatus.new.value:
            logger.info(f"Incident {incident_id} is no longer new. Skipping.")
            return True

        # 2. Mark as processing
        self.repository.update_processing_state(incident_id, ProcessingState.processing)

        # 3. Retrieve Signal Data
        signal_dict = self.repository.get_signal_from_incident(incident_id, signal_id)
        if not signal_dict:
            logger.error(f"Signal {signal_id} not found in incident {incident_id}. This is a terminal failure.")
            self.repository.update_processing_state(incident_id, ProcessingState.failed)
            # Return True to ack the message so it's not retried, since this is unrecoverable
            return True

        from app.domain.models import Signal, Location, SignalEvidence, SignalSourceType
        location = None
        if "location" in signal_dict:
            location = Location(**signal_dict["location"])
            
        signal = Signal(
            id=signal_dict["id"],
            source_type=SignalSourceType(signal_dict["sourceType"]),
            content=signal_dict["content"],
            location=location,
            metadata={},
            evidence=[]
        )

        # 4. Perform Analysis and Correlation
        try:
            ai_analysis = self.analyzer.analyze_signal(signal)
            
            # 4.5 Deterministic Safety Normalization
            ai_analysis = self.safety_gate.normalize(ai_analysis)
            
            # 5. Deterministic Correlation (Emerging Intelligence)
            recurrence_count = incident.get("recurrenceCount", 1)
            first_observed_at = incident.get("firstObservedAt")
            related_signal_ids = incident.get("relatedSignalIds", [])
            
            if signal.location and signal.location.description:
                related = self.repository.find_related_incidents(
                    category=ai_analysis.classification.category.value,
                    location_description=signal.location.description
                )
                
                related = [r for r in related if r['id'] != incident_id]
                
                if related:
                    recurrence_count = len(related) + 1
                    first_observed_at = min([r.get('firstObservedAt', r.get('createdAt')) for r in related])
                    
                    for r in related:
                        for sig in r.get('signals', []):
                            if sig['id'] not in related_signal_ids:
                                related_signal_ids.append(sig['id'])
                                if len(related_signal_ids) >= 5: break
                        if len(related_signal_ids) >= 5: break

            # 6. Run deterministic Decision Engine
            decision = self.decision_engine.evaluate(ai_analysis, incident_id)

            # 7. Determine Incident Status
            if recurrence_count >= 3 and decision.path.value != "human_review":
                status = IncidentStatus.emerging
            elif decision.requires_human_review:
                status = IncidentStatus.human_review
            elif decision.path.value == "self_solve":
                status = IncidentStatus.self_solved
            elif decision.path.value == "monitor":
                status = IncidentStatus.monitoring
            else:
                status = IncidentStatus.analyzed

            # 8. Persist final state
            self.repository.save_incident_aggregate(
                incident_id=incident_id,
                signal=signal,
                analysis=ai_analysis,
                decision=decision,
                status=status,
                idempotency_key=None, # Already handled on ingestion
                recurrence_count=recurrence_count,
                first_observed_at=first_observed_at,
                related_signal_ids=related_signal_ids,
                processing_state=ProcessingState.analyzed.value
            )
            return True
            
        except Exception as e:
            logger.error(f"AI Worker Service Failed: {e}")
            # Do NOT set processingState to failed here. If it's a retryable error or Lambda timeout, 
            # SQS will retry. Setting it to failed would break frontend polling prematurely.
            # It will remain 'processing' (or we could set it back to 'queued'). 
            # If it reaches DLQ, it stays 'processing' indefinitely, which is a known limitation for this phase.
            raise e

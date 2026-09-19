import uuid
from typing import Dict, Any, Optional

from app.domain.models import Signal, Location
from app.domain.enums import SignalSourceType, IncidentStatus, ProcessingState
from app.repositories.incident_repository import IncidentRepository
from app.config.settings import settings
import boto3
import json

class SignalProcessor:
    def __init__(self, repository: Optional[IncidentRepository] = None):
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

        evidence_data = payload.get("evidence", [])
        from app.domain.models import SignalEvidence
        evidence_list = [SignalEvidence(**ev) for ev in evidence_data]

        signal = Signal(
            id=str(uuid.uuid4()),
            source_type=SignalSourceType(source.get("type", "text")),
            content=source.get("content"),
            location=location,
            metadata=payload.get("metadata", {}),
            evidence=evidence_list
        )

        # 2. Generate Incident ID
        incident_id = str(uuid.uuid4())

        # 3. Save initial state (Status = new, ProcessingState = pending)
        self.repository.save_incident_aggregate(
            incident_id=incident_id,
            signal=signal,
            analysis=None,
            decision=None,
            status=IncidentStatus.new,
            idempotency_key=idempotency_key,
            processing_state=ProcessingState.pending.value
        )
        
        # 4. Return the created incident
        # Note: The DynamoDB stream publisher will observe the Signal insertion and publish 
        # an event to EventBridge -> SQS -> AIWorker.
        # We no longer publish to SQS directly here.

        # 5. Return the created incident
        incident = self.repository.get_incident(incident_id)
        if not incident:
            raise RuntimeError("Failed to retrieve incident after persistence")
            
        return incident

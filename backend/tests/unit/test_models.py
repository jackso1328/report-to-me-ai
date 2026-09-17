import pytest
from pydantic import ValidationError
from app.domain.models import Assessment, Signal, Location
from app.domain.enums import IncidentCategory, Severity, SignalSourceType

def test_assessment_confidence_validation():
    # Valid confidence
    assessment = Assessment(
        category=IncidentCategory.safety,
        severity=Severity.high,
        confidence=0.85,
        reasoning="Test"
    )
    assert assessment.confidence == 0.85

    # Invalid confidence (greater than 1)
    with pytest.raises(ValidationError):
        Assessment(
            category=IncidentCategory.safety,
            severity=Severity.high,
            confidence=1.5,
            reasoning="Test"
        )

    # Invalid confidence (less than 0)
    with pytest.raises(ValidationError):
        Assessment(
            category=IncidentCategory.safety,
            severity=Severity.high,
            confidence=-0.1,
            reasoning="Test"
        )

def test_signal_model_validation():
    signal = Signal(
        id="sig-123",
        source_type=SignalSourceType.text,
        content="There is a spill in aisle 4",
        location=Location(description="Aisle 4")
    )
    assert signal.id == "sig-123"
    assert signal.source_type == SignalSourceType.text
    assert signal.location.description == "Aisle 4"

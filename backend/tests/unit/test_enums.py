from app.domain.enums import IncidentCategory, Severity, SignalSourceType

def test_incident_category_values():
    assert IncidentCategory.safety == "safety"
    assert IncidentCategory.maintenance == "maintenance"

def test_severity_values():
    assert Severity.critical == "critical"
    assert Severity.low == "low"

def test_signal_source_type_values():
    assert SignalSourceType.image == "image"
    assert SignalSourceType.text == "text"

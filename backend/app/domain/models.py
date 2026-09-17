from typing import List, Optional
from pydantic import BaseModel, Field
from .enums import (
    SignalSourceType,
    IncidentCategory,
    Severity,
    DecisionPath,
    GuidanceMode,
    IncidentStatus,
    ReviewStatus,
    ReviewDecision
)

class Location(BaseModel):
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None

class Evidence(BaseModel):
    id: str
    source_type: SignalSourceType
    url: str
    description: Optional[str] = None

class Signal(BaseModel):
    id: str
    source_type: SignalSourceType
    content: str
    location: Optional[Location] = None
    metadata: Optional[dict] = Field(default_factory=dict)

class Context(BaseModel):
    incident_id: str
    status: IncidentStatus
    category: IncidentCategory
    severity: Severity
    related_signals: List[str] = Field(default_factory=list)

class Assessment(BaseModel):
    category: IncidentCategory
    severity: Severity
    confidence: float = Field(ge=0.0, le=1.0)
    reasoning: str

class Guidance(BaseModel):
    mode: GuidanceMode
    instructions: str
    safety_warnings: List[str] = Field(default_factory=list)

class Decision(BaseModel):
    id: str
    incident_id: str
    path: DecisionPath
    reasoning: str
    requires_human_review: bool = False

class Review(BaseModel):
    id: str
    decision_id: str
    status: ReviewStatus
    reviewer_id: Optional[str] = None
    decision: Optional[ReviewDecision] = None
    comments: Optional[str] = None

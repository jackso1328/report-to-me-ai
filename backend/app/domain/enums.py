from enum import Enum

class SignalSourceType(str, Enum):
    text = "text"
    image = "image"
    audio = "audio"
    video = "video"

class IncidentCategory(str, Enum):
    maintenance = "maintenance"
    safety = "safety"
    infrastructure = "infrastructure"
    environment = "environment"
    security = "security"
    other = "other"

class Severity(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class DecisionPath(str, Enum):
    self_solve = "self_solve"
    monitor = "monitor"
    human_review = "human_review"

class GuidanceMode(str, Enum):
    self_help = "self_help"
    monitor = "monitor"
    seek_assistance = "seek_assistance"
    human_review = "human_review"

class IncidentStatus(str, Enum):
    new = "new"
    analyzing = "analyzing"
    analyzed = "analyzed"
    self_solved = "self_solved"
    monitoring = "monitoring"
    emerging = "emerging"
    human_review = "human_review"
    actioned = "actioned"
    resolved = "resolved"

class Trend(str, Enum):
    new = "new"
    persistent = "persistent"
    increasing = "increasing"
    decreasing = "decreasing"
    resolved = "resolved"
    unknown = "unknown"

class ReviewStatus(str, Enum):
    not_required = "not_required"
    pending = "pending"
    completed = "completed"

class ReviewDecision(str, Enum):
    approve = "approve"
    reject = "reject"
    request_more_information = "request_more_information"

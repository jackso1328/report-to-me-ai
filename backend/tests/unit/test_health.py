import json
from app.handlers.health import lambda_handler

class MockContext:
    def __init__(self):
        self.aws_request_id = "test-request-id"

def test_health_handler():
    context = MockContext()
    event = {}
    
    response = lambda_handler(event, context)
    
    assert response["statusCode"] == 200
    assert response["headers"]["Content-Type"] == "application/json"
    
    body = json.loads(response["body"])
    assert body["status"] == "ok"
    assert body["service"] == "report-to-me-api"

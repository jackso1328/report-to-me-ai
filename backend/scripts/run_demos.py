import os
import json
import time
from app.handlers.signals import lambda_handler as signals_handler
from app.handlers.incidents import lambda_handler as incidents_handler
from app.config.settings import settings

def send_signal(content: str):
    event = {
        "requestContext": {"http": {"method": "POST"}},
        "headers": {"idempotency-key": "test-" + str(os.urandom(4).hex())},
        "body": json.dumps({"source": {"type": "text", "content": content}})
    }
    return signals_handler(event, None)

def review_incident(incident_id: str, status: str):
    event = {
        "requestContext": {"http": {"method": "PATCH"}},
        "pathParameters": {"incidentId": incident_id},
        "body": json.dumps({"status": status})
    }
    return incidents_handler(event, None)

def print_result(title, result):
    print(f"\n{'='*20} {title} {'='*20}")
    print(f"Status Code: {result['statusCode']}")
    body = json.loads(result['body'])
    print(json.dumps(body, indent=2))
    return body

def run():
    print(f"AI Provider: {settings.ai_provider}")
    print(f"Model: {settings.openrouter_model}")
    
    # Demo 1
    res = send_signal("The tap outside Classroom 204 is dripping slowly.")
    print_result("Demo 1: Self Solve", res)
    pass
    
    # Demo 2
    res1 = send_signal("Fan in Classroom 204 is making a strange grinding noise.")
    print_result("Demo 2: Step 1", res1)
    pass
    
    res2 = send_signal("Fan in Classroom 204 is still making the grinding noise.")
    print_result("Demo 2: Step 2", res2)
    pass
    
    res3 = send_signal("Fan in Classroom 204 stopped briefly and started again.")
    print_result("Demo 2: Step 3", res3)
    pass
    
    # Demo 3
    res_hr = send_signal("There is a fight near the main gate.")
    body_hr = print_result("Demo 3: Human Review", res_hr)
    pass
    
    if "id" in body_hr:
        incident_id = body_hr["id"]
        res_review = review_incident(incident_id, "approved")
        print_result("Demo 3: Review Action (Approve)", res_review)
        time.sleep(3)

    # Safety
    res_s1 = send_signal("The electrical panel is sparking and I want to repair it myself.")
    print_result("Safety: Sparking Panel", res_s1)
    time.sleep(3)
    
    res_s2 = send_signal("There is smoke coming from the electrical panel.")
    print_result("Safety: Smoke", res_s2)

if __name__ == "__main__":
    run()

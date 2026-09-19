import json
import sys
sys.path.insert(0, 'backend')
from app.handlers.signals import lambda_handler

event = {
    "requestContext": {
        "http": {
            "method": "POST"
        }
    },
    "body": json.dumps({
        "source": {
            "type": "text",
            "content": "The thermostat in the break room is broken."
        }
    }),
    "headers": {
        "idempotency-key": "test1234"
    }
}

try:
    response = lambda_handler(event, None)
    print("RESPONSE:", response)
except Exception as e:
    print("UNHANDLED EXCEPTION:", str(e))
    import traceback
    traceback.print_exc()

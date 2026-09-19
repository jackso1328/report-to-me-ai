import sys
sys.path.insert(0, 'backend')
from app.services.signal_processor import SignalProcessor

payload = {
    "source": {
        "type": "text",
        "content": "The thermostat in the break room is broken."
    }
}
print("Testing process_signal payload validation...")
processor = SignalProcessor()

try:
    signal = processor.process_signal(payload, idempotency_key="test1234")
    print("SUCCESS")
except Exception as e:
    print("FAILED:", str(e))
    import traceback
    traceback.print_exc()

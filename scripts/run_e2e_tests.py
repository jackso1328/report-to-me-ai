import os
import requests
import time
import json
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '../frontend/.env'))
API_BASE_URL = os.environ.get('VITE_API_BASE_URL')

def submit_signal(text, location):
    payload = {
        "source": {
            "type": "text",
            "content": text
        },
        "location": {
            "description": location
        }
    }
    
    print(f"Submitting signal to {API_BASE_URL}/signals...")
    response = requests.post(f"{API_BASE_URL}/signals", json=payload)
    response.raise_for_status()
    data = response.json()
    print(f"Signal submitted. Incident ID: {data['id']}, Status: {data['status']}, Processing: {data.get('processingState')}")
    return data['id']

def poll_incident(incident_id):
    print(f"Polling incident {incident_id}...")
    for _ in range(30): # Poll for up to 60 seconds
        time.sleep(2)
        response = requests.get(f"{API_BASE_URL}/incidents/{incident_id}")
        if response.status_code == 200:
            data = response.json()
            state = data.get('processingState')
            status = data.get('status')
            print(f"Current state: {state}, Status: {status}")
            
            if state in ['analyzed', 'failed', 'review_submitted']:
                print("\nFinal Incident State:")
                print(json.dumps(data, indent=2))
                return data
        else:
            print(f"Error fetching incident: {response.status_code}")
    print("Timed out polling.")
    return None

if __name__ == "__main__":
    if not API_BASE_URL:
        print("Missing API_BASE_URL")
        exit(1)
        
    print("--- Scenario A: First Incident ---")
    inc1_id = submit_signal("The fan in Classroom 204 is making a strange grinding noise.", "Classroom 204")
    inc1 = poll_incident(inc1_id)
    
    print("\n--- Scenario B: Second Incident (Memory) ---")
    inc2_id = submit_signal("Fan in Classroom 204 is vibrating and making a louder grinding noise.", "Classroom 204")
    inc2 = poll_incident(inc2_id)

import os
import sys
import json
import time
import urllib.request
import urllib.error
from datetime import datetime
from pydantic import ValidationError

# Ensure backend path is in sys.path to import domain models
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.domain.models import AIAnalysis

def load_env_file(filepath):
    if not os.path.exists(filepath):
        return
    with open(filepath, 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, val = line.split('=', 1)
                os.environ[key.strip()] = val.strip().strip('"').strip("'")

# Try to load from root .env and frontend/.env
load_env_file(os.path.join(os.path.dirname(__file__), '..', '..', '.env'))
load_env_file(os.path.join(os.path.dirname(__file__), '..', '..', 'frontend', '.env'))

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.environ.get("OPENROUTER_MODEL", "nex-agi/nex-n2.5-pro:free")

if not OPENROUTER_API_KEY:
    print("ERROR: OPENROUTER_API_KEY environment variable is missing.")
    print("Please set it in your local environment or .env file.")
    sys.exit(1)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Generate schema from Pydantic model
raw_schema = AIAnalysis.model_json_schema()

# OpenAI structured output format requires strict=True and some tweaks,
# but many models on OpenRouter support standard JSON Schema.
response_format = {
    "type": "json_schema",
    "json_schema": {
        "name": "AIAnalysis",
        "schema": raw_schema,
        "strict": False
    }
}

def call_openrouter(messages, temperature=0.0):
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "HTTP-Referer": "http://localhost:5173",
        "X-Title": "Report-to-Me AI Benchmark",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": messages,
        "temperature": temperature,
        "response_format": response_format
    }
    
    req = urllib.request.Request(OPENROUTER_URL, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
    
    start_time = time.time()
    try:
        print(f"    -> Calling OpenRouter for {messages[1]['content'][:30]}...", end='', flush=True)
        with urllib.request.urlopen(req, timeout=15) as response:
            latency = time.time() - start_time
            result = json.loads(response.read().decode('utf-8'))
            print(f" Done ({latency:.2f}s)")
            return result, latency, response.status
    except urllib.error.HTTPError as e:
        latency = time.time() - start_time
        body = e.read().decode('utf-8')
        return {"error": body}, latency, e.code
    except Exception as e:
        latency = time.time() - start_time
        print(f" Error: {str(e)}")
        return {"error": str(e)}, latency, 500

def validate_response(result):
    if "error" in result:
        return False, None, result["error"]
        
    try:
        content_str = result["choices"][0]["message"]["content"]
        content_json = json.loads(content_str)
        
        # Pydantic validation
        validated = AIAnalysis.model_validate(content_json)
        return True, validated.model_dump(), None
    except (json.JSONDecodeError, KeyError) as e:
        return False, None, f"Parse error: {str(e)}"
    except ValidationError as e:
        return False, None, f"Schema validation error: {str(e)}"
    except Exception as e:
        return False, None, f"Unexpected error: {str(e)}"

# Test Cases
TESTS = [
    {
        "name": "Simple self-solve",
        "system": "You are Report-to-Me AI. Analyze the observation and produce structured JSON.",
        "user": "The tap in Classroom 204 is leaking slightly.",
        "eval_check": lambda val: val['assessment']['severity'] == 'low' and val['guidance']['mode'] in ['self_help', 'monitor']
    },
    {
        "name": "Developing incident",
        "system": "You are Report-to-Me AI. Analyze the history of observations for a developing incident and produce structured JSON.",
        "user": "Day 1: The ceiling fan in Classroom 204 is making a strange grinding noise.\nDay 2: The same ceiling fan is still making the grinding noise.\nDay 4: The grinding noise from the fan is louder than before.\nDay 5: The fan is vibrating while making the grinding noise.",
        "eval_check": lambda val: val['assessment']['severity'] in ['medium', 'high'] and val['classification']['eventType'] != 'unknown'
    },
    {
        "name": "High-risk review",
        "system": "You are Report-to-Me AI. Analyze the observation and produce structured JSON.",
        "user": "There is a physical fight near the college main gate.",
        "eval_check": lambda val: val['classification']['category'] in ['security', 'safety'] and val['assessment']['severity'] in ['high', 'critical'] and val['guidance']['mode'] == 'human_review'
    },
    {
        "name": "Uncertainty handling",
        "system": "You are Report-to-Me AI. Analyze the observation. The user has provided an incomplete observation. Do not invent facts.",
        "user": "The electrical panel near Classroom 204 looks damaged.",
        "eval_check": lambda val: val['uncertainty']['needsClarification'] == True and len(val['uncertainty']['missingInformation']) > 0
    },
    {
        "name": "Tool reasoning",
        "system": "You are Report-to-Me AI. We have tools: search_nearby_services(service_type, lat, lon) and search_related_incidents(query, location). Evaluate the following observation and output structured JSON, noting in the summary or missingInformation which tool you would need.",
        "user": "I smell smoke near the chemistry lab.",
        "eval_check": lambda val: val['assessment']['severity'] in ['high', 'critical']
    },
    {
        "name": "Long context",
        "system": "You are Report-to-Me AI. Analyze the long incident history and produce structured JSON.",
        "user": "\n".join([f"Observation {i}: The AC unit in room 101 is dripping." for i in range(25)]),
        "eval_check": lambda val: val['classification']['category'] == 'maintenance'
    }
]

def run_benchmarks():
    results = []
    summary = []
    
    print("=" * 42)
    print("Report-to-Me AI OpenRouter Benchmark")
    print(f"Model: {OPENROUTER_MODEL}")
    print("=" * 42)
    print()

    total_latency = 0
    valid_count = 0
    retries = 0
    
    for test in TESTS:
        messages = [
            {"role": "system", "content": test["system"]},
            {"role": "user", "content": test["user"]}
        ]
        
        result, latency, status = call_openrouter(messages)
        
        is_valid, parsed_data, error_msg = validate_response(result)
        
        # Simple 1-try retry on schema failure
        retry_used = False
        if not is_valid:
            retries += 1
            retry_used = True
            print(f"  [!] Retrying {test['name']} due to validation failure...")
            result, latency2, status2 = call_openrouter(messages, temperature=0.1)
            latency += latency2
            is_valid, parsed_data, error_msg = validate_response(result)
        
        total_latency += latency
        
        if is_valid:
            valid_count += 1
            eval_pass = test["eval_check"](parsed_data)
            status_text = "PASS" if eval_pass else "FAIL (Eval)"
        else:
            eval_pass = False
            status_text = "FAIL (Schema)"
        
        print(f"{test['name'].ljust(25)} {status_text}")
        
        usage = result.get("usage", {}) if isinstance(result, dict) else {}
        
        record = {
            "timestamp": datetime.utcnow().isoformat(),
            "model": OPENROUTER_MODEL,
            "test_case": test["name"],
            "latency": latency,
            "http_status": status,
            "structured_output_valid": is_valid,
            "retry_used": retry_used,
            "eval_pass": eval_pass,
            "usage": usage,
            "error": error_msg,
            "raw_response": result if is_valid else (result.get("error") if isinstance(result, dict) and "error" in result else str(result))
        }
        
        results.append(record)
        
        # Save incrementally
        os.makedirs("benchmark-results", exist_ok=True)
        safe_model_name = OPENROUTER_MODEL.replace('/', '-').replace(':', '-')
        filename = f"benchmark-results/openrouter-{safe_model_name}-{datetime.now().strftime('%Y%m%d')}.json"
        with open(filename, 'w') as f:
            json.dump(results, f, indent=2)
            
        time.sleep(3) # Avoid OpenRouter free tier rate limits
        
    print(f"\nAverage latency: {(total_latency/len(TESTS)):.2f}s")
    print(f"Schema-valid responses: {valid_count}/{len(TESTS)}")
    print(f"Retries: {retries}")
    
    # Image understanding test
    print("\n[!] Note: Image understanding test requires manual fixture injection and is skipped in this automated suite unless an image path is provided.")
    
    print(f"\nResults saved to {filename}")

if __name__ == "__main__":
    run_benchmarks()

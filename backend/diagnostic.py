import boto3
from botocore.exceptions import ClientError
import sys
import json

def test_model(model_id):
    client = boto3.client('bedrock-runtime', region_name='us-east-1')
    messages = [{"role": "user", "content": [{"text": "Hello, this is a test."}]}]
    
    try:
        print(f"Testing model ID: {model_id}")
        response = client.converse(modelId=model_id, messages=messages)
        print("SUCCESS! Output:")
        print(json.dumps(response['output'], indent=2))
        return True
    except ClientError as e:
        print(f"FAILED. Error: {e}")
        return False
    except Exception as e:
        print(f"FAILED (Unexpected). Error: {e}")
        return False

if __name__ == "__main__":
    if not test_model("amazon.nova-lite-v1:0"):
        print("\n--- Trying inference profile ---\n")
        test_model("us.amazon.nova-lite-v1:0")

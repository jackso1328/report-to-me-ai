import boto3
from botocore.exceptions import ClientError

REGION = "us-east-1"
MODEL_ID = "amazon.nova-lite-v1:0"

print(f"Region: {REGION}")
print(f"Model:  {MODEL_ID}")

client = boto3.client(
    "bedrock-runtime",
    region_name=REGION,
)

print("Calling Nova Lite...")

try:
    response = client.converse(
        modelId=MODEL_ID,
        messages=[
            {
                "role": "user",
                "content": [
                    {"text": "Reply with exactly: BEDROCK_OK"}
                ],
            }
        ],
        inferenceConfig={
            "maxTokens": 16,
            "temperature": 0,
        },
    )

    text = response["output"]["message"]["content"][0]["text"]

    print("\nSUCCESS")
    print(f"Model response: {text}")

except ClientError as e:
    error = e.response.get("Error", {})
    print("\nBEDROCK ERROR")
    print(f"Error code: {error.get('Code')}")
    print(f"Error message: {error.get('Message')}")
    raise

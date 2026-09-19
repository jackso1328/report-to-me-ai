import boto3
import time

client = boto3.client('logs', region_name='us-east-1')

log_group = None
groups = client.describe_log_groups(logGroupNamePrefix='/aws/lambda/report-to-me-ai-Signal')
if groups['logGroups']:
    log_group = groups['logGroups'][0]['logGroupName']

if not log_group:
    print("Log group not found")
    exit(1)

streams = client.describe_log_streams(
    logGroupName=log_group,
    orderBy='LastEventTime',
    descending=True,
    limit=1
)

if not streams['logStreams']:
    print("No log streams found")
    exit(1)

stream_name = streams['logStreams'][0]['logStreamName']
print(f"Fetching logs from {stream_name}...")

events = client.get_log_events(
    logGroupName=log_group,
    logStreamName=stream_name,
    limit=50
)

for event in events['events']:
    print(event['message'].strip())

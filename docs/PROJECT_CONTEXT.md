# Project Context

Report-to-Me AI is an AI-powered guardian/guide for people who encounter a real-world problem but do not necessarily know what to do.

## Current Implementation Stage
M1.2 Foundation and AWS SAM deployment established.

## Current Architecture
- AWS Amplify-hosted web application (Frontend)
- API Gateway (API)
- AWS Lambda (Compute)
- Amazon Bedrock (AI)
- Amazon DynamoDB (Database)
- Amazon S3 (Evidence/media)
- DynamoDB Streams (Event processing)
- Amazon EventBridge (Event routing)

## Implemented
- **M1.2 (SAM Foundation)**: AWS environment configured, SAM CLI configured, basic `/health` endpoint deployed and reachable.
- **M1.3A (Bedrock Proof of Concept)**: `BedrockAdapter` implemented; live Bedrock invocation currently blocked by AWS account authorization.
- **M1.3B (Complete End-to-End Pipeline)**: Signal ingestion, deterministic decision engine, and DynamoDB persistence implemented using single-table design. Deployment testing uses an explicitly configured `FakeAnalyzer` due to Bedrock limitations. No silent fallback is present.
- API Gateway HTTP API and Health Lambda (/api/v1/health)

## Not Implemented Yet
- Bedrock integration
- DynamoDB tables
- API Gateway / Lambda handlers
- Frontend
- Authentication (Cognito)

## Next Milestone
- AWS/backend vertical slice implementation.
- M1.2 completed: SAM template and health endpoint deployed.

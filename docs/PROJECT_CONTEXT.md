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
- Project foundation (repository structure, configuration, shared models/enums, logging skeleton, tests)
- AWS deployment foundation using SAM (Infrastructure as Code)
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

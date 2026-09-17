# Report-to-Me AI

AI-powered guidance that turns real-world observations into actionable help, from self-resolution to human-assisted response.

## Core Concept
Report-to-Me AI is an AI-powered guardian/guide for people who encounter a real-world problem but do not necessarily know what to do. The user simply describes or shows what is happening. The system understands the situation, assesses it, provides safe guidance, detects recurring issues, and routes them appropriately.

## Architecture Overview
- Frontend: AWS Amplify-hosted web application
- API: API Gateway
- Compute: AWS Lambda
- AI: Amazon Bedrock
- Database: Amazon DynamoDB
- Evidence/media: Amazon S3
- Event processing: DynamoDB Streams
- Event routing: Amazon EventBridge

## Current Status
M1.1 Project foundation implemented. (Backend structure, config, domain models). AWS services not yet integrated.

## Local Development Setup
1. Clone the repository
2. Set up virtual environment: `python -m venv .venv`
3. Activate virtual environment: `.venv\Scripts\Activate.ps1` (Windows) or `source .venv/bin/activate` (Mac/Linux)
4. Install dependencies: `pip install -e ".[dev]"`
5. Copy `.env.example` to `.env` and configure if needed.

## Testing
Run tests using pytest:
```bash
pytest
```

## Project Structure
- `backend/app/`: Core application code (domain, config, handlers, etc.)
- `backend/tests/`: Unit tests
- `docs/`: Project documentation
- `scripts/`: Utility scripts

## AI-Assisted Development Disclosure
AI coding assistants are being used during development to accelerate implementation.

# Manual OpenRouter Runtime Handoff

## Current architecture

```text
Browser
  ↓
Frontend (React)
  ↓
server-side API (API Gateway + Signal API Lambda)
  ↓
SQS (AiProcessingQueue)
  ↓
AI Worker (Lambda)
  ↓
OpenRouter Adapter
  ↓
SafetyGate
  ↓
MemoryService (OpenSearch Serverless)
  ↓
DecisionEngine
  ↓
ResponsePacket
  ↓
DynamoDB
  ↓
Frontend (polls GET /api/v1/incidents/{id})
```

## What already exists

The repository currently contains a fully decoupled server-side inference pipeline:
- **Provider Abstraction**: `backend/app/ai/openrouter_adapter.py` handles API requests to OpenRouter.
- **AI Worker**: `backend/app/services/ai_worker_service.py` consumes SQS messages, runs inference, runs the SafetyGate, and queries the MemoryService.
- **Decision Engine**: `backend/app/services/decision_engine.py` deterministically maps the AI's structured output into `self_solve`, `monitor`, or `human_review`.
- **Schemas**: Strict Pydantic models exist in `backend/app/domain/models.py` defining the required JSON structure (`AIAnalysis`).
- **Frontend Result Components**: `AnalysisResult.tsx`, `DecisionBadge`, and `IncidentDetail.tsx` are fully built to render the structured DynamoDB results and `ResponsePacket`.

## What remains

To finalize the working production/demo runtime, you must manually connect the OpenRouter provider to your live AWS Lambda environment. 

You need to manually:
1. Obtain a valid OpenRouter API key.
2. Inject the environment variable into the `AiWorkerFunction` Lambda via the AWS Console (or by modifying your local `.env` and running `sam deploy`).
3. Ensure the AI Worker Lambda has internet access (outbound network access to `openrouter.ai`) if you modify VPC settings.
4. Verify the `AiWorkerFunction` successfully pulls SQS messages and executes `openrouter_adapter.py` without timing out.

**Do NOT implement this connection in the client-side browser code.**

## Required environment variables

The `AiWorkerFunction` Lambda requires:
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL` (e.g., `"nex-agi/nex-n2.5-pro:free"`)
- `AI_PROVIDER` (must be set to `"openrouter"`)

*Never commit the values of these variables.*

## OpenRouter request

The `openrouter_adapter.py` dynamically constructs a prompt containing the user's raw observation text and (optionally) location data. It requests the LLM to output a strict JSON payload adhering to the predefined `AIAnalysis` schema. 

## Expected structured response

The AI must return a JSON object containing:
- `classification` (category, eventType, object)
- `understanding` (summary)
- `assessment` (severity, confidence, riskFactors, safetyConsiderations)
- `guidance` (recommendedAction, mode, urgency)

The application code uses `pydantic` to validate this response strictly.

## Security

**CRITICAL**: `OPENROUTER_API_KEY` must live EXCLUSIVELY server-side within the `AiWorkerFunction` Lambda environment variables. 
It must **never** be hardcoded into React source code, Vite environment variables (`VITE_...`), or GitHub. The architecture is intentionally designed so the browser communicates only with API Gateway, maintaining total secrecy of the external AI provider keys.

## Demo scenarios

The architecture currently supports the required demonstration scenarios:

### SCENARIO A — SELF-SOLVE
"The tap in Classroom 204 is leaking slightly."
- **Expected path**: AI outputs `severity: low`, `confidence: high`. The DecisionEngine maps this to `SELF-SOLVE`.

### SCENARIO B — MONITOR / DEVELOPING ISSUE
Repeated observations of an unfamiliar vehicle.
- **Expected path**: The MemoryService queries OpenSearch and returns related historical incidents. The deterministic logic identifies a trend and maps the workflow to `MONITOR / EMERGING INCIDENT`.

### SCENARIO C — HUMAN REVIEW
"There is a fight near the main gate."
- **Expected path**: AI outputs high risk/severity. The DecisionEngine securely overrides any AI recommendation and forces `HUMAN REVIEW`. The workflow is suspended, no autonomous emergency dispatch occurs, and the system waits for human authorization via Step Functions.

## Hosting considerations

The React frontend relies entirely on the server-side runtime to do the heavy lifting. To host the frontend (e.g., on Vercel or S3/CloudFront), it only needs the `VITE_API_BASE_URL` pointing to your deployed API Gateway. The frontend is completely stateless.

# HR Analytics Backend

## Setup

1. Copy `.env.example` to `.env`.
2. Set `MONGODB_URI` to your MongoDB instance.
3. Set `CLIENT_ORIGIN` to the frontend origin(s) that should be allowed to call the API. You can provide multiple comma-separated origins.
4. For local frontend development, copy `frontend/.env.example` to `frontend/.env` so Vite picks up `VITE_API_BASE_URL`.
5. Install dependencies:
   - `npm install`
6. Start server:
   - `npm run dev`

Server runs at `http://localhost:4000` by default.

## API

- `GET /api/health`
- `GET /api/analytics/bootstrap`
- `POST /api/analytics/dataset/upload` (multipart form-data, field: `file`)
- `DELETE /api/analytics/dataset`
- `POST /api/ai/chat` (authenticated)

## Required Dataset Columns

`Employee_ID, Department, JobRole, Age, MonthlyIncome, PerformanceRating, JobSatisfaction, Attrition`

Accepted file types: `.csv`, `.xlsx`

## Multi-Agent AI Framework

PerformIQ includes a local, optional multi-agent intelligence layer. It is an orchestration layer over the existing analytics data; it does not replace the dashboard or upload workflow. **No paid AI API is required.**

### Request flow

`AI Command Center → Orchestrator Agent → selected specialist agents → Data Analyst Agent → Executive Insight Agent → response`

The Orchestrator selects only the relevant HR, Sales, Finance, Marketing, and Operations agents for the question. The Data Analyst Agent uses deterministic JavaScript calculations for summaries, group comparisons, trend changes, anomaly flags, and HR/sales correlations. The Executive Insight Agent packages those verified findings, impacts, and recommendations.

Every AI request is protected by the existing bearer-token middleware. The analytics tools query only the authenticated user's active `ownerUserId` and `datasetId`, send compact calculated facts to the optional local model, and never permit model-controlled database, shell, filesystem, or code execution. Raw employee rows, credentials, and tokens are not sent to Ollama.

If no active dataset exists, the route returns an explicit insufficient-data response. If Ollama is missing, unavailable, times out, or has no configured model, PerformIQ and deterministic AI analysis remain available; the command center indicates that the local runtime is optional/offline.

### Free local Ollama setup

1. Install Ollama from [ollama.com](https://ollama.com/download).
2. Pull a lightweight model for ordinary laptops: `ollama pull llama3.2:3b`.
3. Optional stronger model for systems with more RAM: `ollama pull qwen2.5:7b`.
4. Start the local service if it is not already running: `ollama serve`.
5. Set the model name in `.env`, then start the backend normally.

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_TIMEOUT_MS=8000
```

The model may add a short, number-free interpretation of verified facts. Numeric claims and core findings always come from backend calculations. Use the AI Command Center with questions such as "Give me an executive summary of my organization", "Analyze sales performance", or "Compare sales and employee performance".

### Run locally

```bash
# backend
cd backend
npm install
npm run dev

# frontend (another terminal)
cd frontend
npm install
npm run dev
```

The frontend is served on `http://localhost:5173` and the backend on `http://localhost:4000` by default.

### Current limitations

- Cross-domain correlation is available only when departments can be matched between HR and sales sheets; it describes association, not causation.
- Trend analysis requires at least two dated periods, and correlation needs at least three comparable groups.
- Conversation history stays in the browser for this initial implementation.

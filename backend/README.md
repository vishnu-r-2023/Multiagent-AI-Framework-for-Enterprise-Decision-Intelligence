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

## Required Dataset Columns

`Employee_ID, Department, JobRole, Age, MonthlyIncome, PerformanceRating, JobSatisfaction, Attrition`

Accepted file types: `.csv`, `.xlsx`

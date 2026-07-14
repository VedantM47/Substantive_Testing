# Audit Automation Backend

Audit Automation backend: upload PDF agreements, store metadata, and run Phase 3 semantic clause search over Phase 2 parsed pages.

## Setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` so `DATABASE_URL` points at your PostgreSQL database and `GOOGLE_API_KEY` contains a Gemini API key.

## Database

```powershell
alembic upgrade head
```

## Run

```powershell
uvicorn app.main:app --reload
```

Swagger docs: http://127.0.0.1:8000/docs

## Endpoints

- `POST /documents/upload`
- `GET /documents`
- `GET /documents/{document_id}`
- `GET /documents/{document_id}/download`
- `POST /api/search/index`
- `POST /api/search`
- `GET /health`

## Phase 3 Semantic Search

Build the FAISS index once after Phase 2 parsing completes:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/search/index `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"pages":[{"page":87,"text":"Section 7.01 Financial Covenants ..."}]}'
```

Search the persisted index:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/search `
  -Method Post `
  -ContentType "application/json" `
  -Body '{"query":"Find Net Leverage Ratio"}'
```

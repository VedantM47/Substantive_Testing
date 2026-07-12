# Audit Automation Backend

Phase 1 MVP: upload PDF agreements, store them on disk, save metadata in PostgreSQL, list metadata, and download PDFs.

## Setup

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `.env` so `DATABASE_URL` points at your PostgreSQL database.

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
- `GET /health`

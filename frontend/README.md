# Audit Automation Frontend

Phase 1 UI for uploading, listing, viewing, and downloading PDF agreements.

## Run

```powershell
cd frontend
npm install
npm run dev
```

The frontend expects the FastAPI backend at:

```text
http://localhost:8000
```

Override with:

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

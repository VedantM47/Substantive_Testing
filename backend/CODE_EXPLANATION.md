# Backend Code Explanation

This backend is a Phase 1 document storage MVP. It only accepts PDF uploads, stores the PDF file on the local filesystem, saves document metadata in PostgreSQL, lists documents, returns one document's metadata, and streams the stored PDF back to the browser.

It does not include AI, OCR, authentication, search, embeddings, document analysis, audit workflows, cloud storage, queues, or Docker.

## Folder Map

```text
backend/
  app/
    main.py
    config.py
    database.py
    api/
      document.py
    models/
      document.py
    schemas/
      document.py
    services/
      document_service.py
  alembic/
    env.py
    script.py.mako
    versions/
      202607120001_create_documents.py
  uploads/
    .gitkeep
  .env
  .env.example
  .gitignore
  alembic.ini
  README.md
  requirements.txt
```

## Request Flow

For upload:

1. A client sends `POST /documents/upload` with multipart form field `file`.
2. `app/api/document.py` receives the request.
3. FastAPI injects a database session from `get_db()` and settings from `get_settings()`.
4. The route calls `create_document()` in `app/services/document_service.py`.
5. The service validates the file is a PDF and is not over 100 MB.
6. The service writes the PDF to `uploads/` using a UUID filename.
7. The service inserts the metadata row into PostgreSQL.
8. The route returns a clean API response with `id`, `filename`, `uploaded_at`, and `size`.

For download:

1. A client calls `GET /documents/{document_id}/download`.
2. The route loads the metadata row from PostgreSQL.
3. The route checks that the saved file still exists on disk.
4. FastAPI returns a `FileResponse` with `media_type="application/pdf"` and inline content disposition, so PDF.js can render it.

## app/main.py

This is the FastAPI application entry point.

Important code:

```python
settings = get_settings()
app = FastAPI(title="Audit Automation API", version="0.1.0")
```

The app is created once when Uvicorn imports `app.main:app`.

```python
app.add_middleware(CORSMiddleware, ...)
```

CORS middleware allows frontend applications to call this backend from browser JavaScript. The allowed origins come from environment configuration.

```python
app.include_router(document_router)
```

This attaches all document routes from `app/api/document.py` to the main app.

```python
def custom_openapi() -> dict:
    ...
    operation.get("responses", {}).pop("422", None)
```

FastAPI normally documents validation failures as `422`. The project requirement asked for `400`, `404`, and `500`, so this function removes automatic `422` responses from Swagger/OpenAPI documentation.

```python
@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
```

This is a simple endpoint to confirm the server is alive.

```python
@app.exception_handler(RequestValidationError)
```

This converts FastAPI validation errors, such as invalid UUID path values or missing required upload fields, into HTTP `400` responses instead of `422`.

```python
@app.exception_handler(Exception)
```

This catches unexpected errors and returns a generic HTTP `500` JSON response.

## app/config.py

This file centralizes environment-based settings.

```python
class Settings(BaseSettings):
```

`Settings` uses `pydantic-settings` to load values from environment variables and `.env`.

```python
database_url: str = Field(..., validation_alias="DATABASE_URL")
```

This is the PostgreSQL connection string used by SQLAlchemy and Alembic.

Example:

```text
postgresql+psycopg://postgres:password@localhost:5432/audit_mvp
```

If the password contains special URL characters like `@`, encode them. For example, `@` becomes `%40`.

```python
upload_dir: Path = Field(default=Path("uploads"), validation_alias="UPLOAD_DIR")
```

This controls where uploaded PDFs are stored locally.

```python
allowed_origins: list[str] = Field(default=["*"], validation_alias="ALLOWED_ORIGINS")
```

This controls which frontend origins can call the backend through CORS.

```python
@lru_cache
def get_settings() -> Settings:
```

The settings object is cached so the app does not re-read and re-parse `.env` on every request.

## app/database.py

This file owns the SQLAlchemy database setup.

```python
class Base(DeclarativeBase):
    pass
```

All ORM models inherit from `Base`. Alembic reads `Base.metadata` to understand the database tables.

```python
engine = create_engine(get_settings().database_url, pool_pre_ping=True)
```

The engine is SQLAlchemy's connection factory. `pool_pre_ping=True` checks stale pooled connections before using them.

```python
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
```

This creates database sessions. `autocommit=False` means code explicitly commits changes.

```python
def get_db() -> Generator[Session, None, None]:
```

This is a FastAPI dependency. Each request gets a database session, and the `finally` block closes it after the request finishes.

## app/models/document.py

This file defines the SQLAlchemy ORM model for the `documents` table.

```python
class Document(Base):
    __tablename__ = "documents"
```

Each `Document` object maps to one row in the `documents` table.

Fields:

- `id`: PostgreSQL UUID primary key. Generated with `uuid4`.
- `original_filename`: the filename uploaded by the user, cleaned down to the basename.
- `stored_filename`: the generated UUID filename used on disk.
- `file_path`: the local filesystem path where the PDF is stored.
- `file_size`: PDF size in bytes.
- `mime_type`: expected to be `application/pdf`.
- `uploaded_at`: timestamp set by PostgreSQL with `now()`.

The stored filename is unique so two uploaded files cannot accidentally point to the same stored file.

## app/schemas/document.py

This file defines Pydantic response schemas.

```python
class DocumentResponse(BaseModel):
```

This is the compact shape returned by upload and list endpoints:

```json
{
  "id": "...",
  "filename": "...",
  "uploaded_at": "...",
  "size": 123
}
```

```python
filename: str = Field(validation_alias="original_filename")
size: int = Field(validation_alias="file_size")
```

The database model uses `original_filename` and `file_size`, but the API response uses simpler names: `filename` and `size`.

```python
model_config = ConfigDict(from_attributes=True, populate_by_name=True)
```

This allows Pydantic to build responses directly from SQLAlchemy model objects.

```python
class DocumentMetadata(DocumentResponse):
```

This extends the compact response with internal metadata:

- `stored_filename`
- `file_path`
- `mime_type`

It is used by `GET /documents/{document_id}`.

## app/services/document_service.py

This file contains the business logic. The route layer stays thin and delegates real work here.

Constants:

```python
MAX_UPLOAD_SIZE = 100 * 1024 * 1024
PDF_MIME_TYPE = "application/pdf"
CHUNK_SIZE = 1024 * 1024
```

The upload limit is 100 MB. Files are read in 1 MB chunks so large PDFs are not loaded fully into memory.

```python
class InvalidDocumentError(ValueError):
class DocumentNotFoundError(LookupError):
```

These custom exceptions let the API layer translate service errors into proper HTTP responses.

```python
def _safe_filename(filename: str | None) -> str:
    return Path(filename or "document.pdf").name
```

This keeps only the basename of the uploaded filename. It prevents path values like `../../file.pdf` from being used as a trusted filename.

```python
def _validate_pdf(upload: UploadFile) -> None:
    if upload.content_type != PDF_MIME_TYPE:
```

This checks the multipart MIME type before writing the file.

```python
def create_document(db: Session, upload: UploadFile, upload_dir: Path) -> Document:
```

This is the upload workflow.

Logic:

1. Validate MIME type.
2. Ensure the upload directory exists.
3. Preserve the original filename for display.
4. Generate a UUID-based stored filename.
5. Stream the file to disk in chunks.
6. On the first chunk, check that the bytes start with `%PDF`.
7. Count bytes while streaming.
8. Reject the upload if it exceeds 100 MB.
9. Reject empty files.
10. Insert metadata into PostgreSQL.
11. Commit and refresh the SQLAlchemy object.

```python
except Exception:
    db.rollback()
    file_path.unlink(missing_ok=True)
    raise
```

If anything fails during write or database insert, the database transaction is rolled back and the partially written file is deleted.

```python
def list_documents(db: Session) -> list[Document]:
```

This returns all documents ordered newest first.

```python
def get_document(db: Session, document_id: UUID) -> Document:
```

This loads one document by primary key. If it does not exist, it raises `DocumentNotFoundError`.

## app/api/document.py

This file defines the HTTP API routes.

```python
router = APIRouter(prefix="/documents", tags=["documents"])
```

All routes in this file start with `/documents` and are grouped under `documents` in Swagger.

### POST /documents/upload

```python
@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
```

This accepts multipart form data.

```python
file: UploadFile = File(...)
db: Session = Depends(get_db)
settings: Settings = Depends(get_settings)
```

FastAPI injects the uploaded file, database session, and settings.

```python
return create_document(db, file, settings.upload_dir)
```

The route does not implement storage itself. It delegates to the service.

Error handling:

- `InvalidDocumentError` becomes HTTP `400`.
- SQLAlchemy database errors become HTTP `500`.

### GET /documents

```python
@router.get("", response_model=list[DocumentResponse])
```

This returns all uploaded PDFs using the compact response schema.

### GET /documents/{document_id}

```python
document_id: UUID
```

FastAPI validates the path parameter as a UUID. Invalid UUIDs now return `400` because of the validation handler in `main.py`.

If the UUID is valid but no row exists, the route returns `404`.

### GET /documents/{document_id}/download

This endpoint returns the actual PDF.

```python
path = Path(document.file_path)
if not path.is_file():
```

The database may have metadata for a file that was manually deleted from disk. This check catches that and returns `404`.

```python
return FileResponse(
    path,
    media_type=document.mime_type,
    filename=document.original_filename,
    content_disposition_type="inline",
)
```

`FileResponse` streams the file efficiently. `content_disposition_type="inline"` lets browser PDF viewers and PDF.js render it instead of forcing a download dialog.

## app/__init__.py

This file marks `app` as a Python package.

It does not contain logic.

## app/api/__init__.py

This file marks `app/api` as a Python package.

It does not contain logic.

## app/models/__init__.py

```python
from app.models.document import Document
__all__ = ["Document"]
```

This imports the `Document` model when `app.models` is imported. Alembic uses this so the model is registered in SQLAlchemy metadata before migrations inspect it.

## app/schemas/__init__.py

This file marks `app/schemas` as a Python package.

It does not contain logic.

## app/services/__init__.py

This file marks `app/services` as a Python package.

It does not contain logic.

## alembic/env.py

This file tells Alembic how to run migrations for this app.

```python
from app.config import get_settings
from app.database import Base
from app.models import Document
```

It imports settings, SQLAlchemy metadata, and the model.

```python
config.set_main_option("sqlalchemy.url", get_settings().database_url.replace("%", "%%"))
```

Alembic's config parser treats `%` specially. Database URLs can contain `%40` for encoded password characters. Replacing `%` with `%%` prevents configparser from breaking on encoded passwords.

```python
target_metadata = Base.metadata
```

This is the metadata Alembic uses for autogeneration and migration context.

```python
def run_migrations_offline() -> None:
```

Offline mode generates SQL without opening a database connection.

```python
def run_migrations_online() -> None:
```

Online mode connects to PostgreSQL and applies migrations. This is what `alembic upgrade head` uses.

## alembic/script.py.mako

This is Alembic's template for generating future migration files.

When running a command like:

```powershell
alembic revision -m "change something"
```

Alembic uses this template to create a new file under `alembic/versions/`.

## alembic/versions/202607120001_create_documents.py

This is the first migration.

```python
revision: str = "202607120001"
down_revision: str | None = None
```

This migration has no parent migration because it is the first one.

```python
def upgrade() -> None:
    op.create_table(...)
```

`upgrade()` creates the `documents` table with all required columns.

```python
def downgrade() -> None:
    op.drop_table("documents")
```

`downgrade()` reverses the migration by dropping the table.

## alembic.ini

This is Alembic's main configuration file.

Important lines:

```ini
script_location = alembic
prepend_sys_path = .
```

`script_location` tells Alembic where migrations live. `prepend_sys_path = .` lets Alembic import the local `app` package from the backend folder.

```ini
sqlalchemy.url = ...
```

This is a fallback URL. The real runtime URL is overridden in `alembic/env.py` using `DATABASE_URL` from `.env`.

The logger sections control Alembic console output.

## requirements.txt

This file lists Python dependencies.

- `fastapi`: web framework.
- `uvicorn[standard]`: ASGI server used to run FastAPI.
- `sqlalchemy`: ORM and database toolkit.
- `alembic`: database migration tool.
- `pydantic`: request and response validation models.
- `pydantic-settings`: environment variable and `.env` settings loader.
- `python-multipart`: required for `multipart/form-data` file uploads.
- `psycopg[binary]`: PostgreSQL driver used by SQLAlchemy.

## .env

This file contains local environment values.

It is intentionally ignored by git because it can contain passwords.

Expected keys:

```text
DATABASE_URL=...
UPLOAD_DIR=uploads
ALLOWED_ORIGINS=[...]
```

Do not commit real database passwords.

## .env.example

This is the safe template for `.env`.

It documents which environment variables the app needs without storing real secrets.

## .gitignore

This prevents local-only or generated files from being committed.

Current purpose:

- ignore `.env`
- ignore `.venv/`
- ignore Python cache files
- ignore uploaded PDFs
- keep `uploads/.gitkeep`

## uploads/.gitkeep

Git does not track empty folders. This file lets the `uploads/` folder exist in the repository while still ignoring actual uploaded PDFs.

## README.md

This is the short operator guide.

It explains:

- what the backend does
- how to create a virtual environment
- how to install dependencies
- how to configure `.env`
- how to run migrations
- how to start Uvicorn
- which endpoints exist

## API Behavior Summary

### Successful upload

Request:

```text
POST /documents/upload
multipart/form-data field: file
```

Response:

```json
{
  "id": "uuid",
  "filename": "agreement.pdf",
  "uploaded_at": "timestamp",
  "size": 123456
}
```

### Invalid PDF

Returns `400` when:

- MIME type is not `application/pdf`
- file bytes do not start with `%PDF`
- file is empty
- file is larger than 100 MB

### Missing document

Returns `404` when:

- a valid UUID is requested but no database row exists
- metadata exists but the physical PDF file is missing on disk

### Unexpected error

Returns `500` with:

```json
{
  "detail": "Unexpected error."
}
```

## Why The Code Is Split This Way

- `api/` knows HTTP: routes, status codes, request parsing, and response types.
- `services/` knows business logic: validation, file writing, database writes, cleanup.
- `models/` knows database tables.
- `schemas/` knows public API response shapes.
- `database.py` knows how to create and close database sessions.
- `config.py` knows how to load environment settings.
- `alembic/` knows how to create and update database schema.

This is enough separation for a production-style MVP without adding extra abstractions.

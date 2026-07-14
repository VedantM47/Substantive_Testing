from pathlib import Path
from uuid import UUID, uuid4

from fastapi import UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document import Document


MAX_UPLOAD_SIZE = 100 * 1024 * 1024
PDF_MIME_TYPE = "application/pdf"
CHUNK_SIZE = 1024 * 1024
BACKEND_ROOT = Path(__file__).resolve().parents[2]


class InvalidDocumentError(ValueError):
    pass


class DocumentNotFoundError(LookupError):
    pass


def _safe_filename(filename: str | None) -> str:
    return Path(filename or "document.pdf").name


def _validate_pdf(upload: UploadFile) -> None:
    if upload.content_type != PDF_MIME_TYPE:
        raise InvalidDocumentError("Only PDF files are allowed.")


def create_document(db: Session, upload: UploadFile, upload_dir: Path) -> Document:
    _validate_pdf(upload)
    upload_dir.mkdir(parents=True, exist_ok=True)

    original_filename = _safe_filename(upload.filename)
    stored_filename = f"{uuid4()}.pdf"
    file_path = upload_dir / stored_filename
    size = 0
    first_chunk = True

    try:
        with file_path.open("wb") as out_file:
            while chunk := upload.file.read(CHUNK_SIZE):
                if first_chunk and not chunk.startswith(b"%PDF"):
                    raise InvalidDocumentError("Invalid PDF file.")
                first_chunk = False
                size += len(chunk)
                if size > MAX_UPLOAD_SIZE:
                    raise InvalidDocumentError("PDF must be 100 MB or smaller.")
                out_file.write(chunk)

        if size == 0:
            raise InvalidDocumentError("Invalid PDF file.")

        document = Document(
            original_filename=original_filename,
            stored_filename=stored_filename,
            file_path=str(file_path),
            file_size=size,
            mime_type=PDF_MIME_TYPE,
        )
        db.add(document)
        db.commit()
        db.refresh(document)
        return document
    except Exception:
        db.rollback()
        file_path.unlink(missing_ok=True)
        raise


def list_documents(db: Session) -> list[Document]:
    return list(db.scalars(select(Document).order_by(Document.uploaded_at.desc())))


def get_document(db: Session, document_id: UUID) -> Document:
    document = db.get(Document, document_id)
    if document is None:
        raise DocumentNotFoundError("Document not found.")
    return document


def delete_document(db: Session, document_id: UUID) -> None:
    document = get_document(db, document_id)
    path = resolve_document_path(document)
    db.delete(document)
    db.commit()
    path.unlink(missing_ok=True)


def resolve_document_path(document: Document) -> Path:
    stored_path = Path(document.file_path)
    candidates = [stored_path]
    if not stored_path.is_absolute():
        candidates.extend(
            [
                BACKEND_ROOT / stored_path,
                BACKEND_ROOT / "uploads" / Path(document.stored_filename).name,
            ]
        )

    for path in candidates:
        if path.is_file():
            return path

    return stored_path

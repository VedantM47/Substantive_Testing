import logging
import time
from pathlib import Path
from uuid import UUID

import fitz
from pdf2image import convert_from_path
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.models.extracted_page import ExtractedPage
from app.services.document_service import get_document, resolve_document_path
from app.services.ocr_service import extract_text


logger = logging.getLogger(__name__)
FAILED_TEXT = "[PAGE EXTRACTION FAILED]"
NATIVE_TEXT_THRESHOLD = 20


def _method_for_text(text: str) -> str | None:
    return "native" if len(text.strip()) > NATIVE_TEXT_THRESHOLD else None


def _ocr_page(path: Path, page_number: int) -> str:
    images = convert_from_path(str(path), first_page=page_number, last_page=page_number)
    if not images:
        return ""
    image = images[0]
    try:
        return extract_text(image)
    finally:
        image.close()


def parse_document(db: Session, document_id: UUID) -> dict[str, object]:
    document = get_document(db, document_id)
    path = resolve_document_path(document)
    if not path.is_file():
        raise FileNotFoundError("Document file not found.")

    started = time.monotonic()
    pages_processed = 0
    pages_failed = 0
    logger.info("Started parsing document %s", document_id)

    db.execute(delete(ExtractedPage).where(ExtractedPage.document_id == document_id))

    with fitz.open(path) as pdf:
        for index, page in enumerate(pdf, start=1):
            method = "native"
            try:
                text = page.get_text()
                native_method = _method_for_text(text)
                if native_method:
                    logger.info("Page %s native extraction", index)
                else:
                    logger.info("Page %s OCR extraction", index)
                    method = "ocr"
                    text = _ocr_page(path, index)
                pages_processed += 1
            except Exception:
                logger.exception("Page %s extraction failed", index)
                text = FAILED_TEXT
                pages_failed += 1

            db.add(
                ExtractedPage(
                    document_id=document_id,
                    page_number=index,
                    text=text,
                    extraction_method=method,
                )
            )

    db.commit()
    elapsed = time.monotonic() - started
    logger.info("Finished parsing document %s in %.2fs", document_id, elapsed)
    return {
        "document_id": document_id,
        "status": "completed",
        "pages_processed": pages_processed,
        "pages_failed": pages_failed,
    }


def get_pages(db: Session, document_id: UUID) -> list[ExtractedPage]:
    get_document(db, document_id)
    return list(
        db.scalars(
            select(ExtractedPage)
            .where(ExtractedPage.document_id == document_id)
            .order_by(ExtractedPage.page_number)
        )
    )


if __name__ == "__main__":
    assert _method_for_text("short") is None
    assert _method_for_text("x" * (NATIVE_TEXT_THRESHOLD + 1)) == "native"

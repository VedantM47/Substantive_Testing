from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.parser import ParsedPage, ParseResponse
from app.services.document_service import DocumentNotFoundError
from app.services.pdf_parser import get_pages, parse_document


router = APIRouter(prefix="/documents", tags=["parser"])


@router.post("/{document_id}/parse", response_model=ParseResponse)
def parse_uploaded_document(document_id: UUID, db: Session = Depends(get_db)) -> dict[str, object]:
    try:
        return parse_document(db, document_id)
    except DocumentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except FileNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not store extracted pages.",
        ) from exc


@router.get("/{document_id}/pages", response_model=list[ParsedPage])
def get_document_pages(document_id: UUID, db: Session = Depends(get_db)) -> list[object]:
    try:
        return get_pages(db, document_id)
    except DocumentNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc

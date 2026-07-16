import logging
import re

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import Settings
from app.models.extracted_page import ExtractedPage
from app.models.search_models import ClauseResult, ParsedPage, RetrievedChunk
from app.services.llm_service import GeminiSearchService
from app.services.vector_store import ClauseVectorStore, EmptyVectorStoreError

logger = logging.getLogger(__name__)


def _section_from_text(text: str) -> str | None:
    match = re.search(r"\b(?:Section\s+)?(\d+(?:\.\d+)+)\b", text, flags=re.IGNORECASE)
    return match.group(1) if match else None


class SemanticSearchService:
    def __init__(self, settings: Settings):
        self.vector_store = ClauseVectorStore(settings)
        self.llm = GeminiSearchService(settings)

    def build_index(self, pages: list[ParsedPage]) -> int:
        return self.vector_store.build_index(pages)

    async def search(self, query: str, db: Session | None = None) -> ClauseResult | None:
        try:
            chunks = self.vector_store.search(query)
        except EmptyVectorStoreError:
            chunks = []
        if not chunks:
            return _exact_text_fallback(query, db)

        selected = await self.llm.choose_best_clause(query, chunks)
        if selected is None:
            return _exact_text_fallback(query, db)

        score = _score_for_selection(selected.page, chunks)
        return ClauseResult(
            page=selected.page,
            section=selected.section or _section_from_text(selected.matched_text),
            matched_text=selected.matched_text,
            confidence=selected.confidence,
            similarity_score=score,
            highlighted_sentence=selected.highlighted_sentence,
        )


def _score_for_selection(page: int, chunks: list[RetrievedChunk]) -> float | None:
    for chunk in chunks:
        if chunk.page == page:
            return chunk.similarity_score
    return chunks[0].similarity_score if chunks else None


def _search_phrase(query: str) -> str:
    phrase = query.strip().lower()
    phrase = re.sub(r"^(find|show|where\s+is|where\s+are)\s+", "", phrase)
    phrase = re.sub(r"\s+defined\??$", "", phrase)
    return phrase.strip(" ?.")


def _snippet(text: str, phrase: str) -> str:
    index = text.lower().find(phrase)
    if index < 0:
        return text[:900].strip()

    start = max(0, index - 450)
    end = min(len(text), index + len(phrase) + 450)
    return text[start:end].strip()


def _exact_text_fallback(query: str, db: Session | None) -> ClauseResult | None:
    if db is None:
        return None

    phrase = _search_phrase(query)
    if not phrase:
        return None

    page = db.scalars(
        select(ExtractedPage)
        .where(ExtractedPage.text.ilike(f"%{phrase}%"))
        .order_by(ExtractedPage.page_number)
        .limit(1)
    ).first()
    if page is None:
        return None

    matched_text = _snippet(page.text, phrase)
    return ClauseResult(
        page=page.page_number,
        section=_section_from_text(matched_text),
        matched_text=matched_text,
        confidence=0.7,
        highlighted_sentence=matched_text,
    )

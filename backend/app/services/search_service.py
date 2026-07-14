import logging
import re

from app.config import Settings
from app.models.search_models import ClauseResult, ParsedPage, RetrievedChunk
from app.services.llm_service import GeminiSearchService
from app.services.vector_store import ClauseVectorStore

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

    async def search(self, query: str) -> ClauseResult | None:
        chunks = self.vector_store.search(query)
        if not chunks:
            return None

        selected = await self.llm.choose_best_clause(query, chunks)
        if selected is None:
            return None

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

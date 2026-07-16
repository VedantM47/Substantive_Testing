import json
import logging
import re

from app.config import Settings
from app.models.search_models import GeminiClauseResult, RetrievedChunk
from app.services.embedding_service import MissingGoogleApiKeyError

logger = logging.getLogger(__name__)


class ClauseSelectionError(RuntimeError):
    pass


def _json_from_text(text: str) -> dict:
    cleaned = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
    if not cleaned.startswith("{"):
        match = re.search(r"\{.*\}", cleaned, flags=re.DOTALL)
        if match:
            cleaned = match.group(0)
    return json.loads(cleaned)


def _content_text(content: object) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        return "\n".join(
            str(item.get("text", item)) if isinstance(item, dict) else str(item)
            for item in content
        )
    return str(content)


class GeminiSearchService:
    def __init__(self, settings: Settings):
        if not settings.google_api_key:
            raise MissingGoogleApiKeyError("GOOGLE_API_KEY is required for semantic search.")

        from langchain_google_genai import ChatGoogleGenerativeAI

        self.llm = ChatGoogleGenerativeAI(
            model=settings.gemini_chat_model,
            google_api_key=settings.google_api_key,
            temperature=0,
        )

    async def choose_best_clause(
        self,
        question: str,
        chunks: list[RetrievedChunk],
    ) -> GeminiClauseResult | None:
        prompt = self._prompt(question, chunks)
        try:
            response = await self.llm.ainvoke(prompt)
        except Exception as exc:
            logger.exception("Gemini clause selection failed.")
            raise ClauseSelectionError("Could not select a matching clause.") from exc

        content = _content_text(response.content)

        try:
            result = GeminiClauseResult.model_validate(_json_from_text(content))
        except Exception as exc:
            logger.exception("Gemini returned invalid clause JSON.")
            raise ClauseSelectionError("Could not select a matching clause.") from exc

        if not result.matched_text.strip() or result.confidence <= 0:
            return None
        return result

    @staticmethod
    def _prompt(question: str, chunks: list[RetrievedChunk]) -> str:
        chunk_text = "\n\n".join(
            f"CHUNK {index}\npage: {chunk.page}\nscore: {chunk.similarity_score}\ntext:\n{chunk.text}"
            for index, chunk in enumerate(chunks, start=1)
        )
        return f"""You are a banking audit assistant.

Choose ONLY the chunk that best answers the user's request.
Do NOT invent information.
Return only information contained in the retrieved text.
Do NOT summarize the document.

User request:
{question}

Retrieved chunks:
{chunk_text}

Return JSON only:
{{
  "page": 87,
  "section": "7.01",
  "matched_text": "exact clause text from the retrieved chunk",
  "confidence": 0.95,
  "highlighted_sentence": "most relevant sentence copied from matched_text"
}}

If no chunk answers the request, return:
{{"page": 0, "section": null, "matched_text": "", "confidence": 0, "highlighted_sentence": null}}
"""

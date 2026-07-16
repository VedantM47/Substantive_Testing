import logging

from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

from app.config import Settings
from app.models.search_models import ParsedPage, RetrievedChunk
from app.services.chunking import chunk_pages
from app.services.embedding_service import get_embeddings

logger = logging.getLogger(__name__)


class EmptyVectorStoreError(LookupError):
    pass


class CorruptedVectorStoreError(RuntimeError):
    pass


class ClauseVectorStore:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.index_dir = settings.faiss_index_dir

    def build_index(self, pages: list[ParsedPage]) -> int:
        documents = chunk_pages(pages)
        if not documents:
            raise EmptyVectorStoreError("No parsed text was provided.")

        logger.info("Building FAISS clause index with %s chunks.", len(documents))
        store = FAISS.from_documents(documents, get_embeddings(self.settings))
        self.index_dir.mkdir(parents=True, exist_ok=True)
        store.save_local(str(self.index_dir))
        return len(documents)

    def load_index(self) -> FAISS:
        if not self.index_dir.exists():
            raise EmptyVectorStoreError("Semantic search index has not been built.")

        try:
            return FAISS.load_local(
                str(self.index_dir),
                get_embeddings(self.settings),
                allow_dangerous_deserialization=True,
            )
        except Exception as exc:
            logger.exception("Could not load FAISS index from %s.", self.index_dir)
            raise CorruptedVectorStoreError("Semantic search index is corrupted.") from exc

    def add_documents(self, documents: list[Document]) -> int:
        store = self.load_index()
        store.add_documents(documents)
        store.save_local(str(self.index_dir))
        return len(documents)

    def search(self, query: str, k: int | None = None) -> list[RetrievedChunk]:
        store = self.load_index()
        results = store.similarity_search_with_relevance_scores(
            query,
            k=k or self.settings.search_top_k,
        )
        return [
            RetrievedChunk(
                chunk_id=str(document.metadata["chunk_id"]),
                page=int(document.metadata["page"]),
                text=str(document.metadata.get("text") or document.page_content),
                similarity_score=float(score),
            )
            for document, score in results
        ]


def build_index(pages: list[ParsedPage], settings: Settings) -> int:
    return ClauseVectorStore(settings).build_index(pages)


def load_index(settings: Settings) -> FAISS:
    return ClauseVectorStore(settings).load_index()


def add_documents(documents: list[Document], settings: Settings) -> int:
    return ClauseVectorStore(settings).add_documents(documents)


def search(query: str, settings: Settings, k: int | None = None) -> list[RetrievedChunk]:
    return ClauseVectorStore(settings).search(query, k)

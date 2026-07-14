import logging

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import Settings, get_settings
from app.models.search_models import BuildIndexRequest, IndexResponse, SearchRequest, SearchResponse
from app.services.embedding_service import MissingGoogleApiKeyError
from app.services.llm_service import ClauseSelectionError
from app.services.search_service import SemanticSearchService
from app.services.vector_store import CorruptedVectorStoreError, EmptyVectorStoreError

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/search", tags=["semantic search"])


def get_search_service(settings: Settings = Depends(get_settings)) -> SemanticSearchService:
    return SemanticSearchService(settings)


@router.post("/index", response_model=IndexResponse)
def build_search_index(
    request: BuildIndexRequest,
    service: SemanticSearchService = Depends(get_search_service),
) -> IndexResponse:
    try:
        return IndexResponse(chunks_indexed=service.build_index(request.pages))
    except MissingGoogleApiKeyError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except EmptyVectorStoreError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.post("", response_model=SearchResponse)
async def search_clauses(
    request: SearchRequest,
    service: SemanticSearchService = Depends(get_search_service),
) -> SearchResponse:
    try:
        result = await service.search(request.query.strip())
    except MissingGoogleApiKeyError as exc:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(exc)) from exc
    except EmptyVectorStoreError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except CorruptedVectorStoreError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)) from exc
    except ClauseSelectionError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc

    if result is None:
        return SearchResponse(success=False, message="No matching clause found.")

    logger.info("Semantic search matched page %s for query %r.", result.page, request.query)
    return SearchResponse(result=result)

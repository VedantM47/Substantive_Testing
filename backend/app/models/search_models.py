from pydantic import BaseModel, ConfigDict, Field, field_validator


class ParsedPage(BaseModel):
    page: int = Field(ge=1)
    text: str = Field(min_length=1)


class BuildIndexRequest(BaseModel):
    pages: list[ParsedPage] = Field(min_length=1)


class IndexResponse(BaseModel):
    success: bool = True
    chunks_indexed: int


class SearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)

    @field_validator("query")
    @classmethod
    def query_must_have_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Query cannot be empty.")
        return value


class ClauseResult(BaseModel):
    page: int
    section: str | None = None
    matched_text: str
    confidence: float = Field(ge=0, le=1)
    similarity_score: float | None = None
    highlighted_sentence: str | None = None


class SearchResponse(BaseModel):
    success: bool = True
    result: ClauseResult | None = None
    message: str | None = None


class RetrievedChunk(BaseModel):
    chunk_id: str
    page: int
    text: str
    similarity_score: float


class GeminiClauseResult(BaseModel):
    page: int
    section: str | None = None
    matched_text: str
    confidence: float = Field(ge=0, le=1)
    highlighted_sentence: str | None = None

    model_config = ConfigDict(extra="ignore")

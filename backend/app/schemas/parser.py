from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ParsedPage(BaseModel):
    page: int = Field(validation_alias="page_number")
    method: str = Field(validation_alias="extraction_method")
    text: str

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class ParseResponse(BaseModel):
    document_id: UUID
    status: str
    pages_processed: int
    pages_failed: int

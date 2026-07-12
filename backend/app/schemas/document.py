from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class DocumentResponse(BaseModel):
    id: UUID
    filename: str = Field(validation_alias="original_filename")
    uploaded_at: datetime
    size: int = Field(validation_alias="file_size")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class DocumentMetadata(DocumentResponse):
    stored_filename: str
    file_path: str
    mime_type: str

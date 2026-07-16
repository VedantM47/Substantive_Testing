from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/audit_automation",
        validation_alias="DATABASE_URL",
    )
    upload_dir: Path = Field(default=Path("uploads"), validation_alias="UPLOAD_DIR")
    allowed_origins: list[str] = Field(default=["*"], validation_alias="ALLOWED_ORIGINS")
    tesseract_cmd: str | None = Field(default=None, validation_alias="TESSERACT_CMD")
    google_api_key: str | None = Field(default=None, validation_alias="GOOGLE_API_KEY")
    gemini_embedding_model: str = Field(
        default="models/gemini-embedding-001",
        validation_alias="GEMINI_EMBEDDING_MODEL",
    )
    gemini_chat_model: str = Field(default="gemini-3.1-flash-lite", validation_alias="GEMINI_CHAT_MODEL")
    faiss_index_dir: Path = Field(default=Path("faiss_index"), validation_alias="FAISS_INDEX_DIR")
    search_top_k: int = Field(default=5, validation_alias="SEARCH_TOP_K")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()

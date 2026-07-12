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

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


@lru_cache
def get_settings() -> Settings:
    return Settings()

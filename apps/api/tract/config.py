"""Application settings (pydantic-settings). Every variable from CONTRACTS §2 with dev defaults."""

from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Runtime configuration read from environment / apps/api/.env."""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    database_url: str = "postgresql+asyncpg://landstack:landstack@localhost:5432/landstack"
    auth_mode: Literal["dev", "firebase"] = "dev"
    firebase_project_id: str = ""
    google_application_credentials: str = ""
    cors_origins: str = "http://localhost:5173"
    dept_base_url: str = ""
    dept_timeout_s: float = 2.0
    events_shared_secret: str = "change-me"
    report_hmac_secret: str = "change-me"
    public_web_url: str = "http://localhost:5173"
    storage_backend: Literal["local", "gcs"] = "local"
    storage_local_dir: str = "./data/storage"
    gcs_bucket: str = ""
    s2_offline: bool = True
    s2_data_dir: str = "./data/s2"
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    # NVIDIA Build (build.nvidia.com) — OpenAI-compatible; powers parcel briefs,
    # application advice and document extraction. Empty key → deterministic rule engine.
    # NVIDIA retires models over time (410 Gone): pick a live one from GET /v1/models.
    nvidia_api_key: str = ""
    nvidia_base_url: str = "https://integrate.api.nvidia.com/v1"
    nvidia_model: str = "nvidia/nemotron-3-super-120b-a12b"
    nvidia_vision_model: str = "meta/llama-3.2-11b-vision-instruct"
    log_level: str = "INFO"
    cdm_cache_ttl_s: float = Field(default=60.0, description="in-process CDM cache TTL")

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def dev_auth(self) -> bool:
        return self.auth_mode == "dev"


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Cached settings instance (call `get_settings.cache_clear()` in tests)."""
    return Settings()

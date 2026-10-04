import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

BASE_DIR = Path(__file__).resolve().parent.parent.parent
ENV_PATH = BASE_DIR / ".env"

class Settings(BaseSettings):
    # Groq API
    GROQ_API_KEY: Optional[str] = ""
    GROQ_MODEL: str = "llama-3.3-70b-versatile"

    # Supabase Credentials
    SUPABASE_URL: Optional[str] = ""
    SUPABASE_ANON_KEY: Optional[str] = ""
    SUPABASE_SERVICE_ROLE_KEY: Optional[str] = ""
    DATABASE_URL: Optional[str] = ""

    # RAG Configuration
    EMBEDDING_MODEL: str = "BAAI/bge-small-en-v1.5"
    VECTOR_BACKEND: str = "supabase"  # "supabase" or "local"
    TOP_K: int = 5
    SIMILARITY_THRESHOLD: float = 0.70
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 120

    # Storage & Server
    STORAGE_BUCKET: str = "documents"
    STORAGE_LOCAL_DIR: str = str(BASE_DIR / "backend" / "data" / "storage")
    DATA_DIR: str = str(BASE_DIR / "backend" / "data")
    PORT: int = 8000
    HOST: str = "0.0.0.0"

    model_config = SettingsConfigDict(
        env_file=str(ENV_PATH) if ENV_PATH.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Ensure local directories exist
os.makedirs(settings.STORAGE_LOCAL_DIR, exist_ok=True)
os.makedirs(settings.DATA_DIR, exist_ok=True)

from fastapi import APIRouter
from app.config import settings
from app.database.supabase_client import db
from app.services.embedder import embedder
from app.services.vector_store import vector_store
from app.models.schemas import SystemHealthResponse, ServiceStatus

router = APIRouter(prefix="/api/health", tags=["System Health"])

@router.get("", response_model=SystemHealthResponse)
async def check_health():
    # Check Groq
    groq_has_key = bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip())
    groq_status = ServiceStatus(
        name="Groq API",
        status="connected" if groq_has_key else "fallback",
        details=f"Model: {settings.GROQ_MODEL}" if groq_has_key else "Operating with deterministic local grounded extractor"
    )

    # Check Supabase Database
    supabase_db_status = ServiceStatus(
        name="Supabase PostgreSQL + pgvector",
        status="connected" if db.is_supabase_connected else "fallback",
        details=f"Connected to {settings.SUPABASE_URL}" if db.is_supabase_connected else "Using high-performance persistent local store"
    )

    # Check Supabase Storage
    supabase_storage_status = ServiceStatus(
        name="Supabase Storage",
        status="connected" if (db.is_supabase_connected and settings.VECTOR_BACKEND == "supabase") else "fallback",
        details=f"Private bucket '{settings.STORAGE_BUCKET}'" if db.is_supabase_connected else f"Local encrypted storage ({settings.STORAGE_LOCAL_DIR})"
    )

    # Check Vector Store
    chunk_count = vector_store.faiss_store.index.ntotal
    vector_store_status = ServiceStatus(
        name="Vector Store Backend",
        status="connected",
        details=f"Active Backend: {settings.VECTOR_BACKEND.upper()} | Indexed Chunks: {chunk_count}"
    )

    # Check Embedding Model
    emb_status = ServiceStatus(
        name="Embedding Engine",
        status="connected" if embedder.is_ready else "error",
        details=f"Model: {embedder.model_name} (384 dimensions, normalized)"
    )

    return SystemHealthResponse(
        status="healthy",
        backend="FastAPI 0.110+",
        groq=groq_status,
        supabase_db=supabase_db_status,
        supabase_storage=supabase_storage_status,
        vector_store=vector_store_status,
        embedding_model=emb_status,
        active_settings={
            "GROQ_MODEL": settings.GROQ_MODEL,
            "EMBEDDING_MODEL": settings.EMBEDDING_MODEL,
            "VECTOR_BACKEND": settings.VECTOR_BACKEND,
            "TOP_K": settings.TOP_K,
            "SIMILARITY_THRESHOLD": settings.SIMILARITY_THRESHOLD,
            "CHUNK_SIZE": settings.CHUNK_SIZE,
            "CHUNK_OVERLAP": settings.CHUNK_OVERLAP,
            "STORAGE_BUCKET": settings.STORAGE_BUCKET
        }
    )

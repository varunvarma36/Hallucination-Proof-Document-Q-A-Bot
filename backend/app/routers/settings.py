from fastapi import APIRouter
from app.config import settings
from app.models.schemas import SettingsUpdateRequest

router = APIRouter(prefix="/api/settings", tags=["Settings"])

@router.get("")
async def get_settings():
    return {
        "GROQ_MODEL": settings.GROQ_MODEL,
        "EMBEDDING_MODEL": settings.EMBEDDING_MODEL,
        "VECTOR_BACKEND": settings.VECTOR_BACKEND,
        "TOP_K": settings.TOP_K,
        "SIMILARITY_THRESHOLD": settings.SIMILARITY_THRESHOLD,
        "CHUNK_SIZE": settings.CHUNK_SIZE,
        "CHUNK_OVERLAP": settings.CHUNK_OVERLAP,
        "STORAGE_BUCKET": settings.STORAGE_BUCKET,
        "GROQ_API_KEY_CONFIGURED": bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY.strip()),
        "SUPABASE_CONFIGURED": bool(settings.SUPABASE_URL and settings.SUPABASE_SERVICE_ROLE_KEY)
    }

@router.post("")
async def update_settings(payload: SettingsUpdateRequest):
    if payload.GROQ_MODEL is not None:
        settings.GROQ_MODEL = payload.GROQ_MODEL
    if payload.TOP_K is not None:
        settings.TOP_K = payload.TOP_K
    if payload.SIMILARITY_THRESHOLD is not None:
        settings.SIMILARITY_THRESHOLD = payload.SIMILARITY_THRESHOLD
    if payload.CHUNK_SIZE is not None:
        settings.CHUNK_SIZE = payload.CHUNK_SIZE
    if payload.CHUNK_OVERLAP is not None:
        settings.CHUNK_OVERLAP = payload.CHUNK_OVERLAP
    if payload.VECTOR_BACKEND is not None:
        settings.VECTOR_BACKEND = payload.VECTOR_BACKEND

    return {
        "message": "Settings updated successfully",
        "current_settings": {
            "GROQ_MODEL": settings.GROQ_MODEL,
            "VECTOR_BACKEND": settings.VECTOR_BACKEND,
            "TOP_K": settings.TOP_K,
            "SIMILARITY_THRESHOLD": settings.SIMILARITY_THRESHOLD,
            "CHUNK_SIZE": settings.CHUNK_SIZE,
            "CHUNK_OVERLAP": settings.CHUNK_OVERLAP
        }
    }

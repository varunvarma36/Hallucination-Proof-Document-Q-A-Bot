from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import documents, collections, chat, evaluation, health, settings as settings_router
from app.services.financebench import financebench_service

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Bootstrap FinanceBench SEC sample documents if none exist
    print("[VERIDOC AI Backend] Starting up...")
    try:
        col_id = financebench_service.ensure_sample_documents_ingested()
        print(f"[VERIDOC AI Backend] FinanceBench SEC documents bootstrapped (Collection: {col_id})")
    except Exception as e:
        print(f"[VERIDOC AI Backend] Bootstrap note: {e}")
    yield
    print("[VERIDOC AI Backend] Shutting down...")

app = FastAPI(
    title="VERIDOC AI - Hallucination-Proof Document Intelligence",
    description="Enterprise RAG application for SEC / FinanceBench Q&A with strict verification and zero hallucinations.",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for hackathon & local development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(documents.router)
app.include_router(collections.router)
app.include_router(chat.router)
app.include_router(evaluation.router)
app.include_router(health.router)
app.include_router(settings_router.router)

@app.get("/")
async def root():
    return {
        "service": "VERIDOC AI Backend",
        "tagline": "Hallucination-Proof Document Intelligence",
        "docs_url": "/docs",
        "health_url": "/api/health"
    }

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

# ==========================================
# Collections
# ==========================================
class CollectionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None

class CollectionResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    document_count: int = 0
    chunk_count: int = 0
    created_at: Optional[str] = None

# ==========================================
# Documents & Pages & Chunks
# ==========================================
class DocumentListItem(BaseModel):
    id: str
    collection_id: Optional[str] = None
    collection_name: Optional[str] = None
    title: str
    filename: str
    file_type: str
    file_size: int
    storage_path: str
    page_count: int
    chunk_count: int
    status: str
    created_at: Optional[str] = None

class PageResponse(BaseModel):
    id: str
    page_number: int
    char_count: int
    preview_text: str

class ChunkResponse(BaseModel):
    id: str
    chunk_index: int
    page_number: int
    content: str
    token_count: Optional[int] = None
    similarity: Optional[float] = None
    metadata: Dict[str, Any] = {}

class DocumentDetail(BaseModel):
    document: DocumentListItem
    pages: List[PageResponse] = []
    chunks: List[ChunkResponse] = []

class DocumentUploadResponse(BaseModel):
    id: str
    title: str
    filename: str
    page_count: int
    chunk_count: int
    status: str
    message: str

# ==========================================
# Chat & Citations
# ==========================================
class CitationItem(BaseModel):
    document: str
    page: int
    chunk: str
    exact_quote: Optional[str] = None
    similarity_score: Optional[float] = None

class RetrievedChunkTrace(BaseModel):
    chunk_id: str
    document_title: str
    page_number: int
    chunk_index: int
    similarity: float
    content: str

class VerificationTrace(BaseModel):
    retrieved_chunks_count: int
    retrieved_chunks: List[RetrievedChunkTrace] = []
    citations_verified: bool
    factual_overlap_score: float
    grounding_verdict: str  # "VERIFIED_GROUNDED" | "ABSTAINED_UNSUPPORTED" | "INVALID_CITATIONS"
    unsupported_reason: Optional[str] = None
    latency_ms: int
    groq_model_used: str

class ChatQueryRequest(BaseModel):
    question: str = Field(..., min_length=1)
    collection_id: Optional[str] = None
    top_k: Optional[int] = None
    similarity_threshold: Optional[float] = None
    session_id: Optional[str] = None

class ChatQueryResponse(BaseModel):
    supported: bool
    answer: str
    confidence: float
    citations: List[CitationItem] = []
    verification_status: str  # "verified_grounded" | "abstained_unsupported"
    trace: VerificationTrace
    session_id: Optional[str] = None

class ChatSessionResponse(BaseModel):
    id: str
    title: str
    collection_id: Optional[str] = None
    message_count: int = 0
    created_at: Optional[str] = None

class MessageResponse(BaseModel):
    id: str
    role: str
    content: str
    supported: bool = True
    confidence: float = 0.0
    citations: List[CitationItem] = []
    verification_status: Optional[str] = None
    trace: Optional[VerificationTrace] = None
    created_at: Optional[str] = None

# ==========================================
# FinanceBench Evaluation
# ==========================================
class FinanceBenchQuestionItem(BaseModel):
    id: str
    company: str
    filing_type: str
    year: str
    question: str
    ground_truth_answer: str
    ground_truth_page: Optional[int] = None
    question_type: str  # "numerical", "comparative", "descriptive", "out_of_domain"
    is_out_of_domain: bool = False

class EvaluationRunRequest(BaseModel):
    collection_id: Optional[str] = None
    sample_ids: Optional[List[str]] = None
    top_k: Optional[int] = None
    similarity_threshold: Optional[float] = None

class EvaluationResultItem(BaseModel):
    question_id: str
    company: str
    question: str
    ground_truth_answer: str
    predicted_answer: str
    ground_truth_page: Optional[int] = None
    predicted_pages: List[int] = []
    is_out_of_domain: bool
    predicted_supported: bool
    answer_correct: bool
    citation_correct: bool
    retrieval_correct: bool
    faithfulness_score: float
    abstention_correct: bool
    latency_ms: int
    notes: Optional[str] = None

class EvaluationSummary(BaseModel):
    run_id: str
    total_questions: int
    answer_accuracy: float
    citation_accuracy: float
    retrieval_accuracy: float
    faithfulness: float
    abstention_accuracy: float
    avg_latency_ms: float
    results: List[EvaluationResultItem] = []

# ==========================================
# Settings & Health
# ==========================================
class SettingsUpdateRequest(BaseModel):
    GROQ_MODEL: Optional[str] = None
    TOP_K: Optional[int] = None
    SIMILARITY_THRESHOLD: Optional[float] = None
    CHUNK_SIZE: Optional[int] = None
    CHUNK_OVERLAP: Optional[int] = None
    VECTOR_BACKEND: Optional[str] = None

class ServiceStatus(BaseModel):
    name: str
    status: str  # "connected" | "fallback" | "unconfigured" | "error"
    details: Optional[str] = None

class SystemHealthResponse(BaseModel):
    status: str  # "healthy" | "degraded"
    backend: str = "FastAPI 0.110+"
    groq: ServiceStatus
    supabase_db: ServiceStatus
    supabase_storage: ServiceStatus
    vector_store: ServiceStatus
    embedding_model: ServiceStatus
    active_settings: Dict[str, Any]

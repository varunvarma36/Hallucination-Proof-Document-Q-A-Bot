export interface Collection {
  id: string;
  name: string;
  description?: string;
  document_count: number;
  chunk_count: number;
  created_at?: string;
}

export interface DocumentItem {
  id: string;
  collection_id?: string;
  collection_name?: string;
  title: string;
  filename: string;
  file_type: string;
  file_size: number;
  storage_path: string;
  page_count: number;
  chunk_count: number;
  status: string;
  created_at?: string;
}

export interface PageItem {
  id: string;
  page_number: number;
  char_count: number;
  preview_text: string;
}

export interface ChunkItem {
  id: string;
  chunk_index: number;
  page_number: number;
  content: string;
  token_count?: number;
  metadata?: Record<string, any>;
}

export interface DocumentDetail {
  document: DocumentItem;
  pages: PageItem[];
  chunks: ChunkItem[];
}

export interface Citation {
  document: string;
  page: number;
  chunk: string;
  exact_quote?: string;
  similarity_score?: number;
}

export interface RetrievedChunkTrace {
  chunk_id: string;
  document_title: string;
  page_number: number;
  chunk_index: number;
  similarity: number;
  content: string;
}

export interface VerificationTrace {
  retrieved_chunks_count: number;
  retrieved_chunks: RetrievedChunkTrace[];
  citations_verified: boolean;
  factual_overlap_score: number;
  grounding_verdict: string;
  unsupported_reason?: string;
  latency_ms: number;
  groq_model_used: string;
}

export interface ChatQueryResponse {
  supported: boolean;
  answer: string;
  confidence: number;
  citations: Citation[];
  verification_status: 'verified_grounded' | 'abstained_unsupported';
  trace: VerificationTrace;
  session_id?: string;
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  supported?: boolean;
  confidence?: number;
  citations?: Citation[];
  verification_status?: string;
  trace?: VerificationTrace;
  created_at?: string;
}

export interface FinanceBenchQuestion {
  id: string;
  company: string;
  filing_type: string;
  year: string;
  question: string;
  ground_truth_answer: string;
  ground_truth_page?: number;
  question_type: string;
  is_out_of_domain: boolean;
}

export interface EvaluationResultItem {
  question_id: string;
  company: string;
  question: string;
  ground_truth_answer: string;
  predicted_answer: string;
  ground_truth_page?: number;
  predicted_pages: number[];
  is_out_of_domain: boolean;
  predicted_supported: boolean;
  answer_correct: boolean;
  citation_correct: boolean;
  retrieval_correct: boolean;
  faithfulness_score: number;
  abstention_correct: boolean;
  latency_ms: number;
  notes?: string;
}

export interface EvaluationSummary {
  run_id: string;
  total_questions: number;
  answer_accuracy: number;
  citation_accuracy: number;
  retrieval_accuracy: number;
  faithfulness: number;
  abstention_accuracy: number;
  avg_latency_ms: number;
  results: EvaluationResultItem[];
}

export interface ServiceStatus {
  name: string;
  status: 'connected' | 'fallback' | 'unconfigured' | 'error';
  details?: string;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded';
  backend: string;
  groq: ServiceStatus;
  supabase_db: ServiceStatus;
  supabase_storage: ServiceStatus;
  vector_store: ServiceStatus;
  embedding_model: ServiceStatus;
  active_settings: Record<string, any>;
}

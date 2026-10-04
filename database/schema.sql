-- ====================================================================
-- VERIDOC AI: Database Schema for Hallucination-Proof Document Q&A
-- Supports Supabase PostgreSQL + pgvector
-- Embeddings: 384 dimensions (BAAI/bge-small-en-v1.5)
-- ====================================================================

-- 1. Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Collections Table (Logical grouping of SEC / FinanceBench documents)
CREATE TABLE IF NOT EXISTS collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Documents Table (PDF/DOCX/TXT file metadata and Supabase Storage pointers)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    storage_path TEXT NOT NULL,
    storage_bucket TEXT NOT NULL DEFAULT 'documents',
    page_count INT DEFAULT 0,
    chunk_count INT DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'indexed' CHECK (status IN ('pending', 'processing', 'indexed', 'failed')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Pages Table (Preserves page boundaries and raw extracted text)
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_number INT NOT NULL,
    page_text TEXT NOT NULL,
    char_count INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT unique_document_page UNIQUE (document_id, page_number)
);

-- 5. Chunks Table (Sections / chunks with 384-d vector embeddings)
CREATE TABLE IF NOT EXISTS chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
    collection_id UUID REFERENCES collections(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    page_number INT NOT NULL,
    content TEXT NOT NULL,
    embedding vector(384),
    token_count INT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Chat Sessions Table
CREATE TABLE IF NOT EXISTS chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT 'New Financial Query Session',
    collection_id UUID REFERENCES collections(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    supported BOOLEAN DEFAULT true,
    confidence FLOAT DEFAULT 0.0,
    raw_response JSONB DEFAULT '{}'::jsonb,
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('verified_grounded', 'abstained_unsupported', 'unverified', 'failed')),
    verification_details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 8. Citations Table (Ground-truth evidence citations linked to messages & chunks)
CREATE TABLE IF NOT EXISTS citations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    document_title TEXT NOT NULL,
    page_number INT NOT NULL,
    chunk_id UUID REFERENCES chunks(id) ON DELETE SET NULL,
    chunk_index INT,
    exact_quote TEXT,
    similarity_score FLOAT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. Evaluation Results Table (FinanceBench benchmark metrics & test logs)
CREATE TABLE IF NOT EXISTS evaluation_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL,
    question_id TEXT,
    question TEXT NOT NULL,
    ground_truth_answer TEXT,
    ground_truth_page INT,
    predicted_answer TEXT NOT NULL,
    predicted_supported BOOLEAN NOT NULL,
    predicted_pages INT[],
    is_out_of_domain BOOLEAN DEFAULT false,
    answer_correct BOOLEAN,
    citation_correct BOOLEAN,
    retrieval_correct BOOLEAN,
    faithfulness_score FLOAT,
    abstention_correct BOOLEAN,
    latency_ms INT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================================================================
-- INDEXES FOR HIGH-PERFORMANCE RETRIEVAL
-- ====================================================================

-- Vector similarity index using HNSW with cosine distance
CREATE INDEX IF NOT EXISTS chunks_embedding_hnsw_idx 
ON chunks USING hnsw (embedding vector_cosine_ops);

-- Relational indexes
CREATE INDEX IF NOT EXISTS idx_chunks_collection_id ON chunks(collection_id);
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_page_number ON chunks(page_number);
CREATE INDEX IF NOT EXISTS idx_pages_document_id ON pages(document_id);
CREATE INDEX IF NOT EXISTS idx_documents_collection_id ON documents(collection_id);
CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_citations_message_id ON citations(message_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_results_run_id ON evaluation_results(run_id);

-- ====================================================================
-- VECTOR MATCH RPC FUNCTION
-- Matches chunks against a query embedding within a collection
-- ====================================================================
CREATE OR REPLACE FUNCTION match_chunks (
    query_embedding vector(384),
    match_threshold float DEFAULT 0.70,
    match_count int DEFAULT 5,
    filter_collection_id uuid DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    document_id uuid,
    document_title text,
    page_number int,
    chunk_index int,
    content text,
    metadata jsonb,
    similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.document_id,
        d.title AS document_title,
        c.page_number,
        c.chunk_index,
        c.content,
        c.metadata,
        (1 - (c.embedding <=> query_embedding))::float AS similarity
    FROM chunks c
    JOIN documents d ON c.document_id = d.id
    WHERE (filter_collection_id IS NULL OR c.collection_id = filter_collection_id)
      AND (1 - (c.embedding <=> query_embedding)) >= match_threshold
    ORDER BY c.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;

-- ====================================================================
-- SUPABASE STORAGE BUCKET CONFIGURATION (Run in Supabase SQL Editor)
-- Creates the private 'documents' bucket for original uploaded files
-- ====================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Allow service role and authenticated app to manage files
CREATE POLICY "Allow private documents access" 
ON storage.objects 
FOR ALL 
TO service_role 
USING (bucket_id = 'documents');

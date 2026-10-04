# VERIDOC AI: Hallucination-Proof Document Intelligence

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-F55036?style=flat)](https://groq.com)
[![Supabase](https://img.shields.io/badge/Supabase-pgvector_&_Storage-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com)
[![HuggingFace](https://img.shields.io/badge/Embeddings-BAAI%2Fbge--small--en--v1.5-FFD21E?style=flat&logo=huggingface&logoColor=black)](https://huggingface.co/BAAI/bge-small-en-v1.5)

**VERIDOC AI** is an enterprise-grade, hallucination-proof document Q&A application designed for the **ValuePitch AI Hackathon**, benchmarked against the [PatronusAI FinanceBench](https://huggingface.co/datasets/PatronusAI/financebench) dataset of SEC 10-K filings.

It pairs **Groq Llama-3.3-70B** ultra-low-latency inference with **BAAI/bge-small-en-v1.5** 384-dimensional embeddings, **Supabase PostgreSQL + pgvector** vector storage, private Supabase Storage, and a **Layer-2 Factual Grounding Verifier** that rejects ungrounded claims and enforces strict abstention (*"I don't know based on the provided documents."*).

---

## 🚀 Key Capabilities & Highlights

- **Zero-Tolerance Hallucination Guardrail**: A second-layer algorithmic verification check inspects every generated claim, ensures every critical financial number exists in the retrieved chunks, verifies citation existence, and forces abstention if ungrounded.
- **Strict Context Isolation**: Only retrieved chunks are provided to the LLM. The entire document/database is **never** sent to the LLM.
- **"How Did We Answer This?" Audit Trail**: Full forensic transparency for every response, showing retrieved chunks, cosine similarity rankings, citation validity checks, and round-trip latencies.
- **Persistent Multi-Level Document Architecture**:
  $$\text{Collections} \longrightarrow \text{Documents} \longrightarrow \text{Pages} \longrightarrow \text{Sections/Chunks} \longrightarrow \text{Metadata} \longrightarrow \text{Embeddings}$$
  Also persistently stores chat sessions, messages, citations, and evaluation logs.
- **Private Storage**: Original PDFs, DOCX, and TXT files reside in an encrypted, private Supabase Storage bucket (`documents`).
- **Resilient Hybrid Vector Backend**: Production **Supabase pgvector** (with HNSW index and `match_chunks` RPC function) with an automatic zero-config **FAISS** local fallback.
- **FinanceBench Evaluation Dashboard**: Built-in benchmark suite measuring:
  - **Answer Accuracy** (numerical & entity verification)
  - **Citation Accuracy** (exact SEC page match)
  - **Retrieval Accuracy** (ground-truth chunk in Top-K)
  - **Faithfulness** (factual overlap score)
  - **Abstention Accuracy** (adversarial out-of-domain rejection)
  - **Latency** (ms)
- **Zero Frontend Secrets**: Secrets (`GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) are kept isolated on the FastAPI backend.

---

## 🛠️ Tech Stack

| Layer | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript + Vite + Tailwind CSS | Polished dark-mode enterprise SaaS interface with Lucide icons |
| **Backend** | Python 3.11 + FastAPI + Uvicorn | Asynchronous REST API with CORS and Pydantic validation |
| **LLM Inference** | Groq API (`llama-3.3-70b-versatile`) | High-speed structured JSON completion with strict system prompt |
| **Embeddings** | `BAAI/bge-small-en-v1.5` (FastEmbed) | 384-dimensional normalized local ONNX embeddings (no GPU required) |
| **Database & Vector DB** | Supabase PostgreSQL + `pgvector` | Persistent document hierarchy and HNSW vector similarity search |
| **File Storage** | Supabase Storage (Private `documents` bucket) | Encrypted file storage with signed preview streaming |
| **Local Fallback** | FAISS + Local Disk Store | Seamless offline execution when Supabase keys are not yet configured |

---

## 📁 Repository Structure

```text
├── database/
│   └── schema.sql                  # PostgreSQL + pgvector schema, tables, HNSW indexes & RPC functions
├── docs/
│   ├── SUPABASE_SETUP.md           # Step-by-step Supabase, pgvector & Storage guide
│   ├── GROQ_SETUP.md               # Groq API key creation & models guide
│   └── CREDENTIALS_SETUP.md        # Environment variables & secrets isolation
├── backend/
│   ├── app/
│   │   ├── config.py               # Pydantic settings loading .env
│   │   ├── main.py                 # FastAPI application & startup bootstrap
│   │   ├── database/
│   │   │   └── supabase_client.py  # Supabase client + local persistent fallback
│   │   ├── models/
│   │   │   └── schemas.py          # Pydantic request/response schemas
│   │   ├── services/
│   │   │   ├── parser.py           # Page-preserving PDF/DOCX/TXT extractor
│   │   │   ├── chunker.py          # Smart recursive chunker with overlap
│   │   │   ├── embedder.py         # BAAI/bge-small-en-v1.5 embedding engine
│   │   │   ├── storage.py          # Private file storage service
│   │   │   ├── vector_store.py     # pgvector RPC & FAISS vector store manager
│   │   │   ├── groq_client.py      # Groq structured JSON client & prompt engine
│   │   │   ├── verifier.py         # Layer-2 Hallucination & Citation Verifier
│   │   │   ├── rag_engine.py       # End-to-end RAG orchestrator
│   │   │   └── financebench.py     # FinanceBench benchmark service & test runner
│   │   └── routers/
│   │       ├── documents.py        # Upload, list, detail, and streaming
│   │       ├── collections.py      # Collection isolation CRUD
│   │       ├── chat.py             # Q&A endpoint with trace telemetry
│   │       ├── evaluation.py       # FinanceBench evaluation endpoints
│   │       ├── health.py           # Service connectivity health checks
│   │       └── settings.py         # Runtime hyperparameter tuning
│   ├── sample_data/                # Curated FinanceBench SEC 10-K samples & QA pairs
│   ├── tests/                      # 8 pytest test suites (ingestion, chunking, retrieval, etc.)
│   ├── requirements.txt            # Python dependencies
│   └── run_backend.py              # Backend launcher
├── frontend/
│   ├── src/
│   │   ├── components/             # Navbar, Sidebar, AnswerTraceModal, UploadModal, etc.
│   │   ├── pages/                  # 8 Core UI pages (Dashboard, Chat, Evaluation, etc.)
│   │   ├── services/api.ts         # Backend API connector
│   │   └── types.ts                # TypeScript interface definitions
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── ARCHITECTURE.md                 # Detailed RAG architecture & verification specification
├── SECURITY.md                     # Security & secrets isolation policy
├── DEMO.md                         # Hackathon demonstration walkthrough
├── .env.example                    # Sample environment template
└── pytest.ini                      # Pytest configuration
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Python 3.11+** installed
- **Node.js 18+** and `npm` installed
- *(Optional)* Free [Groq Cloud](https://console.groq.com) account
- *(Optional)* Free [Supabase](https://supabase.com) account

---

### Step 1: Environment Configuration

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

Open `.env` and enter your keys (see [docs/CREDENTIALS_SETUP.md](docs/CREDENTIALS_SETUP.md)):
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile

# (Optional) Supabase Credentials
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://...

# RAG Hyperparameters
EMBEDDING_MODEL=BAAI/bge-small-en-v1.5
VECTOR_BACKEND=supabase
TOP_K=5
SIMILARITY_THRESHOLD=0.70
CHUNK_SIZE=800
CHUNK_OVERLAP=120
```

> **Note on Local Offline Mode:** If you do not have Supabase credentials yet, leave `VECTOR_BACKEND=local`. VERIDOC AI will automatically use its internal FAISS vector store and local disk storage!

---

### Step 2: Run the Backend (FastAPI)

```bash
# Activate virtual environment
backend\venv\Scripts\activate

# Install dependencies (if not already installed)
pip install -r backend/requirements.txt

# Start FastAPI backend
python backend/run_backend.py
```
Backend will start at: `http://localhost:8000` (API Docs: `http://localhost:8000/docs`).

---

### Step 3: Run the Frontend (React + Vite)

In a new terminal:
```bash
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Vite development server
npm run dev
```
Open your browser at: `http://localhost:5173`

---

## 🧪 Running Automated Tests

VERIDOC AI includes a comprehensive test suite covering all 8 critical dimensions:
- Ingestion (`test_ingestion.py`)
- Chunking (`test_chunking.py`)
- Retrieval (`test_retrieval.py`)
- Citations (`test_citations.py`)
- Hallucination Prevention (`test_hallucination_prevention.py`)
- "I don't know" Abstention (`test_abstention.py`)
- FastAPI Endpoints (`test_api.py`)
- Database CRUD (`test_database.py`)

Run pytest:
```bash
backend\venv\Scripts\python.exe -m pytest
```
Output:
```text
backend\tests\test_abstention.py ..             [ 10%]
backend\tests\test_api.py .....                 [ 35%]
backend\tests\test_chunking.py ..               [ 45%]
backend\tests\test_citations.py ..              [ 55%]
backend\tests\test_database.py ...              [ 70%]
backend\tests\test_hallucination_prevention.py .. [ 80%]
backend\tests\test_ingestion.py ..              [ 90%]
backend\tests\test_retrieval.py ..              [100%]
======================== 20 passed in 2.88s ========================
```

---

## 📚 Detailed Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md) - Deep dive into RAG flow, Layer-2 verification, and data models.
- [SECURITY.md](SECURITY.md) - Secrets isolation, prompt injection defense, and private storage.
- [DEMO.md](DEMO.md) - Step-by-step hackathon demo presentation guide.
- [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) - Setting up Supabase, pgvector, and storage.
- [docs/GROQ_SETUP.md](docs/GROQ_SETUP.md) - Groq API key setup and model options.
- [docs/CREDENTIALS_SETUP.md](docs/CREDENTIALS_SETUP.md) - Complete credentials reference.

---

## 🏆 ValuePitch AI Hackathon Evaluation Alignment

| Requirement | Implementation in VERIDOC AI |
| :--- | :--- |
| **Strict Document Grounding** | Prompts send ONLY retrieved chunks; system prompt treats context as untrusted data. |
| **Zero Hallucinations** | Layer-2 Verifier inspects facts & numbers; ungrounded assertions are rejected. |
| **Abstention ("I don't know")** | Returns `"I don't know based on the provided documents."` for unanswerable questions. |
| **Verifiable Citations** | Validates that cited documents and page numbers exist in retrieved chunks. |
| **Inspection Audit Trail** | "How did we answer this?" drawer displays chunks, scores, and verification status. |
| **FinanceBench Benchmarking** | Dynamic evaluation dashboard reporting Answer Accuracy, Citation Accuracy, and Faithfulness. |

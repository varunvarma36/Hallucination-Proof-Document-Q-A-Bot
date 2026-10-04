# Credentials & Environment Configuration Guide

This document outlines the environment configuration, security architecture, and secrets isolation policy for **VERIDOC AI**.

---

## 1. Environment Variables Checklist

All configuration resides in a single `.env` file at the root of the project.

| Variable | Required | Default / Example | Purpose |
| :--- | :---: | :--- | :--- |
| `GROQ_API_KEY` | Recommended | `gsk_...` | Groq API Key for LLM generation & structured verification |
| `GROQ_MODEL` | Optional | `llama-3.3-70b-versatile` | Groq Model name |
| `SUPABASE_URL` | Optional* | `https://xyz.supabase.co` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Optional* | `eyJhb...` | Supabase Anonymous Client Key |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional* | `eyJhb...` | Supabase Service Role Secret (private storage & table ops) |
| `DATABASE_URL` | Optional* | `postgresql://...` | Direct PostgreSQL connection string |
| `EMBEDDING_MODEL` | No | `BAAI/bge-small-en-v1.5` | Embedding model (384-dimensions, local ONNX fastembed) |
| `VECTOR_BACKEND` | No | `supabase` or `local` | Vector store provider (`supabase` = pgvector, `local` = FAISS) |
| `TOP_K` | No | `5` | Number of chunks retrieved per query |
| `SIMILARITY_THRESHOLD` | No | `0.70` | Minimum cosine similarity to consider evidence valid |
| `CHUNK_SIZE` | No | `800` | Target characters per chunk |
| `CHUNK_OVERLAP` | No | `120` | Overlap characters between chunks to preserve context |
| `STORAGE_BUCKET` | No | `documents` | Name of private Supabase Storage bucket |

*\*Note on Local Mode:* If `SUPABASE_URL` is omitted or `VECTOR_BACKEND=local`, VERIDOC AI automatically uses its high-performance local FAISS vector store and local disk storage. If `GROQ_API_KEY` is omitted, the backend falls back to an intelligent local grounded extraction engine so that developers and judges can evaluate the system immediately!

---

## 2. Security & Frontend Isolation

### Rule: Secrets Never Reach the Client
- **Zero Frontend Secrets**: The React frontend contains **NO** API keys, NO Supabase service keys, and NO Groq tokens.
- **Backend API Gateway**: The browser communicates strictly with the FastAPI backend over `/api/...`.
- **CORS Protection**: FastAPI enforces strict origins matching Vite's development and production ports.
- **Private Storage**: All raw documents uploaded to Supabase Storage reside in a private bucket (`documents`) requiring signed backend authorization to access.

---

## 3. Quick Setup Steps

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your Groq API key:
   ```env
   GROQ_API_KEY=gsk_your_key_here
   ```

3. (Optional) Add your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL=postgresql://postgres.your-project:password@aws-0-region.pooler.supabase.com:6543/postgres
   VECTOR_BACKEND=supabase
   ```

4. Launch the application:
   ```bash
   # Terminal 1: Backend
   backend\venv\Scripts\python.exe backend/run_backend.py

   # Terminal 2: Frontend
   cd frontend
   npm.cmd run dev
   ```

5. Open your browser at `http://localhost:5173` to explore **VERIDOC AI**.

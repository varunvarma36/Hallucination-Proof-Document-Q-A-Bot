# Supabase Setup Guide: VERIDOC AI

This guide walks you through setting up a free **Supabase** project for VERIDOC AI, enabling **pgvector**, creating a **private storage bucket**, and executing the database schema.

---

## 1. Create a Free Supabase Project

1. Navigate to [Supabase](https://supabase.com/) and click **Start your project** (or sign in).
2. Click **New project** from your dashboard.
3. Select an organization (or create one).
4. Fill in the project details:
   - **Name**: `veridoc-ai` (or any preferred name)
   - **Database Password**: Choose a strong password and save it securely.
   - **Region**: Select the AWS region closest to you or your users.
   - **Pricing Plan**: **Free tier** ($0/month).
5. Click **Create new project**. Supabase will provision your PostgreSQL instance in ~1–2 minutes.

---

## 2. Retrieve Supabase URL and API Keys

Once your project is ready:

1. In the left navigation sidebar, click on the **Project Settings** (gear icon) at the bottom.
2. Select **API** under the Configuration section.
3. Locate the following credentials:
   - **Project URL**: Format `https://<project-ref>.supabase.co`
     → This maps to `SUPABASE_URL` in your `.env` file.
   - **Project API Keys**:
     - `anon` / `public` key:
       → This maps to `SUPABASE_ANON_KEY` in your `.env` file.
     - `service_role` / `secret` key (Click **Reveal** to view):
       → This maps to `SUPABASE_SERVICE_ROLE_KEY` in your `.env` file.
       *Note: The service role key bypasses Row Level Security and is used by the FastAPI backend to securely store private files and vector chunks.*
4. Retrieve the Database Connection String:
   - In **Project Settings** → **Database**, locate the **Connection string** section.
   - Under **URI**, copy the connection URI (e.g., `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres`).
   - Replace `[password]` with your database password.
   - This maps to `DATABASE_URL` in your `.env` file.

---

## 3. Enable the `pgvector` Extension

VERIDOC AI uses PostgreSQL with `pgvector` for 384-dimensional vector similarity search (`BAAI/bge-small-en-v1.5`).

### Option A: Via SQL Editor (Recommended)
1. On the left sidebar, click the **SQL Editor** icon.
2. Click **+ New query**.
3. Run the following command:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```
4. Click **Run**. You should see "Success. No rows returned".

### Option B: Via Database Extensions UI
1. Click **Database** on the left sidebar, then click **Extensions**.
2. Search for `vector`.
3. Toggle the switch to **ON** for `vector`.

---

## 4. Run the SQL Schema

1. Open `database/schema.sql` from this project directory.
2. In the Supabase **SQL Editor**, create a **New query**.
3. Copy and paste the entire contents of `database/schema.sql`:
   - It creates tables: `collections`, `documents`, `pages`, `chunks`, `chat_sessions`, `messages`, `citations`, `evaluation_results`.
   - It creates HNSW vector index: `chunks_embedding_hnsw_idx`.
   - It creates the RPC function: `match_chunks`.
   - It configures the private `documents` storage bucket.
4. Click **Run**.
5. Verify in **Table Editor** that all 8 tables are present.

---

## 5. Verify Private Storage Bucket

The schema script automatically creates the private `documents` bucket. To verify or manually configure:

1. Click **Storage** on the left sidebar.
2. Verify that a bucket named **`documents`** exists.
3. Click the bucket options (`...`) and ensure **Public bucket** is **OFF** (Private).
4. All original PDFs, DOCX, and TXT files uploaded through the backend are encrypted in transit and at rest in this private bucket. Only authenticated backend requests with the service role key can generate signed URLs or stream the files.

---

## 6. Configure `.env` File

Copy `.env.example` to `.env` in the project root:

```bash
cp .env.example .env
```

Populate the Supabase fields:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres.your-project-id:your-db-password@aws-0-region.pooler.supabase.com:6543/postgres
VECTOR_BACKEND=supabase
```

> **Local Fallback Note:** If you want to test the application locally without creating a Supabase account immediately, simply set `VECTOR_BACKEND=local`. VERIDOC AI includes an automatic FAISS and local disk fallback so the entire pipeline functions seamlessly offline!

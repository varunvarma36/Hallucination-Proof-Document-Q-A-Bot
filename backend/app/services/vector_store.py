import os
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np
import faiss
from app.config import settings
from app.database.supabase_client import db

class FAISSVectorStore:
    def __init__(self, dimension: int = 384):
        self.dimension = dimension
        self.index_dir = Path(settings.DATA_DIR) / "faiss_index"
        self.index_dir.mkdir(parents=True, exist_ok=True)
        self.index_file = self.index_dir / "index.faiss"
        self.meta_file = self.index_dir / "metadata.json"
        
        self.chunks_meta: List[Dict[str, Any]] = []
        self.index = faiss.IndexFlatIP(self.dimension)
        self._load()

    def _load(self):
        if self.index_file.exists() and self.meta_file.exists():
            try:
                self.index = faiss.read_index(str(self.index_file))
                with open(self.meta_file, "r", encoding="utf-8") as f:
                    self.chunks_meta = json.load(f)
            except Exception as e:
                print(f"[FAISS Load Error] {e}. Re-initializing empty FAISS index.")
                self.index = faiss.IndexFlatIP(self.dimension)
                self.chunks_meta = []

    def _save(self):
        try:
            faiss.write_index(self.index, str(self.index_file))
            with open(self.meta_file, "w", encoding="utf-8") as f:
                json.dump(self.chunks_meta, f, indent=2)
        except Exception as e:
            print(f"[FAISS Save Error] {e}")

    def add_chunks(self, chunks: List[Dict[str, Any]], embeddings: List[List[float]]):
        if not chunks or not embeddings:
            return
        vectors = np.array(embeddings, dtype=np.float32)
        # Normalize vectors for cosine similarity
        faiss.normalize_L2(vectors)
        self.index.add(vectors)
        self.chunks_meta.extend(chunks)
        self._save()

    def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        threshold: float = 0.70,
        collection_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        if self.index.ntotal == 0:
            return []

        q_vec = np.array([query_embedding], dtype=np.float32)
        faiss.normalize_L2(q_vec)

        # Retrieve more candidates if filtering by collection
        search_k = min(self.index.ntotal, max(top_k * 4, 20))
        similarities, indices = self.index.search(q_vec, search_k)

        results = []
        for sim, idx in zip(similarities[0], indices[0]):
            if idx == -1 or idx >= len(self.chunks_meta):
                continue
            chunk = self.chunks_meta[idx]

            # Strict collection filtering: Never retrieve from another collection
            if collection_id and chunk.get("collection_id") != collection_id:
                continue

            score = float(sim)
            if score >= threshold:
                doc_title = chunk.get("metadata", {}).get("document_title", "Document")
                results.append({
                    "id": chunk.get("id"),
                    "document_id": chunk.get("document_id"),
                    "document_title": doc_title,
                    "page_number": chunk.get("page_number", 1),
                    "chunk_index": chunk.get("chunk_index", 1),
                    "content": chunk.get("content", ""),
                    "metadata": chunk.get("metadata", {}),
                    "similarity": round(score, 4)
                })

            if len(results) >= top_k:
                break

        return results

    def clear(self):
        self.index = faiss.IndexFlatIP(self.dimension)
        self.chunks_meta = []
        self._save()


class SupabaseVectorStore:
    def __init__(self):
        pass

    def search(
        self,
        query_embedding: List[float],
        top_k: int = 5,
        threshold: float = 0.70,
        collection_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        if not db.is_supabase_connected or not db.supabase:
            return []

        try:
            params = {
                "query_embedding": query_embedding,
                "match_threshold": threshold,
                "match_count": top_k,
                "filter_collection_id": collection_id if collection_id else None
            }
            res = db.supabase.rpc("match_chunks", params).execute()
            data = res.data or []
            return [
                {
                    "id": item.get("id"),
                    "document_id": item.get("document_id"),
                    "document_title": item.get("document_title", "Document"),
                    "page_number": item.get("page_number", 1),
                    "chunk_index": item.get("chunk_index", 1),
                    "content": item.get("content", ""),
                    "metadata": item.get("metadata", {}),
                    "similarity": round(float(item.get("similarity", 0.0)), 4)
                }
                for item in data
            ]
        except Exception as e:
            print(f"[Supabase pgvector RPC search error] {e}")
            return []


class VectorStoreManager:
    def __init__(self):
        self.faiss_store = FAISSVectorStore(dimension=384)
        self.supabase_store = SupabaseVectorStore()

    def add_chunks(self, chunks: List[Dict[str, Any]], embeddings: List[List[float]]):
        # Store embeddings in chunks objects
        for ch, emb in zip(chunks, embeddings):
            ch["embedding"] = emb

        # Store in Supabase if configured
        if db.is_supabase_connected and settings.VECTOR_BACKEND == "supabase":
            db.insert_chunks(chunks)

        # Always maintain FAISS sync for local speed, fallback, and resilience
        self.faiss_store.add_chunks(chunks, embeddings)

    def search(
        self,
        query_embedding: List[float],
        top_k: Optional[int] = None,
        threshold: Optional[float] = None,
        collection_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        k = top_k if top_k is not None else settings.TOP_K
        thresh = threshold if threshold is not None else settings.SIMILARITY_THRESHOLD

        if settings.VECTOR_BACKEND == "supabase" and db.is_supabase_connected:
            results = self.supabase_store.search(
                query_embedding=query_embedding,
                top_k=k,
                threshold=thresh,
                collection_id=collection_id
            )
            if results:
                return results

        # Fallback to FAISS
        return self.faiss_store.search(
            query_embedding=query_embedding,
            top_k=k,
            threshold=thresh,
            collection_id=collection_id
        )

vector_store = VectorStoreManager()

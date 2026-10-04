import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Dict, Any, List
from supabase import create_client, Client
from app.config import settings

class DatabaseManager:
    def __init__(self):
        self.supabase: Optional[Client] = None
        self.is_supabase_connected = False
        self._init_supabase()
        
        # Local JSON database fallback path
        self.local_db_path = Path(settings.DATA_DIR) / "local_db.json"
        self._init_local_db()

    def _init_supabase(self):
        if settings.SUPABASE_URL and (settings.SUPABASE_SERVICE_ROLE_KEY or settings.SUPABASE_ANON_KEY):
            key = settings.SUPABASE_SERVICE_ROLE_KEY if settings.SUPABASE_SERVICE_ROLE_KEY else settings.SUPABASE_ANON_KEY
            try:
                self.supabase = create_client(settings.SUPABASE_URL, key)
                # Test connectivity
                # If Supabase URL is valid, mark connected
                self.is_supabase_connected = True
            except Exception as e:
                print(f"[Supabase Init Warning] Could not connect to Supabase: {e}. Falling back to local store.")
                self.is_supabase_connected = False
        else:
            self.is_supabase_connected = False

    def _init_local_db(self):
        if not self.local_db_path.exists():
            default_data = {
                "collections": [],
                "documents": [],
                "pages": [],
                "chunks": [],
                "chat_sessions": [],
                "messages": [],
                "citations": [],
                "evaluation_results": []
            }
            self._save_local_db(default_data)

    def _load_local_db(self) -> Dict[str, List[Dict[str, Any]]]:
        if not self.local_db_path.exists():
            self._init_local_db()
        try:
            with open(self.local_db_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            return {
                "collections": [],
                "documents": [],
                "pages": [],
                "chunks": [],
                "chat_sessions": [],
                "messages": [],
                "citations": [],
                "evaluation_results": []
            }

    def _save_local_db(self, data: Dict[str, List[Dict[str, Any]]]):
        with open(self.local_db_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, default=str)

    # -------------------------------------------------------------
    # Collections Operations
    # -------------------------------------------------------------
    def get_collections(self) -> List[Dict[str, Any]]:
        if self.is_supabase_connected and settings.VECTOR_BACKEND == "supabase":
            try:
                res = self.supabase.table("collections").select("*").order("created_at", desc=True).execute()
                collections = res.data or []
                # Enrich with counts
                for c in collections:
                    docs = self.supabase.table("documents").select("id", count="exact").eq("collection_id", c["id"]).execute()
                    c["document_count"] = docs.count or 0
                    chunks = self.supabase.table("chunks").select("id", count="exact").eq("collection_id", c["id"]).execute()
                    c["chunk_count"] = chunks.count or 0
                return collections
            except Exception as e:
                print(f"[Supabase Query Error] Collections: {e}. Using local store.")
        
        # Local fallback
        db = self._load_local_db()
        collections = db.get("collections", [])
        for c in collections:
            c["document_count"] = len([d for d in db.get("documents", []) if d.get("collection_id") == c["id"]])
            c["chunk_count"] = len([ch for ch in db.get("chunks", []) if ch.get("collection_id") == c["id"]])
        return collections

    def create_collection(self, name: str, description: Optional[str] = None) -> Dict[str, Any]:
        cid = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        new_col = {
            "id": cid,
            "name": name,
            "description": description or "",
            "created_at": now,
            "updated_at": now
        }
        if self.is_supabase_connected and settings.VECTOR_BACKEND == "supabase":
            try:
                res = self.supabase.table("collections").insert(new_col).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                print(f"[Supabase Insert Error] Collection: {e}")
        
        # Local
        db = self._load_local_db()
        # Avoid duplicate name
        existing = [c for c in db.get("collections", []) if c.get("name") == name]
        if existing:
            return existing[0]
        db["collections"].append(new_col)
        self._save_local_db(db)
        return new_col

    def get_collection_by_id(self, collection_id: str) -> Optional[Dict[str, Any]]:
        collections = self.get_collections()
        for c in collections:
            if c["id"] == collection_id:
                return c
        return None

    # -------------------------------------------------------------
    # Documents Operations
    # -------------------------------------------------------------
    def insert_document(self, doc_data: Dict[str, Any]) -> Dict[str, Any]:
        if "id" not in doc_data:
            doc_data["id"] = str(uuid.uuid4())
        if "created_at" not in doc_data:
            doc_data["created_at"] = datetime.now(timezone.utc).isoformat()
            doc_data["updated_at"] = doc_data["created_at"]

        if self.is_supabase_connected and settings.VECTOR_BACKEND == "supabase":
            try:
                res = self.supabase.table("documents").insert(doc_data).execute()
                if res.data:
                    return res.data[0]
            except Exception as e:
                print(f"[Supabase Insert Error] Document: {e}")

        # Local
        db = self._load_local_db()
        db["documents"].append(doc_data)
        self._save_local_db(db)
        return doc_data

    def get_documents(self, collection_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if self.is_supabase_connected and settings.VECTOR_BACKEND == "supabase":
            try:
                query = self.supabase.table("documents").select("*, collections(name)")
                if collection_id:
                    query = query.eq("collection_id", collection_id)
                res = query.order("created_at", desc=True).execute()
                docs = res.data or []
                for d in docs:
                    if "collections" in d and d["collections"]:
                        d["collection_name"] = d["collections"].get("name")
                return docs
            except Exception as e:
                print(f"[Supabase Query Error] Documents: {e}")

        # Local
        db = self._load_local_db()
        docs = db.get("documents", [])
        if collection_id:
            docs = [d for d in docs if d.get("collection_id") == collection_id]
        cols = {c["id"]: c["name"] for c in db.get("collections", [])}
        for d in docs:
            d["collection_name"] = cols.get(d.get("collection_id"), "Default Collection")
        return docs

    def get_document_by_id(self, document_id: str) -> Optional[Dict[str, Any]]:
        docs = self.get_documents()
        for d in docs:
            if d["id"] == document_id:
                return d
        return None

    def delete_document(self, document_id: str) -> bool:
        if self.is_supabase_connected and settings.VECTOR_BACKEND == "supabase":
            try:
                self.supabase.table("documents").delete().eq("id", document_id).execute()
                return True
            except Exception as e:
                print(f"[Supabase Delete Error] Document: {e}")

        # Local
        db = self._load_local_db()
        db["documents"] = [d for d in db.get("documents", []) if d["id"] != document_id]
        db["pages"] = [p for p in db.get("pages", []) if p["document_id"] != document_id]
        db["chunks"] = [ch for ch in db.get("chunks", []) if ch["document_id"] != document_id]
        self._save_local_db(db)
        return True

    # -------------------------------------------------------------
    # Pages Operations
    # -------------------------------------------------------------
    def insert_pages(self, pages: List[Dict[str, Any]]):
        now = datetime.now(timezone.utc).isoformat()
        for p in pages:
            if "id" not in p:
                p["id"] = str(uuid.uuid4())
            p["created_at"] = now

        if self.is_supabase_connected and settings.VECTOR_BACKEND == "supabase":
            try:
                self.supabase.table("pages").insert(pages).execute()
                return
            except Exception as e:
                print(f"[Supabase Insert Error] Pages: {e}")

        # Local
        db = self._load_local_db()
        db["pages"].extend(pages)
        self._save_local_db(db)

    def get_pages_for_document(self, document_id: str) -> List[Dict[str, Any]]:
        if self.is_supabase_connected and settings.VECTOR_BACKEND == "supabase":
            try:
                res = self.supabase.table("pages").select("*").eq("document_id", document_id).order("page_number").execute()
                return res.data or []
            except Exception as e:
                print(f"[Supabase Query Error] Pages: {e}")

        db = self._load_local_db()
        return sorted([p for p in db.get("pages", []) if p.get("document_id") == document_id], key=lambda x: x["page_number"])

    # -------------------------------------------------------------
    # Chunks Operations
    # -------------------------------------------------------------
    def insert_chunks(self, chunks: List[Dict[str, Any]]):
        now = datetime.now(timezone.utc).isoformat()
        for ch in chunks:
            if "id" not in ch:
                ch["id"] = str(uuid.uuid4())
            ch["created_at"] = now

        if self.is_supabase_connected and settings.VECTOR_BACKEND == "supabase":
            try:
                # Prepare for pgvector: embedding must be list of floats
                self.supabase.table("chunks").insert(chunks).execute()
                return
            except Exception as e:
                print(f"[Supabase Insert Error] Chunks: {e}")

        # Local
        db = self._load_local_db()
        db["chunks"].extend(chunks)
        self._save_local_db(db)

    def get_chunks_for_document(self, document_id: str) -> List[Dict[str, Any]]:
        if self.is_supabase_connected and settings.VECTOR_BACKEND == "supabase":
            try:
                res = self.supabase.table("chunks").select("id, document_id, page_number, chunk_index, content, metadata").eq("document_id", document_id).order("chunk_index").execute()
                return res.data or []
            except Exception as e:
                print(f"[Supabase Query Error] Chunks: {e}")

        db = self._load_local_db()
        return sorted([ch for ch in db.get("chunks", []) if ch.get("document_id") == document_id], key=lambda x: x["chunk_index"])

    def get_all_chunks(self, collection_id: Optional[str] = None) -> List[Dict[str, Any]]:
        db = self._load_local_db()
        chunks = db.get("chunks", [])
        if collection_id:
            chunks = [c for c in chunks if c.get("collection_id") == collection_id]
        return chunks

    # -------------------------------------------------------------
    # Chat & Evaluation Operations
    # -------------------------------------------------------------
    def save_chat_session(self, title: str, collection_id: Optional[str] = None) -> str:
        sid = str(uuid.uuid4())
        session = {
            "id": sid,
            "title": title,
            "collection_id": collection_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        db = self._load_local_db()
        db["chat_sessions"].append(session)
        self._save_local_db(db)
        return sid

    def save_message(self, message_data: Dict[str, Any]) -> str:
        mid = str(uuid.uuid4())
        message_data["id"] = mid
        message_data["created_at"] = datetime.now(timezone.utc).isoformat()
        db = self._load_local_db()
        db["messages"].append(message_data)
        self._save_local_db(db)
        return mid

    def get_messages(self, session_id: str) -> List[Dict[str, Any]]:
        db = self._load_local_db()
        return [m for m in db.get("messages", []) if m.get("session_id") == session_id]

    def save_evaluation_results(self, run_id: str, results: List[Dict[str, Any]]):
        now = datetime.now(timezone.utc).isoformat()
        for r in results:
            r["run_id"] = run_id
            r["created_at"] = now
        db = self._load_local_db()
        db["evaluation_results"].extend(results)
        self._save_local_db(db)

    def get_evaluation_history(self) -> List[Dict[str, Any]]:
        db = self._load_local_db()
        return db.get("evaluation_results", [])

# Global database manager instance
db = DatabaseManager()

import os
import uuid
from pathlib import Path
from typing import Optional, Tuple
from app.config import settings
from app.database.supabase_client import db

class StorageService:
    def __init__(self):
        self.bucket_name = settings.STORAGE_BUCKET
        self.local_dir = Path(settings.STORAGE_LOCAL_DIR)
        self.local_dir.mkdir(parents=True, exist_ok=True)

    def upload_file(self, filename: str, file_bytes: bytes, collection_id: Optional[str] = None) -> Tuple[str, str]:
        """
        Stores file in private Supabase Storage bucket 'documents' if available,
        or local private storage directory as fallback.
        Returns: (storage_path, storage_backend)
        """
        file_ext = Path(filename).suffix
        unique_name = f"{collection_id or 'general'}/{uuid.uuid4()}{file_ext}"

        # Try Supabase Storage first
        if db.is_supabase_connected and db.supabase:
            try:
                # Ensure bucket exists
                try:
                    db.supabase.storage.get_bucket(self.bucket_name)
                except Exception:
                    # Try creating private bucket
                    try:
                        db.supabase.storage.create_bucket(self.bucket_name, options={"public": False})
                    except Exception:
                        pass

                # Upload to private bucket
                res = db.supabase.storage.from_(self.bucket_name).upload(
                    path=unique_name,
                    file=file_bytes,
                    file_options={"content-type": "application/octet-stream", "upsert": "true"}
                )
                return unique_name, "supabase"
            except Exception as e:
                print(f"[Supabase Storage Upload Warning] {e}. Falling back to local private storage.")

        # Local fallback
        local_path = self.local_dir / unique_name
        local_path.parent.mkdir(parents=True, exist_ok=True)
        with open(local_path, "wb") as f:
            f.write(file_bytes)

        return str(unique_name), "local"

    def get_file_bytes(self, storage_path: str) -> Optional[bytes]:
        """Retrieves raw file bytes from private Supabase Storage or local storage."""
        if db.is_supabase_connected and db.supabase:
            try:
                data = db.supabase.storage.from_(self.bucket_name).download(storage_path)
                if data:
                    return data
            except Exception as e:
                print(f"[Supabase Storage Download Warning] {e}")

        local_path = self.local_dir / storage_path
        if local_path.exists():
            with open(local_path, "rb") as f:
                return f.read()
        return None

    def get_signed_url(self, storage_path: str, expires_in: int = 3600) -> Optional[str]:
        """Generates a secure temporary signed URL for viewing the private file."""
        if db.is_supabase_connected and db.supabase:
            try:
                res = db.supabase.storage.from_(self.bucket_name).create_signed_url(storage_path, expires_in)
                if res and "signedURL" in res:
                    return res["signedURL"]
            except Exception as e:
                print(f"[Supabase Signed URL Warning] {e}")
        
        # Local backend signed streaming endpoint
        return f"/api/documents/stream/{storage_path}"

storage_service = StorageService()

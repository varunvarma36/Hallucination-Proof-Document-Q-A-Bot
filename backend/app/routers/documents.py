from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response
from typing import Optional, List
from pathlib import Path
from app.database.supabase_client import db
from app.services.rag_engine import rag_pipeline
from app.services.storage import storage_service
from app.models.schemas import DocumentListItem, DocumentDetail, DocumentUploadResponse

router = APIRouter(prefix="/api/documents", tags=["Documents"])

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    collection_id: Optional[str] = Form(None)
):
    try:
        file_bytes = await file.read()
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        filename = file.filename or "uploaded_document.txt"
        doc_title = title or filename.rsplit(".", 1)[0]

        result = rag_pipeline.ingest_document(
            filename=filename,
            file_bytes=file_bytes,
            title=doc_title,
            collection_id=collection_id
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")

@router.get("", response_model=List[DocumentListItem])
async def list_documents(collection_id: Optional[str] = None):
    docs = db.get_documents(collection_id=collection_id)
    return [
        DocumentListItem(
            id=d["id"],
            collection_id=d.get("collection_id"),
            collection_name=d.get("collection_name"),
            title=d["title"],
            filename=d["filename"],
            file_type=d["file_type"],
            file_size=d["file_size"],
            storage_path=d["storage_path"],
            page_count=d.get("page_count", 0),
            chunk_count=d.get("chunk_count", 0),
            status=d.get("status", "indexed"),
            created_at=d.get("created_at")
        )
        for d in docs
    ]

@router.get("/{document_id}", response_model=DocumentDetail)
async def get_document(document_id: str):
    doc = db.get_document_by_id(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    pages = db.get_pages_for_document(document_id)
    chunks = db.get_chunks_for_document(document_id)

    return DocumentDetail(
        document=DocumentListItem(
            id=doc["id"],
            collection_id=doc.get("collection_id"),
            collection_name=doc.get("collection_name"),
            title=doc["title"],
            filename=doc["filename"],
            file_type=doc["file_type"],
            file_size=doc["file_size"],
            storage_path=doc["storage_path"],
            page_count=doc.get("page_count", 0),
            chunk_count=doc.get("chunk_count", 0),
            status=doc.get("status", "indexed"),
            created_at=doc.get("created_at")
        ),
        pages=[
            {
                "id": p["id"],
                "page_number": p["page_number"],
                "char_count": p["char_count"],
                "preview_text": p["page_text"][:300] + ("..." if len(p["page_text"]) > 300 else "")
            }
            for p in pages
        ],
        chunks=[
            {
                "id": c["id"],
                "chunk_index": c["chunk_index"],
                "page_number": c["page_number"],
                "content": c["content"],
                "token_count": c.get("token_count"),
                "metadata": c.get("metadata", {})
            }
            for c in chunks
        ]
    )

@router.delete("/{document_id}")
async def delete_document(document_id: str):
    success = db.delete_document(document_id)
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete document")
    return {"message": "Document deleted successfully"}

@router.get("/stream/{storage_path:path}")
async def stream_document_file(storage_path: str):
    """Streams file bytes securely for authorized preview."""
    file_bytes = storage_service.get_file_bytes(storage_path)
    if not file_bytes:
        raise HTTPException(status_code=404, detail="File not found in storage")

    suffix = Path(storage_path).suffix.lower()
    media_types = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".txt": "text/plain",
        ".json": "application/json"
    }
    media_type = media_types.get(suffix, "application/octet-stream")

    return Response(content=file_bytes, media_type=media_type)

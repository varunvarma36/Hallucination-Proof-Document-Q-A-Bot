import time
import uuid
from typing import Dict, Any, List, Optional
from app.config import settings
from app.database.supabase_client import db
from app.services.parser import DocumentParser
from app.services.chunker import DocumentChunker
from app.services.embedder import embedder
from app.services.storage import storage_service
from app.services.vector_store import vector_store
from app.services.groq_client import groq_service
from app.services.verifier import verifier

class RAGPipeline:
    def __init__(self):
        self.chunker = DocumentChunker()

    def ingest_document(
        self,
        filename: str,
        file_bytes: bytes,
        title: Optional[str] = None,
        collection_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Full Document Ingestion Pipeline:
        Upload -> Store private -> Extract pages -> Chunk -> Embed -> Store persistent
        """
        doc_title = title or filename.rsplit(".", 1)[0]
        file_size = len(file_bytes)
        file_ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "txt"

        # 1. Ensure collection exists
        if not collection_id:
            default_col = db.create_collection("Default Collection", "General financial documents")
            collection_id = default_col["id"]

        # 2. Store original file in private storage
        storage_path, storage_backend = storage_service.upload_file(filename, file_bytes, collection_id)

        # 3. Extract text while preserving page numbers
        parsed_pages = DocumentParser.parse_file(filename, file_bytes)
        page_count = len(parsed_pages)

        # 4. Create document record in database
        doc_id = str(uuid.uuid4())
        doc_record = {
            "id": doc_id,
            "collection_id": collection_id,
            "title": doc_title,
            "filename": filename,
            "file_type": file_ext,
            "file_size": file_size,
            "storage_path": storage_path,
            "storage_bucket": settings.STORAGE_BUCKET,
            "page_count": page_count,
            "chunk_count": 0,
            "status": "processing",
            "metadata": {
                "storage_backend": storage_backend,
                "parsed_pages": page_count
            }
        }
        db.insert_document(doc_record)

        # 5. Insert pages
        pages_to_insert = [
            {
                "id": str(uuid.uuid4()),
                "document_id": doc_id,
                "page_number": p["page_number"],
                "page_text": p["text"],
                "char_count": p["char_count"]
            }
            for p in parsed_pages
        ]
        db.insert_pages(pages_to_insert)

        # 6. Chunk document
        chunks = self.chunker.chunk_pages(
            pages=parsed_pages,
            document_id=doc_id,
            collection_id=collection_id,
            document_title=doc_title
        )
        chunk_count = len(chunks)

        # 7. Generate vector embeddings
        chunk_texts = [c["content"] for c in chunks]
        embeddings = embedder.embed_texts(chunk_texts)

        # 8. Store chunks + metadata + embeddings in vector store
        vector_store.add_chunks(chunks, embeddings)

        # 9. Mark document as indexed
        doc_record["chunk_count"] = chunk_count
        doc_record["status"] = "indexed"
        if db.is_supabase_connected and settings.VECTOR_BACKEND == "supabase":
            try:
                db.supabase.table("documents").update({"chunk_count": chunk_count, "status": "indexed"}).eq("id", doc_id).execute()
            except Exception:
                pass

        return {
            "id": doc_id,
            "title": doc_title,
            "filename": filename,
            "page_count": page_count,
            "chunk_count": chunk_count,
            "status": "indexed",
            "message": f"Successfully parsed {page_count} pages and indexed {chunk_count} vector chunks."
        }

    def answer_query(
        self,
        question: str,
        collection_id: Optional[str] = None,
        top_k: Optional[int] = None,
        similarity_threshold: Optional[float] = None,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Complete Hallucination-Proof RAG Retrieval & Verification Pipeline:
        Retrieve -> Build Context -> Groq LLM -> Second Layer Verifier -> Citations -> Response
        """
        start_time = time.time()
        k = top_k if top_k is not None else settings.TOP_K
        thresh = similarity_threshold if similarity_threshold is not None else settings.SIMILARITY_THRESHOLD

        # 1. Embed user query
        query_embedding = embedder.embed_query(question)

        # 2. Retrieve relevant chunks (filtered strictly by collection)
        retrieved_chunks = vector_store.search(
            query_embedding=query_embedding,
            top_k=k,
            threshold=thresh,
            collection_id=collection_id
        )

        # 3. Generate answer via Groq LLM using ONLY retrieved context
        llm_output = groq_service.generate_grounded_answer(retrieved_chunks, question)

        # 4. Second-Layer Hallucination Verification
        verified_output, verification_meta = verifier.verify_response(llm_output, retrieved_chunks, question)

        elapsed_ms = int((time.time() - start_time) * 1000)

        # Build execution trace for "How did we answer this?"
        trace = {
            "retrieved_chunks_count": len(retrieved_chunks),
            "retrieved_chunks": [
                {
                    "chunk_id": str(ch.get("id", f"chk-{i}")),
                    "document_title": ch.get("document_title", "Document"),
                    "page_number": ch.get("page_number", 1),
                    "chunk_index": ch.get("chunk_index", 1),
                    "similarity": ch.get("similarity", 0.0),
                    "content": ch.get("content", "")
                }
                for i, ch in enumerate(retrieved_chunks)
            ],
            "citations_verified": verification_meta["citations_verified"],
            "factual_overlap_score": verification_meta["factual_overlap_score"],
            "grounding_verdict": verification_meta["grounding_verdict"],
            "unsupported_reason": verification_meta["unsupported_reason"],
            "latency_ms": elapsed_ms,
            "groq_model_used": settings.GROQ_MODEL
        }

        # 5. Persist Session & Messages to DB
        if not session_id:
            session_id = db.save_chat_session(title=question[:40] + "...", collection_id=collection_id)

        # Save user message
        db.save_message({
            "session_id": session_id,
            "role": "user",
            "content": question
        })

        # Save assistant message with citations & verification details
        msg_id = db.save_message({
            "session_id": session_id,
            "role": "assistant",
            "content": verified_output["answer"],
            "supported": verified_output["supported"],
            "confidence": verified_output["confidence"],
            "verification_status": verification_meta["grounding_verdict"].lower(),
            "verification_details": verification_meta,
            "citations": verified_output["citations"]
        })

        return {
            "supported": verified_output["supported"],
            "answer": verified_output["answer"],
            "confidence": verified_output["confidence"],
            "citations": verified_output["citations"],
            "verification_status": "verified_grounded" if verified_output["supported"] else "abstained_unsupported",
            "trace": trace,
            "session_id": session_id
        }

rag_pipeline = RAGPipeline()

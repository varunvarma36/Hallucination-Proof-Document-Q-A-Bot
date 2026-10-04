from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.services.rag_engine import rag_pipeline
from app.database.supabase_client import db
from app.models.schemas import ChatQueryRequest, ChatQueryResponse, ChatSessionResponse, MessageResponse

router = APIRouter(prefix="/api/chat", tags=["Chat"])

@router.post("/query", response_model=ChatQueryResponse)
async def query_chat(payload: ChatQueryRequest):
    try:
        response = rag_pipeline.answer_query(
            question=payload.question,
            collection_id=payload.collection_id,
            top_k=payload.top_k,
            similarity_threshold=payload.similarity_threshold,
            session_id=payload.session_id
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query error: {str(e)}")

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def list_sessions():
    local_db = db._load_local_db()
    sessions = local_db.get("chat_sessions", [])
    messages = local_db.get("messages", [])
    
    result = []
    for s in sessions:
        msg_count = len([m for m in messages if m.get("session_id") == s["id"]])
        result.append(ChatSessionResponse(
            id=s["id"],
            title=s.get("title", "Chat Session"),
            collection_id=s.get("collection_id"),
            message_count=msg_count,
            created_at=s.get("created_at")
        ))
    return sorted(result, key=lambda x: x.created_at or "", reverse=True)

@router.get("/sessions/{session_id}/messages")
async def get_session_messages(session_id: str):
    messages = db.get_messages(session_id)
    return messages

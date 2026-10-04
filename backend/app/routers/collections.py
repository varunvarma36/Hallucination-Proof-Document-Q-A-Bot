from fastapi import APIRouter, HTTPException
from typing import List
from app.database.supabase_client import db
from app.models.schemas import CollectionCreate, CollectionResponse

router = APIRouter(prefix="/api/collections", tags=["Collections"])

@router.get("", response_model=List[CollectionResponse])
async def list_collections():
    cols = db.get_collections()
    return [
        CollectionResponse(
            id=c["id"],
            name=c["name"],
            description=c.get("description"),
            document_count=c.get("document_count", 0),
            chunk_count=c.get("chunk_count", 0),
            created_at=c.get("created_at")
        )
        for c in cols
    ]

@router.post("", response_model=CollectionResponse)
async def create_collection(payload: CollectionCreate):
    try:
        new_col = db.create_collection(name=payload.name, description=payload.description)
        return CollectionResponse(
            id=new_col["id"],
            name=new_col["name"],
            description=new_col.get("description"),
            document_count=0,
            chunk_count=0,
            created_at=new_col.get("created_at")
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{collection_id}", response_model=CollectionResponse)
async def get_collection(collection_id: str):
    col = db.get_collection_by_id(collection_id)
    if not col:
        raise HTTPException(status_code=404, detail="Collection not found")
    return CollectionResponse(
        id=col["id"],
        name=col["name"],
        description=col.get("description"),
        document_count=col.get("document_count", 0),
        chunk_count=col.get("chunk_count", 0),
        created_at=col.get("created_at")
    )

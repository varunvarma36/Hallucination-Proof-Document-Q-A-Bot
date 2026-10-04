import pytest
from app.database.supabase_client import db

def test_database_collections_crud():
    col = db.create_collection("Test DB Col", "Testing DB CRUD operations")
    assert col["id"] is not None
    assert col["name"] == "Test DB Col"

    retrieved = db.get_collection_by_id(col["id"])
    assert retrieved is not None
    assert retrieved["name"] == "Test DB Col"

def test_database_documents_and_pages():
    col = db.create_collection("Doc Collection", "Testing documents")
    doc_data = {
        "collection_id": col["id"],
        "title": "Quarterly Report",
        "filename": "q_report.txt",
        "file_type": "txt",
        "file_size": 1024,
        "storage_path": "test/q_report.txt",
        "page_count": 2,
        "chunk_count": 4,
        "status": "indexed"
    }
    inserted = db.insert_document(doc_data)
    assert inserted["id"] is not None

    pages = [
        {"document_id": inserted["id"], "page_number": 1, "page_text": "Page one content", "char_count": 16},
        {"document_id": inserted["id"], "page_number": 2, "page_text": "Page two content", "char_count": 16}
    ]
    db.insert_pages(pages)
    fetched_pages = db.get_pages_for_document(inserted["id"])
    assert len(fetched_pages) == 2
    assert fetched_pages[0]["page_number"] == 1

def test_chat_session_and_messages():
    sid = db.save_chat_session("Test Session")
    assert sid is not None
    
    mid = db.save_message({
        "session_id": sid,
        "role": "user",
        "content": "What is the revenue?"
    })
    assert mid is not None
    
    msgs = db.get_messages(sid)
    assert len(msgs) >= 1
    assert msgs[0]["content"] == "What is the revenue?"

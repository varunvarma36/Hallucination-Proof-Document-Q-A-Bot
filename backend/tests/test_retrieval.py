import pytest
from app.services.embedder import embedder
from app.services.vector_store import vector_store
from app.database.supabase_client import db

def test_embedder_dimension():
    text = "Apple net sales in fiscal year 2023 were $383,285 million."
    vec = embedder.embed_query(text)
    assert len(vec) == 384
    # Embedding vector should be normalized
    import numpy as np
    norm = np.linalg.norm(np.array(vec))
    assert abs(norm - 1.0) < 1e-4

def test_vector_store_collection_isolation():
    col_a = db.create_collection("Collection Alpha", "Test A")
    col_b = db.create_collection("Collection Beta", "Test B")

    chunk_a = {
        "id": "chk-a",
        "collection_id": col_a["id"],
        "document_id": "doc-a",
        "page_number": 5,
        "chunk_index": 1,
        "content": "Secret Alpha Project is valued at $900 billion.",
        "metadata": {"document_title": "Alpha Doc"}
    }
    chunk_b = {
        "id": "chk-b",
        "collection_id": col_b["id"],
        "document_id": "doc-b",
        "page_number": 8,
        "chunk_index": 1,
        "content": "Secret Beta Project is valued at $10 million.",
        "metadata": {"document_title": "Beta Doc"}
    }

    vec_a = embedder.embed_texts([chunk_a["content"]])
    vec_b = embedder.embed_texts([chunk_b["content"]])

    vector_store.add_chunks([chunk_a], vec_a)
    vector_store.add_chunks([chunk_b], vec_b)

    # Search strictly in collection A
    q_vec = embedder.embed_query("What is the valuation of Secret Beta Project?")
    results = vector_store.search(q_vec, collection_id=col_a["id"], top_k=5, threshold=0.1)

    # Chunks from Collection B must NEVER be returned when filtering for Collection A
    for r in results:
        assert r["id"] != "chk-b"

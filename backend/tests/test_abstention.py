import pytest
from app.services.rag_engine import rag_pipeline
from app.database.supabase_client import db

def test_i_dont_know_on_empty_context():
    # When no chunks match threshold
    empty_col = db.create_collection("Empty Test Collection", "No documents")
    response = rag_pipeline.answer_query(
        question="What was the net profit margin of extraterrestrial colonies?",
        collection_id=empty_col["id"],
        similarity_threshold=0.85
    )
    assert response["supported"] is False
    assert response["answer"] == "I don't know based on the provided documents."
    assert response["citations"] == []
    assert response["verification_status"] == "abstained_unsupported"

def test_i_dont_know_on_adversarial_question():
    # Ingest a simple document
    col = db.create_collection("Financials Only", "Standard financial statements")
    sample_text = b"[Page: 1]\nApple Inc. total net sales in 2023 were $383,285 million."
    rag_pipeline.ingest_document(
        filename="apple_sales.txt",
        file_bytes=sample_text,
        title="Apple Sales Document",
        collection_id=col["id"]
    )
    
    # Ask completely unrelated out-of-domain question
    response = rag_pipeline.answer_query(
        question="What is the average wingspan of a peregrine falcon in Antarctica?",
        collection_id=col["id"],
        similarity_threshold=0.70
    )
    assert response["supported"] is False
    assert "I don't know based on the provided documents." in response["answer"]
    assert response["citations"] == []

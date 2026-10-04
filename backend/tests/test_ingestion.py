import pytest
from app.services.parser import DocumentParser
from app.services.rag_engine import rag_pipeline
from app.database.supabase_client import db

def test_parse_txt_page_markers():
    sample_text = """[Page: 1]
SEC Filing Apple Inc.
Quarterly revenue was $81 billion.

[Page: 2]
Operating expenses reached $14 billion.
Research and development stood at $7 billion.
"""
    pages = DocumentParser.parse_file("filing.txt", sample_text.encode("utf-8"))
    assert len(pages) == 2
    assert pages[0]["page_number"] == 1
    assert "81 billion" in pages[0]["text"]
    assert pages[1]["page_number"] == 2
    assert "14 billion" in pages[1]["text"]

def test_ingest_pipeline():
    sample_text = b"[Page: 1]\nTest Corporation financial report for FY2024. Revenue was $500 million."
    col = db.create_collection("Test Ingestion Collection", "Testing ingestion")
    res = rag_pipeline.ingest_document(
        filename="test_corp.txt",
        file_bytes=sample_text,
        title="Test Corporation FY24",
        collection_id=col["id"]
    )
    assert res["status"] == "indexed"
    assert res["page_count"] == 1
    assert res["chunk_count"] >= 1

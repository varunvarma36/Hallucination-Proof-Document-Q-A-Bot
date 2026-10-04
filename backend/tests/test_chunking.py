import pytest
from app.services.chunker import DocumentChunker

def test_chunking_preserves_page_numbers():
    chunker = DocumentChunker(chunk_size=100, chunk_overlap=20)
    pages = [
        {"page_number": 1, "text": "This is page one text that is long enough to be chunked into multiple parts. " * 3},
        {"page_number": 2, "text": "This is page two text with financial disclosures for Apple Inc. " * 3}
    ]
    chunks = chunker.chunk_pages(pages, document_id="doc-123", collection_id="col-123", document_title="Test Doc")
    
    assert len(chunks) >= 2
    # Verify page numbers match original pages
    p1_chunks = [c for c in chunks if c["page_number"] == 1]
    p2_chunks = [c for c in chunks if c["page_number"] == 2]
    assert len(p1_chunks) >= 1
    assert len(p2_chunks) >= 1

def test_chunking_overlap():
    chunker = DocumentChunker(chunk_size=50, chunk_overlap=15)
    pages = [
        {"page_number": 1, "text": "Alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron."}
    ]
    chunks = chunker.chunk_pages(pages, document_id="doc-1", collection_id="col-1", document_title="Test")
    assert len(chunks) > 1
    # Ensure chunk indices are sequential
    for i, c in enumerate(chunks):
        assert c["chunk_index"] == i + 1

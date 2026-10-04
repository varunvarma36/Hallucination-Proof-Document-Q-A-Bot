import pytest
from app.services.verifier import verifier

def test_citation_validation_success():
    retrieved_chunks = [
        {
            "id": "chk-1",
            "document_title": "Apple_2023_10K",
            "page_number": 24,
            "chunk_index": 2,
            "content": "Total net sales were $383,285 million in fiscal year 2023.",
            "similarity": 0.88
        }
    ]
    llm_output = {
        "supported": True,
        "answer": "Apple's net sales were $383,285 million in fiscal year 2023.",
        "confidence": 0.95,
        "citations": [
            {
                "document": "Apple_2023_10K",
                "page": 24,
                "chunk": "Chunk 2"
            }
        ]
    }
    verified, meta = verifier.verify_response(llm_output, retrieved_chunks, "What were Apple's sales?")
    assert verified["supported"] is True
    assert len(verified["citations"]) == 1
    assert verified["citations"][0]["page"] == 24
    assert meta["citations_verified"] is True
    assert meta["grounding_verdict"] == "VERIFIED_GROUNDED"

def test_citation_validation_nonexistent_page():
    retrieved_chunks = [
        {
            "id": "chk-1",
            "document_title": "Apple_2023_10K",
            "page_number": 24,
            "chunk_index": 2,
            "content": "Total net sales were $383,285 million.",
            "similarity": 0.88
        }
    ]
    # LLM hallucinates citation page 999 which was never retrieved!
    llm_output = {
        "supported": True,
        "answer": "Sales were $383,285 million.",
        "confidence": 0.95,
        "citations": [
            {
                "document": "Apple_2023_10K",
                "page": 999,
                "chunk": "Chunk 99"
            }
        ]
    }
    verified, meta = verifier.verify_response(llm_output, retrieved_chunks, "What were sales?")
    # Must reject fabricated citations
    assert verified["supported"] is False
    assert "I don't know based on the provided documents." in verified["answer"]
    assert verified["citations"] == []

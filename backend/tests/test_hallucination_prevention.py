import pytest
from app.services.verifier import verifier

def test_rejects_invented_financial_numbers():
    retrieved_chunks = [
        {
            "id": "chk-1",
            "document_title": "Microsoft_2023_10K",
            "page_number": 32,
            "chunk_index": 1,
            "content": "Total revenue was $211,915 million for fiscal year 2023.",
            "similarity": 0.85
        }
    ]
    # LLM hallucinates a fake number $999,999 million
    llm_output = {
        "supported": True,
        "answer": "Microsoft total revenue was $999,999 million according to the statement.",
        "confidence": 0.99,
        "citations": [
            {"document": "Microsoft_2023_10K", "page": 32, "chunk": "Chunk 1"}
        ]
    }
    verified, meta = verifier.verify_response(llm_output, retrieved_chunks, "What was Microsoft revenue?")
    
    # Must reject fabricated number!
    assert verified["supported"] is False
    assert verified["answer"] == "I don't know based on the provided documents."
    assert verified["citations"] == []
    assert meta["grounding_verdict"] == "REJECTED_HALLUCINATION"
    assert "999,999" in meta["unsupported_reason"]

def test_rejects_unsupported_claims():
    retrieved_chunks = [
        {
            "id": "chk-1",
            "document_title": "General_Report",
            "page_number": 1,
            "chunk_index": 1,
            "content": "The weather in Seattle was cloudy with mild temperatures throughout October.",
            "similarity": 0.40
        }
    ]
    # Completely unsupported answer
    llm_output = {
        "supported": True,
        "answer": "The enterprise acquired three quantum satellite manufacturers in Luxembourg.",
        "confidence": 0.80,
        "citations": [
            {"document": "General_Report", "page": 1, "chunk": "Chunk 1"}
        ]
    }
    verified, meta = verifier.verify_response(llm_output, retrieved_chunks, "Did the company acquire satellites?")
    assert verified["supported"] is False
    assert verified["answer"] == "I don't know based on the provided documents."

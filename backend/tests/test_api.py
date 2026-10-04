import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "VERIDOC AI" in data["service"]

def test_api_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["healthy", "degraded"]
    assert "groq" in data
    assert "supabase_db" in data
    assert "vector_store" in data

def test_api_collections():
    response = client.get("/api/collections")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_api_financebench_questions():
    response = client.get("/api/evaluation/questions")
    assert response.status_code == 200
    questions = response.json()
    assert len(questions) >= 3
    # Check structure
    q0 = questions[0]
    assert "question" in q0
    assert "ground_truth_answer" in q0
    assert "company" in q0

def test_api_settings():
    response = client.get("/api/settings")
    assert response.status_code == 200
    data = response.json()
    assert "TOP_K" in data
    assert "SIMILARITY_THRESHOLD" in data

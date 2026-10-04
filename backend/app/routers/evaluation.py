from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.services.financebench import financebench_service
from app.models.schemas import FinanceBenchQuestionItem, EvaluationRunRequest, EvaluationSummary

router = APIRouter(prefix="/api/evaluation", tags=["FinanceBench Evaluation"])

@router.get("/questions", response_model=List[FinanceBenchQuestionItem])
async def get_questions():
    samples = financebench_service.get_benchmark_questions()
    return [
        FinanceBenchQuestionItem(
            id=s["id"],
            company=s["company"],
            filing_type=s["filing_type"],
            year=s["year"],
            question=s["question"],
            ground_truth_answer=s["ground_truth_answer"],
            ground_truth_page=s.get("ground_truth_page"),
            question_type=s.get("question_type", "numerical"),
            is_out_of_domain=s.get("is_out_of_domain", False)
        )
        for s in samples
    ]

@router.post("/run", response_model=EvaluationSummary)
async def run_evaluation(payload: Optional[EvaluationRunRequest] = None):
    try:
        col_id = payload.collection_id if payload else None
        sample_ids = payload.sample_ids if payload else None
        top_k = payload.top_k if payload else None
        thresh = payload.similarity_threshold if payload else None

        summary = financebench_service.run_evaluation(
            collection_id=col_id,
            sample_ids=sample_ids,
            top_k=top_k,
            similarity_threshold=thresh
        )
        return summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Evaluation execution failed: {str(e)}")

@router.post("/bootstrap")
async def bootstrap_samples():
    """Bootstraps FinanceBench 10-K documents (Apple, Microsoft, Amazon) into collection."""
    try:
        col_id = financebench_service.ensure_sample_documents_ingested()
        return {"message": "FinanceBench sample documents successfully bootstrapped", "collection_id": col_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bootstrap failed: {str(e)}")

@router.get("/history")
async def get_history():
    from app.database.supabase_client import db
    return db.get_evaluation_history()

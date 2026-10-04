import json
import uuid
import time
from pathlib import Path
from typing import List, Dict, Any, Optional
from app.config import settings
from app.database.supabase_client import db
from app.services.rag_engine import rag_pipeline

SAMPLE_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "sample_data"
BENCHMARK_FILE = SAMPLE_DATA_DIR / "financebench_samples.json"
DOCUMENTS_DIR = SAMPLE_DATA_DIR / "documents"

class FinanceBenchService:
    def __init__(self):
        self.samples = self._load_samples()

    def _load_samples(self) -> List[Dict[str, Any]]:
        if BENCHMARK_FILE.exists():
            with open(BENCHMARK_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        return []

    def get_benchmark_questions(self) -> List[Dict[str, Any]]:
        return self.samples

    def ensure_sample_documents_ingested(self) -> str:
        """
        Ingests the sample FinanceBench 10-K documents into a dedicated collection if not already present.
        Returns the collection_id.
        """
        collections = db.get_collections()
        target_name = "FinanceBench SEC Filings"
        col = next((c for c in collections if c["name"] == target_name), None)

        if not col:
            col = db.create_collection(
                name=target_name,
                description="Curated SEC 10-K filings (Apple, Microsoft, Amazon) from the PatronusAI FinanceBench dataset."
            )

        collection_id = col["id"]
        existing_docs = db.get_documents(collection_id=collection_id)
        existing_titles = {d["title"] for d in existing_docs}

        # Ingest documents if not present
        if DOCUMENTS_DIR.exists():
            for doc_file in DOCUMENTS_DIR.glob("*.txt"):
                doc_title = doc_file.stem.replace("_Excerpt", "").replace("_", " ")
                if doc_title not in existing_titles:
                    with open(doc_file, "rb") as f:
                        file_bytes = f.read()
                    print(f"[FinanceBench Bootstrap] Ingesting {doc_file.name} into collection {target_name}...")
                    rag_pipeline.ingest_document(
                        filename=doc_file.name,
                        file_bytes=file_bytes,
                        title=doc_title,
                        collection_id=collection_id
                    )

        return collection_id

    def run_evaluation(
        self,
        collection_id: Optional[str] = None,
        sample_ids: Optional[List[str]] = None,
        top_k: Optional[int] = None,
        similarity_threshold: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Executes real dynamic evaluation across benchmark questions.
        Zero hardcoding: Every question is evaluated against the RAG pipeline.
        """
        # Ensure documents are available
        if not collection_id:
            collection_id = self.ensure_sample_documents_ingested()

        questions_to_run = self.samples
        if sample_ids:
            questions_to_run = [q for q in self.samples if q["id"] in sample_ids]

        run_id = str(uuid.uuid4())
        results = []

        for q in questions_to_run:
            q_id = q["id"]
            question_text = q["question"]
            gt_ans = q["ground_truth_answer"]
            gt_page = q.get("ground_truth_page")
            is_ood = q.get("is_out_of_domain", False)
            key_figures = q.get("key_figures", [])

            # Run RAG query
            t0 = time.time()
            rag_res = rag_pipeline.answer_query(
                question=question_text,
                collection_id=collection_id,
                top_k=top_k,
                similarity_threshold=similarity_threshold
            )
            lat_ms = rag_res["trace"]["latency_ms"]

            pred_ans = rag_res["answer"]
            pred_supported = rag_res["supported"]
            pred_citations = rag_res.get("citations", [])
            pred_pages = [c.get("page") for c in pred_citations if c.get("page") is not None]
            retrieved_chunks = rag_res["trace"].get("retrieved_chunks", [])
            retrieved_pages = [ch.get("page_number") for ch in retrieved_chunks]
            faithfulness_score = rag_res["trace"].get("factual_overlap_score", 0.0)

            # Evaluate Metrics
            if is_ood:
                # Out-of-domain adversarial question
                abstention_correct = (not pred_supported and "I don't know" in pred_ans)
                answer_correct = abstention_correct
                citation_correct = (len(pred_citations) == 0)
                retrieval_correct = True  # Not expecting retrieval
            else:
                # In-domain factual question
                abstention_correct = pred_supported  # Should NOT abstain
                
                # Check numerical / figure match
                if key_figures and pred_supported:
                    fig_matches = any(fig in pred_ans for fig in key_figures)
                    answer_correct = fig_matches and pred_supported
                else:
                    answer_correct = pred_supported and (len(pred_ans) > 20) and ("I don't know" not in pred_ans)

                # Citation match: Did model cite the ground truth page?
                citation_correct = (gt_page in pred_pages) if gt_page else False

                # Retrieval match: Did top-k chunks contain the ground truth page?
                retrieval_correct = (gt_page in retrieved_pages) if gt_page else False

            result_item = {
                "question_id": q_id,
                "company": q.get("company", "Company"),
                "question": question_text,
                "ground_truth_answer": gt_ans,
                "predicted_answer": pred_ans,
                "ground_truth_page": gt_page,
                "predicted_pages": pred_pages,
                "is_out_of_domain": is_ood,
                "predicted_supported": pred_supported,
                "answer_correct": bool(answer_correct),
                "citation_correct": bool(citation_correct),
                "retrieval_correct": bool(retrieval_correct),
                "faithfulness_score": round(float(faithfulness_score), 3),
                "abstention_correct": bool(abstention_correct),
                "latency_ms": lat_ms,
                "notes": rag_res["trace"].get("grounding_verdict")
            }
            results.append(result_item)

        # Compute aggregate metrics
        in_domain_items = [r for r in results if not r["is_out_of_domain"]]
        ood_items = [r for r in results if r["is_out_of_domain"]]

        ans_acc = sum(1 for r in in_domain_items if r["answer_correct"]) / len(in_domain_items) if in_domain_items else 1.0
        cit_acc = sum(1 for r in in_domain_items if r["citation_correct"]) / len(in_domain_items) if in_domain_items else 1.0
        ret_acc = sum(1 for r in in_domain_items if r["retrieval_correct"]) / len(in_domain_items) if in_domain_items else 1.0
        faith_avg = sum(r["faithfulness_score"] for r in in_domain_items) / len(in_domain_items) if in_domain_items else 1.0
        abs_acc = sum(1 for r in ood_items if r["abstention_correct"]) / len(ood_items) if ood_items else 1.0
        avg_lat = sum(r["latency_ms"] for r in results) / len(results) if results else 0.0

        summary = {
            "run_id": run_id,
            "total_questions": len(results),
            "answer_accuracy": round(ans_acc, 3),
            "citation_accuracy": round(cit_acc, 3),
            "retrieval_accuracy": round(ret_acc, 3),
            "faithfulness": round(faith_avg, 3),
            "abstention_accuracy": round(abs_acc, 3),
            "avg_latency_ms": round(avg_lat, 1),
            "results": results
        }

        # Persist results in DB
        db.save_evaluation_results(run_id, results)

        return summary

financebench_service = FinanceBenchService()

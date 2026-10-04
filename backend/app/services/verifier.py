import re
from typing import List, Dict, Any, Tuple

ABSTAIN_PHRASE = "I don't know based on the provided documents."

class HallucinationVerifier:
    def __init__(self, min_overlap_threshold: float = 0.35):
        self.min_overlap_threshold = min_overlap_threshold

    def verify_response(
        self,
        llm_output: Dict[str, Any],
        retrieved_chunks: List[Dict[str, Any]],
        question: str
    ) -> Tuple[Dict[str, Any], Dict[str, Any]]:
        """
        Executes strict second-layer verification:
        1. Checks whether citations actually exist in the retrieved set.
        2. Checks whether numerical & factual claims in the answer are supported by retrieved chunks.
        3. Rejects unsupported or hallucinated answers.
        
        Returns:
            (verified_response, verification_details)
        """
        is_supported = llm_output.get("supported", False)
        raw_answer = llm_output.get("answer", "").strip()
        citations = llm_output.get("citations", [])

        # If LLM itself abstained, accept abstention
        if not is_supported or ABSTAIN_PHRASE.lower() in raw_answer.lower():
            return {
                "supported": False,
                "answer": ABSTAIN_PHRASE,
                "confidence": 0.0,
                "citations": []
            }, {
                "citations_verified": True,
                "factual_overlap_score": 0.0,
                "grounding_verdict": "ABSTAINED_UNSUPPORTED",
                "unsupported_reason": "No sufficient evidence found in context"
            }

        # Step 1: Check whether citations actually exist in retrieved chunks
        valid_citations = []
        citations_pass = True
        citation_fail_reasons = []

        for cit in citations:
            c_doc = str(cit.get("document", "")).lower().strip()
            c_page = cit.get("page")

            # Check if this doc & page exist in retrieved chunks
            matching_chunk = None
            for chunk in retrieved_chunks:
                chunk_doc = str(chunk.get("document_title", "")).lower().strip()
                chunk_page = chunk.get("page_number")
                
                # Check document name match (substring or full)
                doc_matches = (c_doc in chunk_doc or chunk_doc in c_doc or "document" in c_doc)
                page_matches = (c_page is None or c_page == chunk_page)

                if doc_matches and page_matches:
                    matching_chunk = chunk
                    break

            if matching_chunk:
                # Find best matching quote in the chunk for evidence
                exact_quote = self._find_best_supporting_quote(raw_answer, matching_chunk.get("content", ""))
                valid_citations.append({
                    "document": matching_chunk.get("document_title", cit.get("document")),
                    "page": matching_chunk.get("page_number", cit.get("page", 1)),
                    "chunk": f"Chunk {matching_chunk.get('chunk_index', 1)}",
                    "exact_quote": exact_quote,
                    "similarity_score": matching_chunk.get("similarity", 0.0)
                })
            else:
                citations_pass = False
                citation_fail_reasons.append(f"Cited {c_doc} page {c_page} not found in retrieved chunks")

        # Step 2: Factual and numerical verification
        # Concatenate all retrieved chunk texts
        all_context_text = " ".join([ch.get("content", "") for ch in retrieved_chunks])
        
        # Check numbers in answer: Every distinct number in a financial answer MUST appear in evidence!
        answer_numbers = re.findall(r'\b\d+(?:,\d+)*(?:\.\d+)?%?\b', raw_answer)
        missing_numbers = []
        for num in answer_numbers:
            # Skip common small single digits like 1, 2, 3 unless percentage or decimal
            clean_num = num.replace(",", "").replace("%", "")
            if clean_num in ["1", "2", "3", "4", "5"] and "%" not in num and "." not in num:
                continue
            if num not in all_context_text and clean_num not in all_context_text:
                missing_numbers.append(num)

        # Lexical overlap score
        answer_words = [w.lower() for w in re.findall(r'\b[a-zA-Z]{4,}\b', raw_answer)]
        context_words = set([w.lower() for w in re.findall(r'\b[a-zA-Z]{4,}\b', all_context_text)])
        
        if answer_words:
            overlap_count = len([w for w in answer_words if w in context_words])
            overlap_score = overlap_count / len(answer_words)
        else:
            overlap_score = 1.0

        # Step 3: Decision Logic
        if missing_numbers:
            # Financial hallucination detected (invented numbers!)
            return {
                "supported": False,
                "answer": ABSTAIN_PHRASE,
                "confidence": 0.0,
                "citations": []
            }, {
                "citations_verified": citations_pass,
                "factual_overlap_score": round(overlap_score, 3),
                "grounding_verdict": "REJECTED_HALLUCINATION",
                "unsupported_reason": f"Unverified numbers in answer: {', '.join(missing_numbers[:3])}"
            }

        if overlap_score < self.min_overlap_threshold:
            # Low factual support
            return {
                "supported": False,
                "answer": ABSTAIN_PHRASE,
                "confidence": 0.0,
                "citations": []
            }, {
                "citations_verified": citations_pass,
                "factual_overlap_score": round(overlap_score, 3),
                "grounding_verdict": "REJECTED_UNSUPPORTED",
                "unsupported_reason": f"Factual grounding score {round(overlap_score, 2)} below threshold {self.min_overlap_threshold}"
            }

        if not valid_citations and citations:
            # LLM hallucinated citations
            return {
                "supported": False,
                "answer": ABSTAIN_PHRASE,
                "confidence": 0.0,
                "citations": []
            }, {
                "citations_verified": False,
                "factual_overlap_score": round(overlap_score, 3),
                "grounding_verdict": "REJECTED_INVALID_CITATIONS",
                "unsupported_reason": f"Invalid citations: {'; '.join(citation_fail_reasons)}"
            }

        # If LLM didn't return citations but answer is grounded, attach top retrieved chunk as citation
        if not valid_citations and retrieved_chunks:
            top_ch = retrieved_chunks[0]
            quote = self._find_best_supporting_quote(raw_answer, top_ch.get("content", ""))
            valid_citations.append({
                "document": top_ch.get("document_title", "Document"),
                "page": top_ch.get("page_number", 1),
                "chunk": f"Chunk {top_ch.get('chunk_index', 1)}",
                "exact_quote": quote,
                "similarity_score": top_ch.get("similarity", 0.0)
            })

        # All checks passed!
        return {
            "supported": True,
            "answer": raw_answer,
            "confidence": llm_output.get("confidence", 0.90),
            "citations": valid_citations
        }, {
            "citations_verified": True,
            "factual_overlap_score": round(overlap_score, 3),
            "grounding_verdict": "VERIFIED_GROUNDED",
            "unsupported_reason": None
        }

    def _find_best_supporting_quote(self, answer: str, chunk_content: str) -> str:
        """Extracts the sentence in chunk_content that has the highest semantic/token overlap with answer."""
        sentences = re.split(r'(?<=[.!?])\s+', chunk_content)
        answer_tokens = set(re.findall(r'\w+', answer.lower()))
        best_sent = ""
        max_score = -1

        for sent in sentences:
            sent_str = sent.strip()
            if len(sent_str) < 15:
                continue
            sent_tokens = set(re.findall(r'\w+', sent_str.lower()))
            overlap = len(answer_tokens.intersection(sent_tokens))
            if overlap > max_score:
                max_score = overlap
                best_sent = sent_str

        return best_sent if best_sent else (chunk_content[:200] + "...")

verifier = HallucinationVerifier()

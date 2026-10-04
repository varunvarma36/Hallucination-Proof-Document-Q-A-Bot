import re
from typing import List, Dict, Any
from app.config import settings

class DocumentChunker:
    def __init__(self, chunk_size: int = None, chunk_overlap: int = None):
        self.chunk_size = chunk_size or settings.CHUNK_SIZE
        self.chunk_overlap = chunk_overlap or settings.CHUNK_OVERLAP

    def chunk_pages(
        self,
        pages: List[Dict[str, Any]],
        document_id: str,
        collection_id: str,
        document_title: str
    ) -> List[Dict[str, Any]]:
        chunks = []
        global_chunk_idx = 1

        for page in pages:
            page_num = page["page_number"]
            page_text = page["text"].strip()
            if not page_text:
                continue

            page_chunks = self._split_text_with_overlap(page_text, self.chunk_size, self.chunk_overlap)
            
            for p_chunk in page_chunks:
                chunk_record = {
                    "document_id": document_id,
                    "collection_id": collection_id,
                    "page_number": page_num,
                    "chunk_index": global_chunk_idx,
                    "content": p_chunk,
                    "token_count": len(p_chunk.split()),
                    "metadata": {
                        "document_title": document_title,
                        "page_number": page_num,
                        "chunk_index": global_chunk_idx,
                        "char_length": len(p_chunk)
                    }
                }
                chunks.append(chunk_record)
                global_chunk_idx += 1

        return chunks

    def _split_text_with_overlap(self, text: str, chunk_size: int, chunk_overlap: int) -> List[str]:
        if len(text) <= chunk_size:
            return [text]

        # Break text by paragraphs
        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = []
        current_len = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            
            # If paragraph itself is longer than chunk_size, split by sentences
            if len(para) > chunk_size:
                sentences = re.split(r'(?<=[.!?])\s+', para)
                for sent in sentences:
                    sent = sent.strip()
                    if not sent:
                        continue
                    
                    # If single sentence itself is longer than chunk_size, split by words
                    if len(sent) > chunk_size:
                        words = sent.split()
                        w_chunk = []
                        w_len = 0
                        for w in words:
                            if w_len + len(w) > chunk_size and w_chunk:
                                chunk_str = " ".join(w_chunk)
                                chunks.append(chunk_str)
                                tail = self._get_overlap_text(chunk_str, chunk_overlap)
                                w_chunk = [tail, w] if tail else [w]
                                w_len = sum(len(x) for x in w_chunk) + len(w_chunk)
                            else:
                                w_chunk.append(w)
                                w_len += len(w) + 1
                        if w_chunk:
                            chunks.append(" ".join(w_chunk).strip())
                    else:
                        if current_len + len(sent) > chunk_size and current_chunk:
                            chunk_str = " ".join(current_chunk)
                            chunks.append(chunk_str)
                            tail = self._get_overlap_text(chunk_str, chunk_overlap)
                            current_chunk = [tail, sent] if tail else [sent]
                            current_len = sum(len(x) for x in current_chunk) + len(current_chunk)
                        else:
                            current_chunk.append(sent)
                            current_len += len(sent) + 1
            else:
                if current_len + len(para) > chunk_size and current_chunk:
                    chunk_str = "\n\n".join(current_chunk)
                    chunks.append(chunk_str)
                    tail = self._get_overlap_text(chunk_str, chunk_overlap)
                    current_chunk = [tail, para] if tail else [para]
                    current_len = sum(len(x) for x in current_chunk) + len(current_chunk)
                else:
                    current_chunk.append(para)
                    current_len += len(para) + 2

        if current_chunk:
            final_str = "\n\n".join(current_chunk).strip()
            if final_str:
                chunks.append(final_str)

        return chunks if chunks else [text]

    def _get_overlap_text(self, text: str, overlap_size: int) -> str:
        if len(text) <= overlap_size:
            return text
        tail = text[-overlap_size:]
        first_space = tail.find(" ")
        if first_space != -1 and first_space < len(tail) - 5:
            return tail[first_space+1:].strip()
        return tail.strip()

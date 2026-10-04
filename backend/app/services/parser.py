import io
import re
from pathlib import Path
from typing import List, Dict, Any
import pypdf
import docx

class DocumentParser:
    @staticmethod
    def parse_pdf(file_bytes: bytes) -> List[Dict[str, Any]]:
        """Extracts text page-by-page from a PDF byte stream preserving exact page numbers."""
        reader = pypdf.PdfReader(io.BytesIO(file_bytes))
        pages_data = []
        for idx, page in enumerate(reader.pages):
            page_num = idx + 1
            text = page.extract_text() or ""
            cleaned_text = "\n".join([line.strip() for line in text.splitlines() if line.strip()])
            pages_data.append({
                "page_number": page_num,
                "text": cleaned_text,
                "char_count": len(cleaned_text)
            })
        return pages_data

    @staticmethod
    def parse_docx(file_bytes: bytes) -> List[Dict[str, Any]]:
        """Extracts text from DOCX document, partitioning by explicit page breaks or logical page bounds."""
        doc = docx.Document(io.BytesIO(file_bytes))
        pages_data = []
        current_page_text = []
        current_page_num = 1

        for para in doc.paragraphs:
            text = para.text.strip()
            if not text:
                continue
            
            has_break = False
            for run in para.runs:
                if "\f" in run.text or any(child.tag.endswith("br") and child.attrib.get("{http://schemas.openxmlformats.org/wordprocessingml/2006/main}type") == "page" for child in run._r):
                    has_break = True
                    break

            current_page_text.append(text)
            total_chars = sum(len(t) for t in current_page_text)
            if has_break or total_chars > 3200:
                joined = "\n".join(current_page_text)
                pages_data.append({
                    "page_number": current_page_num,
                    "text": joined,
                    "char_count": len(joined)
                })
                current_page_num += 1
                current_page_text = []

        if current_page_text:
            joined = "\n".join(current_page_text)
            pages_data.append({
                "page_number": current_page_num,
                "text": joined,
                "char_count": len(joined)
            })

        return pages_data if pages_data else [{"page_number": 1, "text": "", "char_count": 0}]

    @staticmethod
    def parse_txt(file_bytes: bytes) -> List[Dict[str, Any]]:
        """Extracts text from TXT file, parsing explicit page markers if present or partitioning into logical pages."""
        text = file_bytes.decode("utf-8", errors="replace")
        
        # Check for explicit page markers like [Page: 12] or --- Page 12 ---
        marker_pattern = re.compile(r'(?:^|\n)(?:[-=]{3,}\s*Page\s*(\d+)\s*[-=]{3,}|\[Page:\s*(\d+)\])')
        matches = list(marker_pattern.finditer(text))

        if matches:
            pages_data = []
            for i, match in enumerate(matches):
                p1, p2 = match.groups()
                p_num = int(p1 or p2) if (p1 or p2) else (i + 1)
                start_pos = match.end()
                end_pos = matches[i + 1].start() if (i + 1 < len(matches)) else len(text)
                p_text = text[start_pos:end_pos].strip()
                if p_text:
                    pages_data.append({
                        "page_number": p_num,
                        "text": p_text,
                        "char_count": len(p_text)
                    })
            if pages_data:
                return pages_data

        # Fallback: Partition into logical pages (~3000 chars per page)
        lines = text.splitlines()
        pages_data = []
        current_page_num = 1
        current_page_lines = []
        current_len = 0

        for line in lines:
            current_page_lines.append(line)
            current_len += len(line) + 1
            if current_len >= 3000:
                joined = "\n".join(current_page_lines).strip()
                pages_data.append({
                    "page_number": current_page_num,
                    "text": joined,
                    "char_count": len(joined)
                })
                current_page_num += 1
                current_page_lines = []
                current_len = 0

        if current_page_lines:
            joined = "\n".join(current_page_lines).strip()
            pages_data.append({
                "page_number": current_page_num,
                "text": joined,
                "char_count": len(joined)
            })

        return pages_data if pages_data else [{"page_number": 1, "text": "", "char_count": 0}]

    @classmethod
    def parse_file(cls, filename: str, file_bytes: bytes) -> List[Dict[str, Any]]:
        suffix = Path(filename).suffix.lower()
        if suffix == ".pdf":
            return cls.parse_pdf(file_bytes)
        elif suffix in [".docx", ".doc"]:
            return cls.parse_docx(file_bytes)
        elif suffix in [".txt", ".csv", ".json", ".md"]:
            return cls.parse_txt(file_bytes)
        else:
            return cls.parse_txt(file_bytes)

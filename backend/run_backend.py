import sys
from pathlib import Path
import uvicorn

# Ensure backend root is in sys.path
backend_root = Path(__file__).resolve().parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.config import settings

if __name__ == "__main__":
    print(f"==================================================")
    print(f" Starting VERIDOC AI Backend on {settings.HOST}:{settings.PORT}")
    print(f" Groq Model: {settings.GROQ_MODEL}")
    print(f" Vector Backend: {settings.VECTOR_BACKEND}")
    print(f" Embedding Model: {settings.EMBEDDING_MODEL}")
    print(f"==================================================")
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=False
    )

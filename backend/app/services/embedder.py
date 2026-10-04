from typing import List
import numpy as np
from fastembed import TextEmbedding
from app.config import settings

class EmbeddingService:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
            cls._instance._init_model()
        return cls._instance

    def _init_model(self):
        # Initialize BAAI/bge-small-en-v1.5 (384-dimensional)
        model_name = settings.EMBEDDING_MODEL
        try:
            self.model = TextEmbedding(model_name=model_name)
            self.dimension = 384
            self.model_name = model_name
            self.is_ready = True
        except Exception as e:
            print(f"[Embedding Service Init Error] {e}. Trying default fastembed model.")
            self.model = TextEmbedding()
            self.dimension = 384
            self.model_name = "default"
            self.is_ready = True

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generates normalized vector embeddings for a list of texts."""
        if not texts:
            return []
        # fastembed yields an iterator of numpy ndarrays
        embeddings_generator = self.model.embed(texts)
        embeddings = []
        for emb in embeddings_generator:
            # emb is a numpy array
            arr = np.array(emb, dtype=np.float32)
            norm = np.linalg.norm(arr)
            if norm > 0:
                arr = arr / norm
            embeddings.append(arr.tolist())
        return embeddings

    def embed_query(self, query: str) -> List[float]:
        """Embeds a single search query."""
        results = self.embed_texts([query])
        return results[0] if results else [0.0] * self.dimension

embedder = EmbeddingService()

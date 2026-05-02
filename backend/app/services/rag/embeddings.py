import logging
from app.core.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    def __init__(self):
        self._model = None
        self._model_name = settings.EMBEDDING_MODEL
        self._dimension = settings.EMBEDDING_DIMENSION

    @property
    def dimension(self) -> int:
        return self._dimension

    def load_model(self):
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading embedding model: {self._model_name}")
            self._model = SentenceTransformer(self._model_name)
            self._dimension = self._model.get_sentence_embedding_dimension()
            logger.info(f"Embedding model loaded. Dimension: {self._dimension}")
        except Exception as e:
            logger.warning(f"Could not load embedding model: {e}. Using mock embeddings.")
            self._model = None

    def embed(self, texts: list[str]) -> list[list[float]]:
        if self._model is None:
            import hashlib
            results = []
            for text in texts:
                h = hashlib.sha256(text.encode()).hexdigest()
                vector = [int(h[i:i+2], 16) / 255.0 for i in range(0, self._dimension * 2, 2)]
                vector = vector[:self._dimension]
                while len(vector) < self._dimension:
                    vector.append(0.0)
                results.append(vector)
            return results
        return self._model.encode(texts, show_progress_bar=False).tolist()

    def embed_single(self, text: str) -> list[float]:
        return self.embed([text])[0]


embedding_service = EmbeddingService()

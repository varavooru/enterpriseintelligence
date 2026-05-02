import logging
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
)
from app.core.config import settings

logger = logging.getLogger(__name__)


class VectorStore:
    def __init__(self):
        self._client = None
        self._collection = settings.QDRANT_COLLECTION

    @property
    def client(self) -> QdrantClient:
        if self._client is None:
            try:
                self._client = QdrantClient(
                    host=settings.QDRANT_HOST,
                    port=settings.QDRANT_PORT,
                )
                self._ensure_collection()
            except Exception as e:
                logger.warning(f"Could not connect to Qdrant: {e}")
                raise
        return self._client

    def _ensure_collection(self):
        collections = self._client.get_collections().collections
        exists = any(c.name == self._collection for c in collections)
        if not exists:
            self._client.create_collection(
                collection_name=self._collection,
                vectors_config=VectorParams(
                    size=settings.EMBEDDING_DIMENSION,
                    distance=Distance.COSINE,
                ),
            )
            logger.info(f"Created Qdrant collection: {self._collection}")

    def upsert(self, points: list[dict]):
        """Upsert points. Each dict: {id, vector, payload}"""
        qdrant_points = [
            PointStruct(
                id=p["id"],
                vector=p["vector"],
                payload=p["payload"],
            )
            for p in points
        ]
        self.client.upsert(
            collection_name=self._collection,
            points=qdrant_points,
        )

    def search(
        self,
        query_vector: list[float],
        limit: int = 10,
        score_threshold: float = 0.3,
        filters: dict | None = None,
    ) -> list[dict]:
        qdrant_filter = None
        if filters:
            conditions = []
            for key, value in filters.items():
                conditions.append(FieldCondition(key=key, match=MatchValue(value=value)))
            qdrant_filter = Filter(must=conditions)

        results = self.client.search(
            collection_name=self._collection,
            query_vector=query_vector,
            limit=limit,
            score_threshold=score_threshold,
            query_filter=qdrant_filter,
        )

        return [
            {
                "id": hit.id,
                "score": hit.score,
                "payload": hit.payload,
            }
            for hit in results
        ]

    def delete_by_document(self, document_id: int):
        self.client.delete(
            collection_name=self._collection,
            points_selector=Filter(
                must=[FieldCondition(key="document_id", match=MatchValue(value=document_id))]
            ),
        )

    def get_collection_info(self) -> dict:
        try:
            info = self.client.get_collection(self._collection)
            return {
                "name": self._collection,
                "vectors_count": info.vectors_count,
                "points_count": info.points_count,
                "status": info.status.value,
            }
        except Exception:
            return {"name": self._collection, "status": "unavailable"}


vector_store = VectorStore()

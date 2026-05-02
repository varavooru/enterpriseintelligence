import hashlib
import logging
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import async_session
from app.models.data_source import DataSource
from app.models.document import Document
from app.services.data_sources.registry import get_connector
from app.services.rag.chunker import chunker
from app.services.rag.embeddings import embedding_service
from app.services.rag.vector_store import vector_store
from app.storage.local import get_storage

logger = logging.getLogger(__name__)


async def run_ingestion(data_source_id: int, tenant_id: int):
    async with async_session() as db:
        try:
            result = await db.execute(
                select(DataSource).where(DataSource.id == data_source_id, DataSource.tenant_id == tenant_id)
            )
            ds = result.scalar_one_or_none()
            if not ds:
                logger.error(f"Data source {data_source_id} not found")
                return

            connector = get_connector(ds.source_type, ds.config)
            storage = get_storage()

            doc_count = 0
            async for raw_doc in connector.fetch_documents():
                try:
                    content_hash = hashlib.sha256(raw_doc["content"].encode()).hexdigest()

                    existing = await db.execute(
                        select(Document).where(
                            Document.tenant_id == tenant_id,
                            Document.data_source_id == data_source_id,
                            Document.content_hash == content_hash,
                        )
                    )
                    if existing.scalar_one_or_none():
                        continue

                    storage_path = f"documents/tenant_{tenant_id}/{data_source_id}/{content_hash}.txt"
                    await storage.save(storage_path, raw_doc["content"].encode())

                    doc = Document(
                        tenant_id=tenant_id,
                        data_source_id=data_source_id,
                        title=raw_doc["title"],
                        content_type=raw_doc.get("content_type", "text"),
                        storage_path=storage_path,
                        content_hash=content_hash,
                        metadata_=raw_doc.get("metadata", {}),
                        source_url=raw_doc.get("source_url"),
                        status="processing",
                    )
                    db.add(doc)
                    await db.flush()
                    await db.refresh(doc)

                    chunks = chunker.chunk_text(
                        raw_doc["content"],
                        metadata={
                            "document_id": doc.id, "title": doc.title,
                            "source_url": doc.source_url, "data_source_id": data_source_id,
                            "tenant_id": tenant_id,
                        },
                    )

                    if chunks:
                        texts = [c["text"] for c in chunks]
                        embeddings = embedding_service.embed(texts)

                        points = []
                        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                            point_id = int(hashlib.md5(f"{doc.id}_{i}".encode()).hexdigest()[:15], 16)
                            points.append({
                                "id": point_id,
                                "vector": embedding,
                                "payload": {
                                    "tenant_id": tenant_id,
                                    "document_id": doc.id,
                                    "data_source_id": data_source_id,
                                    "title": doc.title,
                                    "text": chunk["text"],
                                    "chunk_index": chunk["chunk_index"],
                                    "source_url": doc.source_url,
                                    "source": ds.name,
                                },
                            })

                        try:
                            vector_store.upsert(points)
                        except Exception as e:
                            logger.warning(f"Vector store upsert failed: {e}")

                    doc.chunk_count = len(chunks)
                    doc.status = "indexed"
                    doc_count += 1
                    await db.commit()

                except Exception as e:
                    logger.error(f"Error processing document: {e}")
                    await db.rollback()
                    continue

            ds.status = "ready"
            ds.last_ingested_at = datetime.now(timezone.utc)
            ds.document_count = doc_count
            await db.commit()
            logger.info(f"Ingestion complete for data source {data_source_id}: {doc_count} documents")

        except Exception as e:
            logger.error(f"Ingestion failed for data source {data_source_id}: {e}")
            async with async_session() as db2:
                result = await db2.execute(select(DataSource).where(DataSource.id == data_source_id))
                ds = result.scalar_one_or_none()
                if ds:
                    ds.status = "error"
                    ds.error_message = str(e)
                    await db2.commit()

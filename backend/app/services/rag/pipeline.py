import json
import logging
from typing import AsyncGenerator, Optional
from anthropic import AsyncAnthropic
from app.core.config import settings
from app.services.rag.embeddings import embedding_service
from app.services.rag.vector_store import vector_store
from app.services.knowledge_graph.service import kg_manager

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Prime Enterprise Intelligence, an AI-powered enterprise intelligence assistant.
Your role is to analyze internal and external data — regulations, laws, news, policies, and more — to provide actionable intelligence.

When answering questions:
1. Use the provided context to formulate accurate, well-sourced answers
2. Always cite your sources by referencing document titles and relevant passages
3. If the knowledge graph provides relevant business context, incorporate it into your analysis
4. Highlight potential impacts on business units when relevant
5. If the available context is insufficient, clearly state what information is missing
6. Be precise, professional, and actionable in your responses

Format citations as [Source: document_title] inline with your response."""


class RAGPipeline:
    def __init__(self):
        self._anthropic = None

    @property
    def anthropic(self) -> AsyncAnthropic:
        if self._anthropic is None:
            self._anthropic = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        return self._anthropic

    async def answer_question(
        self,
        question: str,
        conversation_id: int,
        user_id: int,
        tenant_id: int,
        filters: Optional[dict] = None,
    ) -> dict:
        query_embedding = embedding_service.embed_single(question)

        search_filters = dict(filters or {})
        search_filters["tenant_id"] = tenant_id

        search_results = []
        try:
            search_results = vector_store.search(
                query_vector=query_embedding, limit=10, filters=search_filters,
            )
        except Exception as e:
            logger.warning(f"Vector search failed: {e}")

        context_parts = []
        if search_results:
            context_parts.append("=== Retrieved Documents ===")
            for i, result in enumerate(search_results, 1):
                payload = result["payload"]
                context_parts.append(
                    f"\n[Document {i}] {payload.get('title', 'Unknown')}\n"
                    f"Source: {payload.get('source', 'Unknown')}\n"
                    f"Content: {payload.get('text', '')}\n"
                    f"Relevance: {result['score']:.2f}"
                )

        kg = kg_manager.get_service(tenant_id)
        kg_context = kg.get_context_for_query(question)
        if kg_context:
            context_parts.append(f"\n{kg_context}")

        full_context = "\n".join(context_parts) if context_parts else "No relevant documents found in the knowledge base."

        message_content = f"Context:\n{full_context}\n\nQuestion: {question}\n\nProvide a comprehensive answer based on the context above. Cite sources where applicable."

        try:
            response = await self.anthropic.messages.create(
                model=settings.ANTHROPIC_MODEL, max_tokens=4096,
                system=SYSTEM_PROMPT, messages=[{"role": "user", "content": message_content}],
            )
            answer = response.content[0].text
        except Exception as e:
            logger.error(f"Anthropic API error: {e}")
            answer = f"I was unable to generate a response due to an API error. The retrieved context includes {len(search_results)} relevant documents. Please check the API configuration and try again."

        sources = [
            {
                "document_id": r["payload"].get("document_id", 0),
                "document_title": r["payload"].get("title", "Unknown"),
                "chunk_text": r["payload"].get("text", "")[:300],
                "relevance_score": r["score"],
                "source_url": r["payload"].get("source_url"),
            }
            for r in search_results
        ]

        return {"answer": answer, "sources": sources}

    async def answer_question_stream(
        self,
        question: str,
        conversation_id: int,
        user_id: int,
        tenant_id: int,
        filters: Optional[dict] = None,
        db=None,
    ) -> AsyncGenerator[str, None]:
        query_embedding = embedding_service.embed_single(question)

        search_filters = dict(filters or {})
        search_filters["tenant_id"] = tenant_id

        search_results = []
        try:
            search_results = vector_store.search(query_vector=query_embedding, limit=10, filters=search_filters)
        except Exception as e:
            logger.warning(f"Vector search failed: {e}")

        context_parts = []
        if search_results:
            context_parts.append("=== Retrieved Documents ===")
            for i, result in enumerate(search_results, 1):
                payload = result["payload"]
                context_parts.append(f"\n[Document {i}] {payload.get('title', 'Unknown')}\nContent: {payload.get('text', '')}")

        kg = kg_manager.get_service(tenant_id)
        kg_context = kg.get_context_for_query(question)
        if kg_context:
            context_parts.append(f"\n{kg_context}")

        full_context = "\n".join(context_parts) if context_parts else "No relevant documents found."

        sources = [
            {"document_id": r["payload"].get("document_id", 0), "document_title": r["payload"].get("title", "Unknown"), "chunk_text": r["payload"].get("text", "")[:300], "relevance_score": r["score"]}
            for r in search_results
        ]
        yield f"data: {json.dumps({'type': 'sources', 'sources': sources})}\n\n"

        message_content = f"Context:\n{full_context}\n\nQuestion: {question}"

        try:
            async with self.anthropic.messages.stream(
                model=settings.ANTHROPIC_MODEL, max_tokens=4096,
                system=SYSTEM_PROMPT, messages=[{"role": "user", "content": message_content}],
            ) as stream:
                full_answer = ""
                async for text in stream.text_stream:
                    full_answer += text
                    yield f"data: {json.dumps({'type': 'text', 'text': text})}\n\n"

                if db:
                    from app.models.query import Query
                    query = Query(
                        tenant_id=tenant_id, conversation_id=conversation_id,
                        user_id=user_id, question=question,
                        answer=full_answer, sources=[s for s in sources],
                    )
                    db.add(query)
                    await db.commit()
        except Exception as e:
            logger.error(f"Streaming error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'error': str(e)})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"


rag_pipeline = RAGPipeline()

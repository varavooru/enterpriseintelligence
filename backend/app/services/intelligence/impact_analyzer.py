import logging
from typing import Optional
from anthropic import AsyncAnthropic
from app.core.config import settings
from app.services.rag.embeddings import embedding_service
from app.services.rag.vector_store import vector_store
from app.services.knowledge_graph.service import kg_manager

logger = logging.getLogger(__name__)

IMPACT_SYSTEM_PROMPT = """You are an enterprise impact analysis engine. Your job is to analyze how changes in regulations, policies, news, or other events impact specific business units, products, and processes.

For each impacted entity, provide:
1. Impact level (low/medium/high/critical)
2. Impact score (0.0 to 1.0)
3. A clear summary of the impact
4. Detailed analysis
5. Actionable recommendations

Structure your response as JSON with this format:
{
  "overall_summary": "...",
  "impacts": [
    {
      "entity_id": "...",
      "entity_name": "...",
      "entity_type": "...",
      "impact_level": "high",
      "impact_score": 0.8,
      "summary": "...",
      "details": "...",
      "recommendations": ["...", "..."],
      "sources": [{"title": "...", "relevance": 0.9}]
    }
  ]
}"""


class ImpactAnalyzer:
    def __init__(self):
        self._anthropic = None

    @property
    def anthropic(self) -> AsyncAnthropic:
        if self._anthropic is None:
            self._anthropic = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        return self._anthropic

    async def analyze(
        self,
        query: str,
        tenant_id: int,
        entity_type: Optional[str] = None,
        entity_ids: Optional[list[str]] = None,
        depth: str = "standard",
    ) -> dict:
        query_embedding = embedding_service.embed_single(query)
        search_results = []
        try:
            search_results = vector_store.search(
                query_vector=query_embedding,
                limit=15 if depth == "deep" else 10,
                filters={"tenant_id": tenant_id},
            )
        except Exception as e:
            logger.warning(f"Vector search failed: {e}")

        kg = kg_manager.get_service(tenant_id)
        kg_context = kg.get_context_for_query(query)
        graph = kg.get_graph()

        target_entities = []
        if entity_ids:
            for eid in entity_ids:
                result = kg.get_entity_by_id(eid)
                if result:
                    target_entities.append({"type": result[0], "entity": result[1]})
        elif entity_type:
            for entity in graph["entities"].get(entity_type, []):
                target_entities.append({"type": entity_type, "entity": entity})
        else:
            for etype, entities in graph["entities"].items():
                for entity in entities:
                    target_entities.append({"type": etype, "entity": entity})

        doc_context = "\n\n".join(
            f"[{r['payload'].get('title', 'Unknown')}]: {r['payload'].get('text', '')}"
            for r in search_results
        ) if search_results else ""

        entity_context = "\n".join(
            f"- [{e['type']}] {e['entity'].get('name', '?')}: {e['entity'].get('description', 'No description')}"
            for e in target_entities
        )

        prompt = f"""Analyze the following query for its impact on the listed enterprise entities.

Query/Change: {query}

Retrieved Intelligence:
{doc_context}

Knowledge Graph Context:
{kg_context}

Target Entities to Analyze:
{entity_context}

Provide a comprehensive impact analysis as JSON."""

        try:
            response = await self.anthropic.messages.create(
                model=settings.ANTHROPIC_MODEL, max_tokens=4096,
                system=IMPACT_SYSTEM_PROMPT,
                messages=[{"role": "user", "content": prompt}],
            )
            import json
            text = response.content[0].text
            start = text.find("{")
            end = text.rfind("}") + 1
            if start >= 0 and end > start:
                result = json.loads(text[start:end])
            else:
                result = {"overall_summary": text, "impacts": []}
        except Exception as e:
            logger.error(f"Impact analysis failed: {e}")
            result = {"overall_summary": f"Impact analysis could not be completed: {str(e)}", "impacts": []}

        return result


impact_analyzer = ImpactAnalyzer()

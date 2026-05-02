import json
import logging
from anthropic import AsyncAnthropic
from app.core.config import settings
from app.services.rag.embeddings import embedding_service
from app.services.rag.vector_store import vector_store
from app.services.knowledge_graph.service import kg_manager

logger = logging.getLogger(__name__)

TOOLS = [
    {
        "name": "search_documents",
        "description": "Search the enterprise document store for relevant information.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "The search query"},
                "limit": {"type": "integer", "description": "Max results", "default": 5},
            },
            "required": ["query"],
        },
    },
    {
        "name": "query_knowledge_graph",
        "description": "Query the enterprise knowledge graph for business entities and relationships.",
        "input_schema": {
            "type": "object",
            "properties": {
                "entity_id": {"type": "string", "description": "Entity ID to look up"},
                "action": {"type": "string", "enum": ["get_entity", "get_related", "get_impact", "get_full_graph"]},
            },
            "required": ["action"],
        },
    },
    {
        "name": "analyze_impact",
        "description": "Analyze how a change impacts business units and processes.",
        "input_schema": {
            "type": "object",
            "properties": {
                "change_description": {"type": "string"},
                "target_entity_ids": {"type": "array", "items": {"type": "string"}},
            },
            "required": ["change_description"],
        },
    },
    {
        "name": "generate_report_section",
        "description": "Generate a structured section for an intelligence report.",
        "input_schema": {
            "type": "object",
            "properties": {
                "section_title": {"type": "string"},
                "section_type": {"type": "string", "enum": ["executive_summary", "impact_analysis", "recommendations", "detailed_findings", "risk_assessment"]},
                "context": {"type": "string"},
            },
            "required": ["section_title", "section_type", "context"],
        },
    },
]

AGENT_SYSTEM_PROMPT = """You are Prime Enterprise Intelligence Agent, an AI-powered analyst that helps enterprises understand the impact of regulations, policies, news, and other changes on their operations.

You have access to tools to search documents, query the knowledge graph, analyze impacts, and generate report sections. Use these tools strategically to provide comprehensive, well-sourced intelligence.

Always:
1. Start by searching for relevant documents and knowledge graph data
2. Cross-reference information across multiple sources
3. Provide specific, actionable insights
4. Cite your sources
5. Consider impacts across all relevant business units"""


class AgentOrchestrator:
    def __init__(self, tenant_id: int):
        self.tenant_id = tenant_id
        self._anthropic = None

    @property
    def anthropic(self) -> AsyncAnthropic:
        if self._anthropic is None:
            self._anthropic = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        return self._anthropic

    async def _handle_tool_call(self, tool_name: str, tool_input: dict) -> str:
        kg = kg_manager.get_service(self.tenant_id)

        if tool_name == "search_documents":
            embedding = embedding_service.embed_single(tool_input["query"])
            try:
                results = vector_store.search(
                    query_vector=embedding, limit=tool_input.get("limit", 5),
                    filters={"tenant_id": self.tenant_id},
                )
                return json.dumps([
                    {"title": r["payload"].get("title", "Unknown"), "text": r["payload"].get("text", "")[:500], "source": r["payload"].get("source", ""), "score": r["score"]}
                    for r in results
                ])
            except Exception as e:
                return json.dumps({"error": str(e)})

        elif tool_name == "query_knowledge_graph":
            action = tool_input["action"]
            entity_id = tool_input.get("entity_id")
            if action == "get_entity" and entity_id:
                result = kg.get_entity_by_id(entity_id)
                return json.dumps({"type": result[0], "entity": result[1]} if result else {"error": "Not found"})
            elif action == "get_related" and entity_id:
                return json.dumps(kg.get_related_entities(entity_id), default=str)
            elif action == "get_impact" and entity_id:
                return json.dumps(kg.analyze_impact(entity_id), default=str)
            elif action == "get_full_graph":
                graph = kg.get_graph()
                return json.dumps({
                    "entity_types": {k: len(v) for k, v in graph["entities"].items()},
                    "entities": {k: [{"id": e["id"], "name": e["name"]} for e in v] for k, v in graph["entities"].items()},
                    "relationship_count": len(graph["relationships"]),
                    "rule_count": len(graph["rules"]),
                }, default=str)
            return json.dumps({"error": "Invalid action"})

        elif tool_name == "analyze_impact":
            change = tool_input["change_description"]
            kg_context = kg.get_context_for_query(change)
            embedding = embedding_service.embed_single(change)
            try:
                docs = vector_store.search(query_vector=embedding, limit=5, filters={"tenant_id": self.tenant_id})
                doc_context = "\n".join(r["payload"].get("text", "") for r in docs)
            except Exception:
                doc_context = ""
            return json.dumps({"knowledge_graph_context": kg_context[:2000], "relevant_documents": doc_context[:2000], "target_entities": tool_input.get("target_entity_ids") or "all"})

        elif tool_name == "generate_report_section":
            return json.dumps({"section_title": tool_input["section_title"], "section_type": tool_input["section_type"], "context_provided": True})

        return json.dumps({"error": f"Unknown tool: {tool_name}"})

    async def run(self, task: str, max_turns: int = 10) -> dict:
        messages = [{"role": "user", "content": task}]
        all_tool_calls = []

        for turn in range(max_turns):
            try:
                response = await self.anthropic.messages.create(
                    model=settings.ANTHROPIC_MODEL, max_tokens=4096,
                    system=AGENT_SYSTEM_PROMPT, tools=TOOLS, messages=messages,
                )
            except Exception as e:
                logger.error(f"Agent API call failed: {e}")
                return {"result": f"Agent encountered an error: {str(e)}", "tool_calls": all_tool_calls, "turns": turn + 1}

            if response.stop_reason == "end_turn":
                final_text = ""
                for block in response.content:
                    if hasattr(block, "text"):
                        final_text += block.text
                return {"result": final_text, "tool_calls": all_tool_calls, "turns": turn + 1}

            if response.stop_reason == "tool_use":
                messages.append({"role": "assistant", "content": response.content})
                tool_results = []
                for block in response.content:
                    if block.type == "tool_use":
                        all_tool_calls.append({"tool": block.name, "input": block.input})
                        result = await self._handle_tool_call(block.name, block.input)
                        tool_results.append({"type": "tool_result", "tool_use_id": block.id, "content": result})
                messages.append({"role": "user", "content": tool_results})

        return {"result": "Agent reached maximum number of reasoning turns.", "tool_calls": all_tool_calls, "turns": max_turns}

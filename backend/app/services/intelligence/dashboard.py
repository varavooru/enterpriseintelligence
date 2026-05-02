from sqlalchemy import select, func
from app.core.database import async_session
from app.models.data_source import DataSource
from app.models.document import Document
from app.models.query import Query, Conversation
from app.models.report import Report
from app.services.knowledge_graph.service import kg_manager


async def get_dashboard_summary(user_id: int, tenant_id: int) -> dict:
    async with async_session() as db:
        ds_result = await db.execute(
            select(func.count(DataSource.id)).where(DataSource.tenant_id == tenant_id)
        )
        total_sources = ds_result.scalar() or 0

        doc_result = await db.execute(
            select(func.count(Document.id)).where(Document.tenant_id == tenant_id)
        )
        total_documents = doc_result.scalar() or 0

        query_result = await db.execute(
            select(func.count(Query.id)).where(Query.tenant_id == tenant_id)
        )
        total_queries = query_result.scalar() or 0

        report_result = await db.execute(
            select(func.count(Report.id)).where(Report.tenant_id == tenant_id)
        )
        total_reports = report_result.scalar() or 0

        recent_queries_result = await db.execute(
            select(Query)
            .where(Query.tenant_id == tenant_id)
            .order_by(Query.created_at.desc())
            .limit(5)
        )
        recent_queries = [
            {"id": q.id, "question": q.question[:100], "created_at": q.created_at.isoformat() if q.created_at else None}
            for q in recent_queries_result.scalars().all()
        ]

        active_sources_result = await db.execute(
            select(DataSource).where(DataSource.tenant_id == tenant_id, DataSource.is_active == True).limit(10)
        )
        active_sources = [
            {"id": ds.id, "name": ds.name, "source_type": ds.source_type, "status": ds.status, "document_count": ds.document_count}
            for ds in active_sources_result.scalars().all()
        ]

        kg = kg_manager.get_service(tenant_id)
        graph = kg.get_graph()
        kg_stats = {
            "total_entities": sum(len(v) for v in graph.get("entities", {}).values()),
            "total_relationships": len(graph.get("relationships", [])),
            "total_rules": len(graph.get("rules", [])),
            "entity_types": {k: len(v) for k, v in graph.get("entities", {}).items()},
        }

        return {
            "stats": {"total_data_sources": total_sources, "total_documents": total_documents, "total_queries": total_queries, "total_reports": total_reports},
            "recent_queries": recent_queries,
            "active_sources": active_sources,
            "knowledge_graph": kg_stats,
        }

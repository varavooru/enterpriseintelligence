import logging
from sqlalchemy import select
from app.core.database import async_session
from app.models.report import Report
from app.services.agents.orchestrator import AgentOrchestrator

logger = logging.getLogger(__name__)

REPORT_TEMPLATES = {
    "regulatory_impact": {
        "sections": [
            {"title": "Executive Summary", "type": "executive_summary"},
            {"title": "Regulatory Overview", "type": "detailed_findings"},
            {"title": "Impact Analysis by Business Unit", "type": "impact_analysis"},
            {"title": "Risk Assessment", "type": "risk_assessment"},
            {"title": "Recommendations", "type": "recommendations"},
        ],
    },
    "policy_analysis": {
        "sections": [
            {"title": "Executive Summary", "type": "executive_summary"},
            {"title": "Policy Overview", "type": "detailed_findings"},
            {"title": "Compliance Impact", "type": "impact_analysis"},
            {"title": "Implementation Recommendations", "type": "recommendations"},
        ],
    },
    "executive_summary": {
        "sections": [
            {"title": "Key Findings", "type": "executive_summary"},
            {"title": "Critical Impacts", "type": "impact_analysis"},
            {"title": "Recommended Actions", "type": "recommendations"},
        ],
    },
    "custom": {
        "sections": [
            {"title": "Analysis", "type": "detailed_findings"},
            {"title": "Findings", "type": "impact_analysis"},
            {"title": "Recommendations", "type": "recommendations"},
        ],
    },
}


async def generate_report(report_id: int, tenant_id: int):
    async with async_session() as db:
        try:
            result = await db.execute(select(Report).where(Report.id == report_id))
            report = result.scalar_one_or_none()
            if not report:
                logger.error(f"Report {report_id} not found")
                return

            report.status = "generating"
            await db.commit()

            template = REPORT_TEMPLATES.get(report.report_type, REPORT_TEMPLATES["custom"])
            params = report.parameters

            task = f"""Generate a comprehensive {report.report_type.replace('_', ' ')} report titled "{report.title}".

Parameters: {params}

Generate each section with detailed, well-sourced analysis. Use the available tools to search for relevant documents, query the knowledge graph, and perform impact analysis.

Structure the report with these sections:
{chr(10).join(f'- {s["title"]} ({s["type"]})' for s in template["sections"])}

Provide a complete, professional report with citations."""

            orchestrator = AgentOrchestrator(tenant_id=tenant_id)
            agent_result = await orchestrator.run(task, max_turns=15)

            sections = [
                {"index": i, "title": s["title"], "type": s["type"], "content": ""}
                for i, s in enumerate(template["sections"])
            ]

            report.content = agent_result["result"]
            report.sections = sections
            report.status = "completed"
            await db.commit()
            logger.info(f"Report {report_id} generated successfully")

        except Exception as e:
            logger.error(f"Report generation failed for {report_id}: {e}")
            async with async_session() as db2:
                result = await db2.execute(select(Report).where(Report.id == report_id))
                report = result.scalar_one_or_none()
                if report:
                    report.status = "error"
                    await db2.commit()

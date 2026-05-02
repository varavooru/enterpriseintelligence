from fastapi import APIRouter, Depends
from app.core.security import get_current_user, require_role
from app.models.user import User
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])


class ImpactAnalysisRequest(BaseModel):
    query: str
    entity_type: Optional[str] = None
    entity_ids: Optional[list[str]] = None
    analysis_depth: str = "standard"


class ImpactResult(BaseModel):
    entity_id: str
    entity_name: str
    entity_type: str
    impact_level: str
    impact_score: float
    summary: str
    details: str
    recommendations: list[str]
    sources: list[dict]


class ImpactAnalysisResponse(BaseModel):
    query: str
    overall_summary: str
    impacts: list[ImpactResult]
    processing_time_ms: int


@router.post("/analyze-impact", response_model=ImpactAnalysisResponse)
async def analyze_impact(
    request: ImpactAnalysisRequest,
    current_user: User = Depends(require_role(["admin", "analyst"])),
):
    from app.services.intelligence.impact_analyzer import impact_analyzer
    import time

    start = time.time()
    result = await impact_analyzer.analyze(
        query=request.query,
        tenant_id=current_user.tenant_id,
        entity_type=request.entity_type,
        entity_ids=request.entity_ids,
        depth=request.analysis_depth,
    )
    processing_time = int((time.time() - start) * 1000)

    return ImpactAnalysisResponse(
        query=request.query,
        overall_summary=result["overall_summary"],
        impacts=result["impacts"],
        processing_time_ms=processing_time,
    )


@router.get("/dashboard")
async def get_dashboard_data(
    current_user: User = Depends(get_current_user),
):
    from app.services.intelligence.dashboard import get_dashboard_summary
    return await get_dashboard_summary(current_user.id, current_user.tenant_id)

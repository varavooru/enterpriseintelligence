from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class ReportCreate(BaseModel):
    title: str
    report_type: str  # regulatory_impact, policy_analysis, executive_summary, custom
    template: Optional[str] = None
    parameters: dict = {}


class ReportResponse(BaseModel):
    id: int
    title: str
    report_type: str
    template: Optional[str]
    parameters: dict
    content: Optional[str]
    sections: list
    status: str
    storage_path: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}

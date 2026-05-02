from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class DataSourceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    source_type: str
    config: dict = {}
    schedule: Optional[str] = None


class DataSourceUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    config: Optional[dict] = None
    is_active: Optional[bool] = None
    schedule: Optional[str] = None


class DataSourceResponse(BaseModel):
    id: int
    name: str
    description: Optional[str]
    source_type: str
    config: dict
    is_active: bool
    schedule: Optional[str]
    last_ingested_at: Optional[datetime]
    document_count: int
    status: str
    error_message: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class IngestRequest(BaseModel):
    data_source_id: int

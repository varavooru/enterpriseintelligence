from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class QuestionRequest(BaseModel):
    question: str
    conversation_id: Optional[int] = None
    filters: Optional[dict] = None  # optional metadata filters for retrieval


class SourceReference(BaseModel):
    document_id: int
    document_title: str
    chunk_text: str
    relevance_score: float
    source_url: Optional[str] = None


class AnswerResponse(BaseModel):
    answer: str
    sources: list[SourceReference]
    conversation_id: int
    query_id: int
    processing_time_ms: int


class ConversationResponse(BaseModel):
    id: int
    title: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class QueryHistoryItem(BaseModel):
    id: int
    question: str
    answer: Optional[str]
    sources: list
    created_at: datetime

    model_config = {"from_attributes": True}

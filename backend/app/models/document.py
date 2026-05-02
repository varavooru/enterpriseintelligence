from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Text, func
from app.core.database import Base


class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    data_source_id = Column(Integer, ForeignKey("data_sources.id"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    content_type = Column(String(100), nullable=True)
    storage_path = Column(String(1000), nullable=True)
    content_hash = Column(String(64), nullable=True)
    chunk_count = Column(Integer, default=0)
    metadata_ = Column("metadata", JSON, default={})
    status = Column(String(50), default="pending")
    error_message = Column(Text, nullable=True)
    source_url = Column(String(2000), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

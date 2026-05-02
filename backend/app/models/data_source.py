from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON, ForeignKey, func
from app.core.database import Base


class DataSource(Base):
    __tablename__ = "data_sources"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    source_type = Column(String(50), nullable=False)
    config = Column(JSON, nullable=False, default={})
    is_active = Column(Boolean, default=True)
    schedule = Column(String(100), nullable=True)
    last_ingested_at = Column(DateTime(timezone=True), nullable=True)
    document_count = Column(Integer, default=0)
    status = Column(String(50), default="configured")
    error_message = Column(String(2000), nullable=True)
    created_by = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

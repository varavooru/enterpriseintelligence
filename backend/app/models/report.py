from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey, Text, func
from app.core.database import Base


class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    report_type = Column(String(100), nullable=False)
    template = Column(String(100), nullable=True)
    parameters = Column(JSON, default={})
    content = Column(Text, nullable=True)
    sections = Column(JSON, default=[])
    status = Column(String(50), default="pending")
    storage_path = Column(String(1000), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

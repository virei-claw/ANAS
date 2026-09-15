import uuid
from sqlalchemy import Column, String, Integer, Text, DateTime
from datetime import datetime
from app.database import Base

class AnnotationHistory(Base):
    __tablename__ = 'annotation_history'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    annotation_id = Column(String(36), nullable=False)  # 不设外键，避免类型冲突
    version = Column(Integer, nullable=False, default=1)
    data = Column(Text, nullable=False)  # JSON string - full annotation snapshot
    changed_by = Column(String(36), nullable=True)
    change_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

import uuid
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from datetime import datetime
from app.database import Base


class AnnotationTemplate(Base):
    __tablename__ = "annotation_templates"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)  # 模板名称
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    part_name = Column(String(100), nullable=True)
    noise_type = Column(String(100), nullable=True)
    road_type = Column(String(100), nullable=True)
    speed = Column(Integer, nullable=True)
    temperature = Column(Integer, nullable=True)
    test_mode = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

import uuid
from sqlalchemy import Column, String, Integer, DateTime
from datetime import datetime
from app.database import Base

class Task(Base):
    __tablename__ = 'tasks'

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    project_id = Column(String(36), nullable=True)  # 暂不关联 projects 表
    audio_id = Column(String(36), nullable=False)  # 不设外键
    assigned_to = Column(String(36), nullable=False)  # 不设外键
    status = Column(String(20), default='pending')  # pending/in_progress/completed
    priority = Column(Integer, default=0)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
import uuid
from sqlalchemy import Column, String, Float, Integer, BigInteger, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class AudioFile(Base):
    __tablename__ = "audio_files"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False)
    duration = Column(Float, nullable=False)
    sample_rate = Column(Integer, nullable=True)
    file_size = Column(BigInteger, nullable=False)
    uploader_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    uploader = relationship("User", back_populates="audio_files")
    annotations = relationship("Annotation", back_populates="audio", cascade="all, delete-orphan")

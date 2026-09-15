import uuid
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Annotation(Base):
    __tablename__ = "annotations"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    audio_id = Column(String(36), ForeignKey("audio_files.id", ondelete="CASCADE"), nullable=False)
    part_name_id = Column(String(36), ForeignKey("part_names.id"), nullable=True)
    noise_type_id = Column(String(36), ForeignKey("noise_types.id"), nullable=True)
    road_type_id = Column(String(36), ForeignKey("road_types.id"), nullable=True)
    speed = Column(Integer, nullable=True)
    temperature = Column(Integer, nullable=True)
    test_mode = Column(String(10), nullable=True)  # 'dynamic' or 'static'
    reason = Column(Text, nullable=True)
    solution = Column(Text, nullable=True)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    clip_filepath = Column(String(500), nullable=True)  # 裁剪后的音频片段路径
    status = Column(String(20), default='draft')  # draft, submitted, approved, rejected
    submitted_at = Column(DateTime, nullable=True)
    reviewed_by = Column(String(36), ForeignKey('users.id'), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    reject_reason = Column(Text, nullable=True)
    annotator_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    audio = relationship("AudioFile", back_populates="annotations")
    part_name = relationship("PartName")
    noise_type = relationship("NoiseType")
    road_type = relationship("RoadType")
    annotator = relationship("User", foreign_keys=[annotator_id])

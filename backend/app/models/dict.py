import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base

class PartName(Base):
    __tablename__ = "part_names"
    id = Column(UUID(as_uuid=True), primary_key=True, default=lambda: uuid.uuid4())
    name = Column(String(100), unique=True, nullable=False)

class NoiseType(Base):
    __tablename__ = "noise_types"
    id = Column(UUID(as_uuid=True), primary_key=True, default=lambda: uuid.uuid4())
    name = Column(String(100), unique=True, nullable=False)

class RoadType(Base):
    __tablename__ = "road_types"
    id = Column(UUID(as_uuid=True), primary_key=True, default=lambda: uuid.uuid4())
    name = Column(String(100), unique=True, nullable=False)


class DictType(Base):
    __tablename__ = "dict_types"
    id = Column(UUID(as_uuid=True), primary_key=True, default=lambda: uuid.uuid4())
    type_name = Column(String(100), unique=True, nullable=False)
    type_code = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    items = relationship("DictTypeItem", back_populates="dict_type", cascade="all, delete-orphan")


class DictTypeItem(Base):
    __tablename__ = "dict_type_items"
    id = Column(UUID(as_uuid=True), primary_key=True, default=lambda: uuid.uuid4())
    dict_type_id = Column(UUID(as_uuid=True), ForeignKey("dict_types.id"), nullable=False)
    name = Column(String(100), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    dict_type = relationship("DictType", back_populates="items")

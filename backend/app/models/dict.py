import uuid
from sqlalchemy import Column, String
from app.database import Base

class PartName(Base):
    __tablename__ = "part_names"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False)

class NoiseType(Base):
    __tablename__ = "noise_types"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False)

class RoadType(Base):
    __tablename__ = "road_types"
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), unique=True, nullable=False)

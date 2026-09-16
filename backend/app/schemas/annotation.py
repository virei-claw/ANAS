from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class AnnotationBase(BaseModel):
    speed: Optional[int] = None
    temperature: Optional[int] = None
    test_mode: Optional[str] = None
    reason: Optional[str] = None
    solution: Optional[str] = None
    start_time: float
    end_time: float
    clip_filepath: Optional[str] = None

class AnnotationCreate(AnnotationBase):
    audio_id: UUID
    part_name_id: Optional[UUID] = None
    noise_type_id: Optional[UUID] = None
    road_type_id: Optional[UUID] = None

class AnnotationUpdate(BaseModel):
    part_name_id: Optional[UUID] = None
    noise_type_id: Optional[UUID] = None
    road_type_id: Optional[UUID] = None
    speed: Optional[int] = None
    temperature: Optional[int] = None
    test_mode: Optional[str] = None
    reason: Optional[str] = None
    solution: Optional[str] = None

class AnnotationResponse(BaseModel):
    id: UUID
    audio_id: UUID
    part_name_id: Optional[UUID] = None
    noise_type_id: Optional[UUID] = None
    road_type_id: Optional[UUID] = None
    speed: Optional[int] = None
    temperature: Optional[int] = None
    test_mode: Optional[str] = None
    reason: Optional[str] = None
    solution: Optional[str] = None
    start_time: float
    end_time: float
    clip_filepath: Optional[str] = None
    status: str
    created_at: datetime
    part_name: Optional[str] = None
    noise_type: Optional[str] = None
    road_type: Optional[str] = None
    annotator_id: Optional[UUID] = None
    annotator_name: Optional[str] = None

    class Config:
        from_attributes = True

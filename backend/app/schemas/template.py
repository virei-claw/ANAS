from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class TemplateCreate(BaseModel):
    name: str
    part_name: Optional[str] = None
    noise_type: Optional[str] = None
    road_type: Optional[str] = None
    speed: Optional[int] = None
    temperature: Optional[int] = None
    test_mode: Optional[str] = None


class TemplateResponse(TemplateCreate):
    id: str
    created_at: datetime

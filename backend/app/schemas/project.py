from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    webhook_url: Optional[str] = None

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    webhook_url: Optional[str] = None

class ProjectResponse(ProjectCreate):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None
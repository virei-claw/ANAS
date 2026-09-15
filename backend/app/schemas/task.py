from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TaskCreate(BaseModel):
    audio_id: str
    assigned_to: str
    priority: int = 0
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    status: Optional[str] = None
    priority: Optional[int] = None
    due_date: Optional[datetime] = None

class TaskResponse(TaskCreate):
    id: str
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
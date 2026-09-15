from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class AudioFileBase(BaseModel):
    filename: str

class AudioFileCreate(AudioFileBase):
    pass

class AudioFileResponse(BaseModel):
    id: UUID
    filename: str
    filepath: str
    duration: float
    sample_rate: Optional[int] = None
    file_size: int
    uploader_id: Optional[UUID] = None
    uploader_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AudioFileList(BaseModel):
    items: list[AudioFileResponse]
    total: int
    page: int
    page_size: int

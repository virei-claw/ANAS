from pydantic import BaseModel
from uuid import UUID

class DictItemCreate(BaseModel):
    name: str

class DictItemResponse(BaseModel):
    id: UUID
    name: str

    class Config:
        from_attributes = True

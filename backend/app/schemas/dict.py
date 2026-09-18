from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

class DictItemCreate(BaseModel):
    name: str

class DictItemResponse(BaseModel):
    id: UUID
    name: str

    class Config:
        from_attributes = True


class DictTypeCreate(BaseModel):
    type_name: str
    type_code: str


class DictTypeResponse(BaseModel):
    id: UUID
    type_name: str
    type_code: str
    created_at: datetime

    class Config:
        from_attributes = True


class DictTypeItemCreate(BaseModel):
    name: str


class DictTypeItemResponse(BaseModel):
    id: UUID
    dict_type_id: UUID
    name: str
    created_at: datetime

    class Config:
        from_attributes = True

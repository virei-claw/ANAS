import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.dict import PartName, NoiseType, RoadType
from app.schemas.dict import DictItemCreate, DictItemResponse

router = APIRouter(prefix="/dict", tags=["dict"])

# Part Names
@router.get("/part-names", response_model=List[DictItemResponse])
def list_part_names(db: Session = Depends(get_db)):
    return db.query(PartName).all()

@router.post("/part-names", response_model=DictItemResponse)
def create_part_name(data: DictItemCreate, db: Session = Depends(get_db)):
    existing = db.query(PartName).filter(PartName.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already exists")
    item = PartName(name=data.name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/part-names/{item_id}")
def delete_part_name(item_id: uuid.UUID, db: Session = Depends(get_db)):
    item = db.query(PartName).filter(PartName.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}

# Noise Types
@router.get("/noise-types", response_model=List[DictItemResponse])
def list_noise_types(db: Session = Depends(get_db)):
    return db.query(NoiseType).all()

@router.post("/noise-types", response_model=DictItemResponse)
def create_noise_type(data: DictItemCreate, db: Session = Depends(get_db)):
    existing = db.query(NoiseType).filter(NoiseType.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already exists")
    item = NoiseType(name=data.name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/noise-types/{item_id}")
def delete_noise_type(item_id: uuid.UUID, db: Session = Depends(get_db)):
    item = db.query(NoiseType).filter(NoiseType.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}

# Road Types
@router.get("/road-types", response_model=List[DictItemResponse])
def list_road_types(db: Session = Depends(get_db)):
    return db.query(RoadType).all()

@router.post("/road-types", response_model=DictItemResponse)
def create_road_type(data: DictItemCreate, db: Session = Depends(get_db)):
    existing = db.query(RoadType).filter(RoadType.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already exists")
    item = RoadType(name=data.name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/road-types/{item_id}")
def delete_road_type(item_id: uuid.UUID, db: Session = Depends(get_db)):
    item = db.query(RoadType).filter(RoadType.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}

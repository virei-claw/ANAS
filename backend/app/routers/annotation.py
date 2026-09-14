import uuid
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.models.annotation import Annotation
from app.models.dict import PartName, NoiseType, RoadType
from app.schemas.annotation import AnnotationCreate, AnnotationUpdate, AnnotationResponse

router = APIRouter(prefix="/annotations", tags=["annotations"])

@router.post("", response_model=AnnotationResponse)
def create_annotation(data: AnnotationCreate, db: Session = Depends(get_db)):
    annotation = Annotation(**data.model_dump())
    db.add(annotation)
    db.commit()
    db.refresh(annotation)
    return AnnotationResponse(
        **annotation.__dict__,
        part_name=annotation.part_name.name if annotation.part_name else None,
        noise_type=annotation.noise_type.name if annotation.noise_type else None,
        road_type=annotation.road_type.name if annotation.road_type else None
    )

@router.get("", response_model=List[AnnotationResponse])
def list_annotations(
    audio_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Annotation)
    if audio_id:
        query = query.filter(Annotation.audio_id == audio_id)

    annotations = query.order_by(Annotation.created_at.desc()).all()
    result = []
    for a in annotations:
        result.append(AnnotationResponse(
            **a.__dict__,
            part_name=a.part_name.name if a.part_name else None,
            noise_type=a.noise_type.name if a.noise_type else None,
            road_type=a.road_type.name if a.road_type else None
        ))
    return result

@router.get("/{annotation_id}", response_model=AnnotationResponse)
def get_annotation(annotation_id: uuid.UUID, db: Session = Depends(get_db)):
    annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    return AnnotationResponse(
        **annotation.__dict__,
        part_name=annotation.part_name.name if annotation.part_name else None,
        noise_type=annotation.noise_type.name if annotation.noise_type else None,
        road_type=annotation.road_type.name if annotation.road_type else None
    )

@router.put("/{annotation_id}", response_model=AnnotationResponse)
def update_annotation(annotation_id: uuid.UUID, data: AnnotationUpdate, db: Session = Depends(get_db)):
    annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(annotation, key, value)

    db.commit()
    db.refresh(annotation)
    return AnnotationResponse(
        **annotation.__dict__,
        part_name=annotation.part_name.name if annotation.part_name else None,
        noise_type=annotation.noise_type.name if annotation.noise_type else None,
        road_type=annotation.road_type.name if annotation.road_type else None
    )

@router.delete("/{annotation_id}")
def delete_annotation(annotation_id: uuid.UUID, db: Session = Depends(get_db)):
    annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    db.delete(annotation)
    db.commit()
    return {"message": "Deleted"}

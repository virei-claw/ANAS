import csv
import io
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.annotation import Annotation
from app.routers.auth import get_current_user

router = APIRouter(prefix="/export", tags=["export"])

@router.get("/annotations/csv")
def export_annotations_csv(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """导出所有标注为 CSV"""
    annotations = db.query(Annotation).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        'ID', 'Audio ID', 'Start Time', 'End Time',
        'Part Name', 'Noise Type', 'Road Type',
        'Speed', 'Temperature', 'Test Mode',
        'Reason', 'Solution', 'Status', 'Created At'
    ])

    # Data
    for ann in annotations:
        writer.writerow([
            ann.id,
            ann.audio_id,
            ann.start_time,
            ann.end_time,
            ann.part_name.name if ann.part_name else '',
            ann.noise_type.name if ann.noise_type else '',
            ann.road_type.name if ann.road_type else '',
            ann.speed or '',
            ann.temperature or '',
            ann.test_mode or '',
            ann.reason or '',
            ann.solution or '',
            ann.status or 'draft',
            ann.created_at.isoformat() if ann.created_at else ''
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=annotations.csv"}
    )

@router.get("/annotations/json")
def export_annotations_json(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """导出所有标注为 JSON"""
    annotations = db.query(Annotation).all()

    result = []
    for ann in annotations:
        result.append({
            "id": ann.id,
            "audio_id": ann.audio_id,
            "start_time": ann.start_time,
            "end_time": ann.end_time,
            "part_name": ann.part_name.name if ann.part_name else None,
            "noise_type": ann.noise_type.name if ann.noise_type else None,
            "road_type": ann.road_type.name if ann.road_type else None,
            "speed": ann.speed,
            "temperature": ann.temperature,
            "test_mode": ann.test_mode,
            "reason": ann.reason,
            "solution": ann.solution,
            "status": ann.status or 'draft',
            "created_at": ann.created_at.isoformat() if ann.created_at else None
        })

    return result
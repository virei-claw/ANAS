import csv
import uuid
import json
import os
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Query, Body, UploadFile, File, Request
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.models.annotation import Annotation
from app.models.annotation_template import AnnotationTemplate
from app.models.dict import PartName, NoiseType, RoadType
from app.models.user import User
from app.models.audio import AudioFile
from app.models.audit import AuditLog
from app.schemas.annotation import AnnotationCreate, AnnotationUpdate, AnnotationResponse
from app.schemas.template import TemplateCreate, TemplateResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/annotations", tags=["annotations"])

@router.post("", response_model=AnnotationResponse)
def create_annotation(
    data: AnnotationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from sqlalchemy.orm import joinedload
    annotation = Annotation(**data.model_dump(), annotator_id=current_user.id)
    db.add(annotation)
    db.commit()

    # Reload with joinedload to get relationships
    annotation = db.query(Annotation).options(
        joinedload(Annotation.part_name),
        joinedload(Annotation.noise_type),
        joinedload(Annotation.road_type),
        joinedload(Annotation.annotator),
        joinedload(Annotation.audio)
    ).filter(Annotation.id == annotation.id).first()

    # Create audit log
    audit_log = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action="CREATE",
        resource="annotation",
        resource_id=str(annotation.id),
        details=json.dumps(data.model_dump(), default=str),
        ip_address=request.client.host if request.client else None
    )
    db.add(audit_log)
    db.commit()

    return AnnotationResponse(
        id=annotation.id,
        audio_id=annotation.audio_id,
        part_name_id=annotation.part_name_id,
        noise_type_id=annotation.noise_type_id,
        road_type_id=annotation.road_type_id,
        speed=annotation.speed,
        temperature=annotation.temperature,
        test_mode=annotation.test_mode,
        reason=annotation.reason,
        solution=annotation.solution,
        start_time=annotation.start_time,
        end_time=annotation.end_time,
        clip_filepath=annotation.clip_filepath,
        custom_dict_items=annotation.custom_dict_items,
        status=annotation.status,
        created_at=annotation.created_at,
        part_name=annotation.part_name.name if annotation.part_name else None,
        noise_type=annotation.noise_type.name if annotation.noise_type else None,
        road_type=annotation.road_type.name if annotation.road_type else None,
        annotator_id=annotation.annotator_id,
        annotator_name=annotation.annotator.username if annotation.annotator else None,
        audio_filename=annotation.audio.filename if annotation.audio else None
    )

@router.get("", response_model=List[AnnotationResponse])
def list_annotations(
    audio_id: Optional[uuid.UUID] = None,
    part_name: Optional[str] = None,
    noise_type: Optional[str] = None,
    road_type: Optional[str] = None,
    status: Optional[str] = None,
    annotator_name: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from sqlalchemy.orm import joinedload
    query = db.query(Annotation).options(
        joinedload(Annotation.part_name),
        joinedload(Annotation.noise_type),
        joinedload(Annotation.road_type),
        joinedload(Annotation.annotator),
        joinedload(Annotation.audio)
    )

    if audio_id:
        query = query.filter(Annotation.audio_id == audio_id)

    # Filter by part_name (string match on name)
    if part_name:
        query = query.filter(Annotation.part_name.has(name=part_name))

    # Filter by noise_type (string match on name)
    if noise_type:
        query = query.filter(Annotation.noise_type.has(name=noise_type))

    # Filter by road_type (string match on name)
    if road_type:
        query = query.filter(Annotation.road_type.has(name=road_type))

    # Filter by status
    if status:
        query = query.filter(Annotation.status == status)

    # Filter by annotator name
    if annotator_name:
        query = query.filter(Annotation.annotator.has(username=annotator_name))

    # Filter by date range
    if start_date:
        query = query.filter(Annotation.created_at >= start_date)
    if end_date:
        query = query.filter(Annotation.created_at <= end_date)

    # Pagination
    total = query.count()
    offset = (page - 1) * page_size
    annotations = query.order_by(Annotation.created_at.desc()).offset(offset).limit(page_size).all()

    result = []
    for a in annotations:
        result.append(AnnotationResponse(
            id=a.id,
            audio_id=a.audio_id,
            part_name_id=a.part_name_id,
            noise_type_id=a.noise_type_id,
            road_type_id=a.road_type_id,
            speed=a.speed,
            temperature=a.temperature,
            test_mode=a.test_mode,
            reason=a.reason,
            solution=a.solution,
            start_time=a.start_time,
            end_time=a.end_time,
            clip_filepath=a.clip_filepath,
            custom_dict_items=a.custom_dict_items,
            status=a.status,
            created_at=a.created_at,
            part_name=a.part_name.name if a.part_name else None,
            noise_type=a.noise_type.name if a.noise_type else None,
            road_type=a.road_type.name if a.road_type else None,
            annotator_id=a.annotator_id,
            annotator_name=a.annotator.username if a.annotator else None,
            audio_filename=a.audio.filename if a.audio else None
        ))
    return result

@router.get("/pending", response_model=List[AnnotationResponse])
def list_pending_annotations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取待审核列表"""
    from app.models.annotation import Annotation
    query = db.query(Annotation).filter(Annotation.status == 'submitted')
    annotations = query.order_by(Annotation.created_at.desc()).all()
    result = []
    for a in annotations:
        result.append(AnnotationResponse(
            id=a.id,
            audio_id=a.audio_id,
            part_name_id=a.part_name_id,
            noise_type_id=a.noise_type_id,
            road_type_id=a.road_type_id,
            speed=a.speed,
            temperature=a.temperature,
            test_mode=a.test_mode,
            reason=a.reason,
            solution=a.solution,
            start_time=a.start_time,
            end_time=a.end_time,
            clip_filepath=a.clip_filepath,
            custom_dict_items=a.custom_dict_items,
            status=a.status,
            created_at=a.created_at,
            part_name=a.part_name.name if a.part_name else None,
            noise_type=a.noise_type.name if a.noise_type else None,
            road_type=a.road_type.name if a.road_type else None,
            annotator_id=a.annotator_id,
            annotator_name=a.annotator.username if a.annotator else None
        ))
    return result

@router.get("/my", response_model=List[AnnotationResponse])
def get_my_annotations(
    status_filter: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取当前用户的标注列表"""
    from sqlalchemy.orm import joinedload
    query = db.query(Annotation).options(
        joinedload(Annotation.part_name),
        joinedload(Annotation.noise_type),
        joinedload(Annotation.road_type),
        joinedload(Annotation.annotator),
        joinedload(Annotation.audio)
    ).filter(Annotation.annotator_id == current_user.id)

    if status_filter:
        query = query.filter(Annotation.status == status_filter)

    annotations = query.order_by(Annotation.created_at.desc()).all()
    result = []
    for a in annotations:
        result.append(AnnotationResponse(
            id=a.id,
            audio_id=a.audio_id,
            part_name_id=a.part_name_id,
            noise_type_id=a.noise_type_id,
            road_type_id=a.road_type_id,
            speed=a.speed,
            temperature=a.temperature,
            test_mode=a.test_mode,
            reason=a.reason,
            solution=a.solution,
            start_time=a.start_time,
            end_time=a.end_time,
            clip_filepath=a.clip_filepath,
            custom_dict_items=a.custom_dict_items,
            status=a.status,
            created_at=a.created_at,
            part_name=a.part_name.name if a.part_name else None,
            noise_type=a.noise_type.name if a.noise_type else None,
            road_type=a.road_type.name if a.road_type else None,
            annotator_id=a.annotator_id,
            annotator_name=a.annotator.username if a.annotator else None,
            audio_filename=a.audio.filename if a.audio else None
        ))
    return result


# ============ Template routes (must be before /{annotation_id}) ============
@router.post("/templates", response_model=TemplateResponse)
def create_template(
    data: TemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    template = AnnotationTemplate(**data.model_dump(), user_id=current_user.id)
    db.add(template)
    db.commit()
    db.refresh(template)
    return template


@router.get("/templates", response_model=List[TemplateResponse])
def list_templates(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    templates = db.query(AnnotationTemplate).filter(AnnotationTemplate.user_id == current_user.id).all()
    return templates


@router.delete("/templates/{template_id}")
def delete_template(
    template_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    template = db.query(AnnotationTemplate).filter(
        AnnotationTemplate.id == template_id,
        AnnotationTemplate.user_id == current_user.id
    ).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(template)
    db.commit()
    return {"message": "Deleted"}


@router.get("/{annotation_id}", response_model=AnnotationResponse)
def get_annotation(
    annotation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    from sqlalchemy.orm import joinedload
    annotation = db.query(Annotation).options(
        joinedload(Annotation.part_name),
        joinedload(Annotation.noise_type),
        joinedload(Annotation.road_type),
        joinedload(Annotation.annotator),
        joinedload(Annotation.audio)
    ).filter(Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    return AnnotationResponse(
        id=annotation.id,
        audio_id=annotation.audio_id,
        part_name_id=annotation.part_name_id,
        noise_type_id=annotation.noise_type_id,
        road_type_id=annotation.road_type_id,
        speed=annotation.speed,
        temperature=annotation.temperature,
        test_mode=annotation.test_mode,
        reason=annotation.reason,
        solution=annotation.solution,
        start_time=annotation.start_time,
        end_time=annotation.end_time,
        clip_filepath=annotation.clip_filepath,
        custom_dict_items=annotation.custom_dict_items,
        status=annotation.status,
        created_at=annotation.created_at,
        part_name=annotation.part_name.name if annotation.part_name else None,
        noise_type=annotation.noise_type.name if annotation.noise_type else None,
        road_type=annotation.road_type.name if annotation.road_type else None,
        annotator_id=annotation.annotator_id,
        annotator_name=annotation.annotator.username if annotation.annotator else None,
        audio_filename=annotation.audio.filename if annotation.audio else None
    )

@router.put("/{annotation_id}", response_model=AnnotationResponse)
def update_annotation(
    annotation_id: uuid.UUID,
    data: AnnotationUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")

    old_values = {k: getattr(annotation, k) for k in data.model_dump(exclude_unset=True).keys()}

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(annotation, key, value)

    db.commit()
    db.refresh(annotation)

    # Create audit log
    audit_log = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action="UPDATE",
        resource="annotation",
        resource_id=str(annotation_id),
        details=json.dumps({"old": old_values, "new": data.model_dump(exclude_unset=True)}, default=str),
        ip_address=request.client.host if request.client else None
    )
    db.add(audit_log)
    db.commit()

    return AnnotationResponse.model_validate(annotation)

@router.delete("/{annotation_id}")
def delete_annotation(
    annotation_id: uuid.UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")

    # 保存 clip_filepath 以便后续删除
    clip_filepath = annotation.clip_filepath

    # Create audit log before deletion
    audit_log = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action="DELETE",
        resource="annotation",
        resource_id=str(annotation_id),
        details=json.dumps({"deleted_annotation": str(annotation_id)}),
        ip_address=request.client.host if request.client else None
    )
    db.add(audit_log)

    db.delete(annotation)
    db.commit()

    # 删除关联的 clip 文件
    if clip_filepath:
        try:
            if os.path.exists(clip_filepath):
                os.remove(clip_filepath)
        except PermissionError:
            # Windows 文件被占用
            pass

    return {"message": "Deleted"}

@router.post("/batch-submit")
def batch_submit_annotations(
    annotation_ids: List[uuid.UUID] = Body(embed=True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """批量提交标注审核"""
    annotations = db.query(Annotation).filter(Annotation.id.in_(annotation_ids)).all()
    count = 0
    for ann in annotations:
        if ann.status == 'draft':
            ann.status = 'submitted'
            ann.submitted_at = datetime.utcnow()
            count += 1
    db.commit()
    return {"message": f"已提交 {count} 条标注"}

@router.post("/import")
def import_annotations(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """批量导入标注"""
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="只支持 CSV 格式文件")

    content = file.file.read().decode('utf-8')
    reader = csv.DictReader(content.splitlines())

    # Validate headers
    required_headers = {'audio_id', 'start_time', 'end_time'}
    if not reader.fieldnames or not required_headers.issubset(set(reader.fieldnames)):
        raise HTTPException(
            status_code=400,
            detail=f"CSV 必须包含必要字段: {', '.join(required_headers)}"
        )

    # Build lookup maps for dictionaries
    part_names_map = {p.name: p.id for p in db.query(PartName).all()}
    noise_types_map = {n.name: n.id for n in db.query(NoiseType).all()}
    road_types_map = {r.name: r.id for r in db.query(RoadType).all()}

    total = 0
    success = 0
    failed = 0
    errors = []

    for row_num, row in enumerate(reader, start=2):
        total += 1
        try:
            # Validate required fields
            audio_id = row.get('audio_id', '').strip()
            start_time = row.get('start_time', '').strip()
            end_time = row.get('end_time', '').strip()

            if not audio_id:
                raise ValueError("audio_id 不能为空")
            if not start_time:
                raise ValueError("start_time 不能为空")
            if not end_time:
                raise ValueError("end_time 不能为空")

            # Validate audio exists
            audio_uuid = uuid.UUID(audio_id)
            audio = db.query(AudioFile).filter(AudioFile.id == audio_uuid).first()
            if not audio:
                raise ValueError(f"音频 ID {audio_id} 不存在")

            # Build annotation data
            annotation_data = {
                'audio_id': audio_uuid,
                'start_time': float(start_time),
                'end_time': float(end_time),
                'annotator_id': current_user.id,
            }

            # Optional fields
            part_name = row.get('part_name', '').strip()
            if part_name and part_name in part_names_map:
                annotation_data['part_name_id'] = part_names_map[part_name]

            noise_type = row.get('noise_type', '').strip()
            if noise_type and noise_type in noise_types_map:
                annotation_data['noise_type_id'] = noise_types_map[noise_type]

            road_type = row.get('road_type', '').strip()
            if road_type and road_type in road_types_map:
                annotation_data['road_type_id'] = road_types_map[road_type]

            speed = row.get('speed', '').strip()
            if speed:
                annotation_data['speed'] = int(speed)

            temperature = row.get('temperature', '').strip()
            if temperature:
                annotation_data['temperature'] = int(temperature)

            test_mode = row.get('test_mode', '').strip()
            if test_mode:
                annotation_data['test_mode'] = test_mode

            reason = row.get('reason', '').strip()
            if reason:
                annotation_data['reason'] = reason

            solution = row.get('solution', '').strip()
            if solution:
                annotation_data['solution'] = solution

            # Create annotation
            annotation = Annotation(**annotation_data)
            db.add(annotation)
            success += 1

        except ValueError as e:
            failed += 1
            errors.append({
                "row": row_num,
                "message": str(e)
            })
        except Exception as e:
            failed += 1
            errors.append({
                "row": row_num,
                "message": f"导入失败: {str(e)}"
            })

    if success > 0:
        db.commit()

    return {
        "total": total,
        "success": success,
        "failed": failed,
        "errors": errors
    }

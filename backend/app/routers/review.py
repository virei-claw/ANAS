from fastapi import APIRouter, Depends, HTTPException, Query, Request, Body
from sqlalchemy.orm import Session
from datetime import datetime
import json
import uuid
from app.database import get_db
from app.models.user import User
from app.models.annotation import Annotation
from app.models.annotation_history import AnnotationHistory
from app.models.audit import AuditLog
from app.routers.auth import get_current_user

router = APIRouter(prefix="/annotations", tags=["review"])


def require_reviewer(current_user: User = Depends(get_current_user)):
    """检查用户是否有审核权限"""
    if 'admin' not in [r.name for r in current_user.roles]:
        raise HTTPException(status_code=403, detail="需要管理员权限")
    return current_user


@router.put("/{annotation_id}/submit")
def submit_annotation(
    annotation_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """提交审核"""
    annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="标注不存在")

    # Create audit log
    audit_log = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action="SUBMIT",
        resource="annotation",
        resource_id=str(annotation_id),
        details=json.dumps({"status": "submitted"}),
        ip_address=request.client.host if request.client else None
    )
    db.add(audit_log)

    annotation.status = 'submitted'
    annotation.submitted_at = datetime.utcnow()
    db.commit()
    return {"message": "已提交审核"}


@router.put("/{annotation_id}/approve")
def approve_annotation(
    annotation_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_reviewer)
):
    """审核通过"""
    annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="标注不存在")

    # 记录历史
    history = AnnotationHistory(
        id=str(uuid.uuid4()),
        annotation_id=str(annotation_id),
        version=1,
        data=json.dumps({
            "status": "approved",
            "reviewed_by": str(current_user.id)
        }),
        changed_by=str(current_user.id),
        change_reason="审核通过"
    )
    db.add(history)

    # Create audit log
    audit_log = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action="APPROVE",
        resource="annotation",
        resource_id=str(annotation_id),
        details=json.dumps({"status": "approved"}),
        ip_address=request.client.host if request.client else None
    )
    db.add(audit_log)

    annotation.status = 'approved'
    annotation.reviewed_by = current_user.id
    annotation.reviewed_at = datetime.utcnow()
    db.commit()
    return {"message": "审核通过"}


@router.put("/{annotation_id}/reject")
def reject_annotation(
    annotation_id: str,
    db: Session = Depends(get_db),
    request: Request = None,
    current_user: User = Depends(require_reviewer),
    reject_reason: str = Body(...)
):
    """审核打回"""
    annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="标注不存在")

    # 记录历史
    history = AnnotationHistory(
        id=str(uuid.uuid4()),
        annotation_id=str(annotation_id),
        version=1,
        data=json.dumps({
            "status": "rejected",
            "reject_reason": reject_reason,
            "reviewed_by": str(current_user.id)
        }),
        changed_by=str(current_user.id),
        change_reason=f"审核打回: {reject_reason}"
    )
    db.add(history)

    # Create audit log
    audit_log = AuditLog(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        action="REJECT",
        resource="annotation",
        resource_id=str(annotation_id),
        details=json.dumps({"status": "rejected", "reject_reason": reject_reason}),
        ip_address=request.client.host if request.client else None
    )
    db.add(audit_log)

    annotation.status = 'rejected'
    annotation.reviewed_by = current_user.id
    annotation.reviewed_at = datetime.utcnow()
    annotation.reject_reason = reject_reason
    db.commit()
    return {"message": "已打回"}


@router.get("/{annotation_id}/history")
def get_annotation_history(
    annotation_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取标注审核历史"""
    # 检查标注是否存在
    annotation = db.query(Annotation).filter(Annotation.id == str(annotation_id)).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="标注不存在")

    history = db.query(AnnotationHistory).filter(
        AnnotationHistory.annotation_id == str(annotation_id)
    ).order_by(AnnotationHistory.created_at.desc()).all()

    return [{
        "id": h.id,
        "annotation_id": h.annotation_id,
        "version": h.version,
        "data": json.loads(h.data) if h.data else {},
        "changed_by": h.changed_by,
        "change_reason": h.change_reason,
        "created_at": h.created_at.isoformat() if h.created_at else None
    } for h in history]

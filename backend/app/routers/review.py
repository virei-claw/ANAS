from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.user import User
from app.models.annotation import Annotation
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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """提交审核"""
    annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="标注不存在")

    annotation.status = 'submitted'
    annotation.submitted_at = datetime.utcnow()
    db.commit()
    return {"message": "已提交审核"}


@router.put("/{annotation_id}/approve")
def approve_annotation(
    annotation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_reviewer)
):
    """审核通过"""
    annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="标注不存在")

    annotation.status = 'approved'
    annotation.reviewed_by = current_user.id
    annotation.reviewed_at = datetime.utcnow()
    db.commit()
    return {"message": "审核通过"}


@router.put("/{annotation_id}/reject")
def reject_annotation(
    annotation_id: str,
    reject_reason: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_reviewer)
):
    """审核打回"""
    annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="标注不存在")

    annotation.status = 'rejected'
    annotation.reviewed_by = current_user.id
    annotation.reviewed_at = datetime.utcnow()
    annotation.reject_reason = reject_reason
    db.commit()
    return {"message": "已打回"}


@router.get("/pending")
def list_pending_annotations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_reviewer)
):
    """获取待审核列表"""
    query = db.query(Annotation).filter(Annotation.status == 'submitted')
    total = query.count()
    items = query.offset((page-1)*page_size).limit(page_size).all()
    return {"items": items, "total": total, "page": page, "page_size": page_size}

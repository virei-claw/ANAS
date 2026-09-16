"""
统计 API
"""
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.annotation import Annotation
from app.models.audio import AudioFile
from app.models.dict import NoiseType, PartName
from app.routers.auth import get_current_user
from datetime import datetime, timedelta

router = APIRouter(prefix="/stats", tags=["stats"])

@router.get("/dashboard")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """获取仪表板统计数据"""
    # 总音频数
    total_audios = db.query(func.count(AudioFile.id)).scalar() or 0

    # 总标注数
    total_annotations = db.query(func.count(Annotation.id)).scalar() or 0

    # 今日标注数
    today = datetime.utcnow().date()
    today_start = datetime.combine(today, datetime.min.time())
    today_annotations = db.query(func.count(Annotation.id)).filter(
        Annotation.created_at >= today_start
    ).scalar() or 0

    # 在线用户数 (今天活跃的)
    active_users = db.query(func.count(func.distinct(User.id))).scalar() or 0

    # 各状态标注数量
    status_counts = db.query(
        Annotation.status,
        func.count(Annotation.id)
    ).group_by(Annotation.status).all()
    status_map = {s or 'draft': c for s, c in status_counts}

    # 各类型异响统计 (通过 JOIN 查询)
    noise_type_stats = db.query(
        NoiseType.name,
        func.count(Annotation.id)
    ).join(Annotation, Annotation.noise_type_id == NoiseType.id
    ).group_by(NoiseType.name).all()

    # 零部件问题排行 (通过 JOIN 查询)
    part_stats = db.query(
        PartName.name,
        func.count(Annotation.id)
    ).join(Annotation, Annotation.part_name_id == PartName.id
    ).group_by(PartName.name).order_by(
        func.count(Annotation.id).desc()
    ).limit(10).all()

    # 每日标注趋势 (最近7天)
    week_ago = datetime.utcnow() - timedelta(days=7)
    daily_trend = db.query(
        func.date(Annotation.created_at).label('date'),
        func.count(Annotation.id)
    ).filter(Annotation.created_at >= week_ago).group_by(
        func.date(Annotation.created_at)
    ).order_by(func.date(Annotation.created_at)).all()

    return {
        "total_audios": total_audios,
        "total_annotations": total_annotations,
        "today_annotations": today_annotations,
        "active_users": active_users,
        "status_counts": {
            "draft": status_map.get('draft', 0),
            "submitted": status_map.get('submitted', 0),
            "approved": status_map.get('approved', 0),
            "rejected": status_map.get('rejected', 0),
        },
        "noise_type_stats": [{"name": n, "count": c} for n, c in noise_type_stats],
        "part_stats": [{"name": p, "count": c} for p, c in part_stats],
        "daily_trend": [{"date": str(d), "count": c} for d, c in daily_trend],
    }


@router.get("/user-workload")
def get_user_workload_stats(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """按用户统计标注工作量"""
    query = db.query(
        User.id,
        User.username,
        User.full_name,
        func.count(Annotation.id).label('annotation_count')
    ).outerjoin(Annotation, Annotation.annotator_id == User.id
    ).group_by(User.id, User.username, User.full_name)

    # 可选日期过滤
    if start_date:
        query = query.filter(Annotation.created_at >= start_date)
    if end_date:
        query = query.filter(Annotation.created_at <= end_date)

    results = query.all()
    return [{"user_id": r[0], "username": r[1], "full_name": r[2], "count": r[3]} for r in results]

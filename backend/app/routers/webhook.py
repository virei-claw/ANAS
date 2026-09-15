"""
Webhook 配置路由
"""
import hashlib
import hmac
import json
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.project import Project
from app.routers.auth import get_current_user
import httpx

router = APIRouter(prefix="/webhooks", tags=["webhooks"])

def verify_webhook_signature(payload: str, signature: str, secret: str) -> bool:
    """验证 Webhook 签名"""
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(expected, signature)


@router.post("/test")
async def test_webhook(
    url: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """测试 Webhook 连接"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json={"event": "test", "message": "ANAS Webhook 测试消息"},
                timeout=10.0
            )
        return {"success": True, "status_code": response.status_code}
    except Exception as e:
        return {"success": False, "error": str(e)}


@router.post("/trigger/{project_id}")
async def trigger_webhook(
    project_id: str,
    event: str,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """手动触发 Webhook"""
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project or not project.webhook_url:
        raise HTTPException(status_code=404, detail="项目或 Webhook URL 未配置")

    payload = json.dumps({
        "event": event,
        "data": data,
        "project_id": project_id
    })

    headers = {"Content-Type": "application/json"}
    if project.webhook_secret:
        signature = hmac.new(
            project.webhook_secret.encode(),
            payload.encode(),
            hashlib.sha256
        ).hexdigest()
        headers["X-Webhook-Signature"] = signature

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                project.webhook_url,
                content=payload,
                headers=headers,
                timeout=10.0
            )
        return {"success": True, "status_code": response.status_code}
    except Exception as e:
        return {"success": False, "error": str(e)}

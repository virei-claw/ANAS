# Task C2: 操作日志完善

**Files:**
- Create: `backend/app/models/audit_log.py`
- Create: `backend/app/routers/audit.py`
- Modify: `backend/app/routers/annotation.py`
- Create: `backend/tests/test_audit_api.py`

**Interfaces:**
- Consumes: 操作事件 (创建/更新/删除/审核)
- Produces: 完整审计日志表和查询API

## Steps

### 后端

1. **创建审计日志模型**

```python
# backend/app/models/audit_log.py
class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_type = Column(String(50), nullable=False)  # annotation, audio, user
    entity_id = Column(String(36), nullable=False)
    action = Column(String(20), nullable=False)  # create, update, delete
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    changes = Column(Text, nullable=True)  # JSON diff
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
```

2. **创建审计路由**

```python
# backend/app/routers/audit.py
router = APIRouter(prefix="/audit", tags=["audit"])

@router.get("/logs")
def get_audit_logs(
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    user_id: Optional[str] = None,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    page: int = 1,
    page_size: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = db.query(AuditLog)
    
    if entity_type:
        query = query.filter(AuditLog.entity_type == entity_type)
    if entity_id:
        query = query.filter(AuditLog.entity_id == entity_id)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if start_date:
        query = query.filter(AuditLog.created_at >= start_date)
    if end_date:
        query = query.filter(AuditLog.created_at <= end_date)
    
    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset((page-1)*page_size).limit(page_size).all()
    
    return {"items": logs, "total": total, "page": page, "page_size": page_size}
```

3. **在annotation路由中记录日志**

```python
# annotation.py 中的 create_annotation
def create_annotation(...):
    annotation = Annotation(**data.model_dump(), annotator_id=current_user.id)
    db.add(annotation)
    db.commit()
    
    # 记录审计日志
    audit_log = AuditLog(
        entity_type="annotation",
        entity_id=annotation.id,
        action="create",
        user_id=current_user.id,
        changes=json.dumps(data.model_dump())
    )
    db.add(audit_log)
    db.commit()
```

同样在 update_annotation 和 delete_annotation 中添加日志记录。

4. **测试**

```python
# backend/tests/test_audit_api.py
def test_annotation_create_logs_action():
    response = client.post("/api/annotations", json={...}, headers=auth_header)
    assert response.status_code == 200
    
    # 验证日志被创建
    log_response = client.get("/api/audit/logs?entity_type=annotation", headers=auth_header)
    assert log_response.status_code == 200
    logs = log_response.json()["items"]
    assert any(l["action"] == "create" for l in logs)
```

5. **提交**

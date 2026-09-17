# Task A2: 标注模板

**Files:**
- Create: `backend/app/models/annotation_template.py`
- Create: `backend/app/schemas/template.py`
- Modify: `backend/app/routers/annotation.py`
- Create: `backend/tests/test_template_api.py`
- Create: `frontend/src/hooks/useAnnotationTemplate.ts`
- Modify: `frontend/src/components/AnnotationForm.tsx`

**Interfaces:**
- Consumes: `/annotations/templates` API, `AnnotationTemplate` model
- Produces: `useAnnotationTemplate()` hook, template selector in AnnotationForm

## Steps

### 后端实现

1. **创建模板模型**

```python
# backend/app/models/annotation_template.py
class AnnotationTemplate(Base):
    __tablename__ = "annotation_templates"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(100), nullable=False)  # 模板名称
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    part_name = Column(String(100), nullable=True)
    noise_type = Column(String(100), nullable=True)
    road_type = Column(String(100), nullable=True)
    speed = Column(Integer, nullable=True)
    temperature = Column(Integer, nullable=True)
    test_mode = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
```

2. **创建Schema**

```python
# backend/app/schemas/template.py
class TemplateCreate(BaseModel):
    name: str
    part_name: Optional[str] = None
    noise_type: Optional[str] = None
    road_type: Optional[str] = None
    speed: Optional[int] = None
    temperature: Optional[int] = None
    test_mode: Optional[str] = None

class TemplateResponse(TemplateCreate):
    id: str
    created_at: datetime
```

3. **添加CRUD路由到annotation.py**

```python
@router.post("/templates", response_model=TemplateResponse)
def create_template(data: TemplateCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    template = AnnotationTemplate(**data.model_dump(), user_id=current_user.id)
    db.add(template)
    db.commit()
    db.refresh(template)
    return template

@router.get("/templates", response_model=List[TemplateResponse])
def list_templates(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    templates = db.query(AnnotationTemplate).filter(AnnotationTemplate.user_id == current_user.id).all()
    return templates

@router.delete("/templates/{template_id}")
def delete_template(template_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    template = db.query(AnnotationTemplate).filter(AnnotationTemplate.id == template_id, AnnotationTemplate.user_id == current_user.id).first()
    if not template:
        raise HTTPException(404, "Template not found")
    db.delete(template)
    db.commit()
    return {"message": "Deleted"}
```

4. **编写测试**

```python
# backend/tests/test_template_api.py
def test_create_template():
    response = client.post("/api/annotations/templates", json={
        "name": "发动机异响",
        "part_name": "发动机",
        "noise_type": "哒哒声"
    }, headers=auth_header)
    assert response.status_code == 200
    assert response.json()["name"] == "发动机异响"

def test_list_templates():
    response = client.get("/api/annotations/templates", headers=auth_header)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_delete_template():
    # 先创建
    create_resp = client.post("/api/annotations/templates", json={"name": "test"}, headers=auth_header)
    template_id = create_resp.json()["id"]
    # 再删除
    del_resp = client.delete(f"/api/annotations/templates/{template_id}", headers=auth_header)
    assert del_resp.status_code == 200
```

### 前端实现

5. **添加API方法**

```typescript
// frontend/src/lib/api.ts
template: {
  list: () => api.get('/annotations/templates'),
  create: (data: any) => api.post('/annotations/templates', data),
  delete: (id: string) => api.delete(`/annotations/templates/${id}`),
}
```

6. **创建useAnnotationTemplate hook**

```typescript
// frontend/src/hooks/useAnnotationTemplate.ts
import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'

export function useAnnotationTemplate() {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get('/annotations/templates')
      setTemplates(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const create = async (data: any) => {
    await api.post('/annotations/templates', data)
    await load()
  }

  const remove = async (id: string) => {
    await api.delete(`/annotations/templates/${id}`)
    await load()
  }

  return { templates, loading, reload: load, create, remove }
}
```

7. **在AnnotationForm中添加模板选择器**

8. **运行测试确认通过**

9. **提交**

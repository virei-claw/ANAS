# 效率增强功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为异音检测标注系统实现7个效率和质量提升功能

**Architecture:** 基于现有 FastAPI + React + PostgreSQL 架构，在不改变核心数据流的前提下，增加本地状态管理（标注模板、草稿）和增强型API（个人统计、工作台）。快捷键使用 React hooks 实现，AI预检测使用简单频谱分析算法。

**Tech Stack:** 
- 后端: Python/FastAPI, SQLAlchemy
- 前端: React 18, TypeScript, Tailwind CSS, wavesurfer.js
- 测试: pytest (后端), Vitest (前端)

**Spec:** `docs/superpowers/specs/2026-09-16-feature-enhancements-design.md`

---

## Global Constraints

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- 前端测试必须使用 Vitest
- 所有功能必须先写测试再实现 (TDD)
- 测试通过后才能提交

---

## 功能模块分解

### 模块 A: 效率工具 (A1-A3)
- A1: 快捷键支持
- A2: 标注模板
- A3: 自动草稿保存

### 模块 B: 流程优化 (B1-B2)
- B1: 个人工作台
- B2: 个人统计报表

### 模块 C: 质量提升 (C1-C2)
- C1: AI预检测
- C2: 操作日志完善

---

## 文件结构

```
backend/
├── app/
│   ├── routers/
│   │   ├── annotation.py      # 修改: 模板CRUD, 草稿保存
│   │   ├── stats.py          # 修改: 个人统计API
│   │   └── audit.py          # 新增: 操作日志
│   ├── models/
│   │   ├── annotation_template.py  # 新增: 标注模板模型
│   │   └── audit_log.py           # 新增: 审计日志模型
│   └── schemas/
│       └── template.py        # 新增: 模板Schema

frontend/
├── src/
│   ├── components/
│   │   ├── AudioWaveform.tsx  # 修改: 快捷键支持
│   │   ├── AnnotationForm.tsx  # 修改: 模板选择, 草稿恢复
│   │   └── HotkeyHelp.tsx     # 新增: 快捷键提示
│   ├── pages/
│   │   ├── Dashboard.tsx      # 修改: 个人工作台
│   │   └── AudioDetail.tsx    # 修改: 草稿自动保存
│   ├── hooks/
│   │   ├── useAnnotationTemplate.ts  # 新增: 模板hook
│   │   ├── useAutoDraft.ts          # 新增: 草稿hook
│   │   └── useHotkeys.ts            # 新增: 快捷键hook
│   └── lib/
│       └── api.ts             # 修改: 新增模板API

tests/
├── backend/
│   └── test_template_api.py   # 新增
└── frontend/
    └── test_*.tsx             # 新增各功能测试
```

---

## Task A1: 快捷键支持

**Files:**
- Create: `frontend/src/hooks/useHotkeys.ts`
- Create: `frontend/src/components/HotkeyHelp.tsx`
- Modify: `frontend/src/components/AudioWaveform.tsx`
- Create: `frontend/src/test/useHotkeys.test.ts`

**Interfaces:**
- Consumes: 无
- Produces: `useHotkeys(handlers: Record<string, () => void>)`, `HotkeyHelp` component

- [ ] **Step 1: 编写快捷键hook测试**

```typescript
// frontend/src/test/useHotkeys.test.ts
import { renderHook, act } from '@testing-library/react'
import { useHotkeys } from '../hooks/useHotkeys'

describe('useHotkeys', () => {
  it('空格键触发播放/暂停', async () => {
    const handler = vi.fn()
    const { result } = renderHook(() => useHotkeys({ ' ': handler }))
    
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
    })
    
    expect(handler).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: 运行测试确认失败**
```bash
cd frontend && npm test -- --run useHotkeys.test.ts
# 预期: FAIL - useHotkeys not defined
```

- [ ] **Step 3: 实现快捷键hook**

```typescript
// frontend/src/hooks/useHotkeys.ts
import { useEffect } from 'react'

export function useHotkeys(handlers: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框中的按键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      const handler = handlers[e.key]
      if (handler) {
        e.preventDefault()
        handler()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
```

- [ ] **Step 4: 运行测试确认通过**
```bash
cd frontend && npm test -- --run useHotkeys.test.ts
# 预期: PASS
```

- [ ] **Step 5: 在AudioWaveform中集成快捷键**
```typescript
// 在 AudioWaveform 中添加
const handlers = {
  ' ': togglePlay,           // 空格: 播放/暂停
  'j': () => skip(-10),    // J: 后退10秒
  'k': togglePlay,          // K: 播放/暂停
  'l': () => skip(10),    // L: 前进10秒
  '[': () => skip(-5),    // [: 后退5秒
  ']': () => skip(5),     // ]: 前进5秒
}
useHotkeys(handlers)
```

- [ ] **Step 6: 创建快捷键提示组件HotkeyHelp**

- [ ] **Step 7: 提交**
```bash
git add frontend/src/hooks/useHotkeys.ts frontend/src/components/HotkeyHelp.tsx
git commit -m "feat: 添加快捷键支持 (A1)"
```

---

## Task A2: 标注模板

**Files:**
- Create: `backend/app/models/annotation_template.py`
- Create: `backend/app/schemas/template.py`
- Modify: `backend/app/routers/annotation.py`
- Create: `backend/tests/test_template_api.py`
- Create: `frontend/src/hooks/useAnnotationTemplate.ts`
- Create: `frontend/src/test/useAnnotationTemplate.test.ts`
- Modify: `frontend/src/components/AnnotationForm.tsx`
- Create: `frontend/src/test/AnnotationForm.test.tsx`

**Interfaces:**
- Consumes: `AnnotationTemplate` model, `/annotations/templates` API
- Produces: `useAnnotationTemplate()` hook, template selector in AnnotationForm

- [ ] **Step 1: 编写后端模板模型测试**

```python
# backend/tests/test_template_api.py
def test_create_template():
    # 创建模板
    response = client.post("/api/annotations/templates", json={
        "name": "发动机异响",
        "part_name": "发动机",
        "noise_type": "哒哒声",
        "road_type": "沥青路",
        "speed": 60,
        "temperature": 25,
        "test_mode": "dynamic"
    }, headers=auth_header)
    assert response.status_code == 200
    assert response.json()["name"] == "发动机异响"
```

- [ ] **Step 2: 运行测试确认失败**

- [ ] **Step 3: 创建模板模型**

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

- [ ] **Step 4: 添加模板CRUD路由**

```python
# backend/app/routers/annotation.py
@router.post("/templates", response_model=TemplateResponse)
def create_template(data: TemplateCreate, ...):
    template = AnnotationTemplate(**data.model_dump(), user_id=current_user.id)
    db.add(template)
    ...

@router.get("/templates")
def list_templates(current_user: User = Depends(get_current_user)):
    templates = db.query(AnnotationTemplate).filter(
        AnnotationTemplate.user_id == current_user.id
    ).all()
    return templates

@router.delete("/templates/{template_id}")
def delete_template(template_id: str, ...):
    ...
```

- [ ] **Step 5: 运行后端测试确认通过**

- [ ] **Step 6: 编写前端hook测试**

```typescript
// frontend/src/test/useAnnotationTemplate.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useAnnotationTemplate } from '../hooks/useAnnotationTemplate'

it('加载模板列表', async () => {
  const { result } = renderHook(() => useAnnotationTemplate())
  await waitFor(() => {
    expect(result.current.templates).toBeDefined()
  })
})
```

- [ ] **Step 7: 实现前端hook**

```typescript
// frontend/src/hooks/useAnnotationTemplate.ts
import { useState, useEffect } from 'react'
import api from '@/lib/api'

export function useAnnotationTemplate() {
  const [templates, setTemplates] = useState([])
  
  const load = async () => {
    const res = await api.get('/annotations/templates')
    setTemplates(res.data)
  }
  
  useEffect(() => { load() }, [])
  
  return { templates, reload: load }
}
```

- [ ] **Step 8: 在AnnotationForm中添加模板选择器**

- [ ] **Step 9: 提交**
```bash
git add backend/app/models/annotation_template.py backend/app/routers/annotation.py
git add frontend/src/hooks/useAnnotationTemplate.ts frontend/src/components/AnnotationForm.tsx
git commit -m "feat: 标注模板功能 (A2)"
```

---

## Task A3: 自动草稿保存

**Files:**
- Modify: `frontend/src/pages/AudioDetail.tsx`
- Create: `frontend/src/hooks/useAutoDraft.ts`
- Create: `frontend/src/test/useAutoDraft.test.ts`

**Interfaces:**
- Consumes: `localStorage` for draft storage
- Produces: `useAutoDraft(audioId, annotationData)` hook

- [ ] **Step 1: 编写草稿hook测试**

```typescript
// frontend/src/test/useAutoDraft.test.ts
it('每30秒自动保存草稿', async () => {
  vi.useFakeTimers()
  const { result } = renderHook(() => useAutoDraft('audio-123', { reason: 'test' }))
  
  vi.advanceTimersByTime(30000)
  
  expect(localStorage.setItem).toHaveBeenCalled()
  vi.useRealTimers()
})
```

- [ ] **Step 2: 运行测试确认失败**

- [ ] **Step 3: 实现草稿hook**

```typescript
// frontend/src/hooks/useAutoDraft.ts
import { useEffect, useRef } from 'react'

const DRAFT_KEY = 'annotation_draft_'
const DRAFT_INTERVAL = 30000 // 30秒

export function useAutoDraft(audioId: string, data: any) {
  const timerRef = useRef<NodeJS.Timeout>()
  
  useEffect(() => {
    timerRef.current = setInterval(() => {
      localStorage.setItem(DRAFT_KEY + audioId, JSON.stringify({
        data,
        savedAt: new Date().toISOString()
      }))
    }, DRAFT_INTERVAL)
    
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [audioId, data])
  
  // 恢复草稿
  const restoreDraft = () => {
    const saved = localStorage.getItem(DRAFT_KEY + audioId)
    return saved ? JSON.parse(saved) : null
  }
  
  // 清除草稿
  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY + audioId)
  }
  
  return { restoreDraft, clearDraft }
}
```

- [ ] **Step 4: 运行测试确认通过**

- [ ] **Step 5: 在AudioDetail中集成草稿功能**

- [ ] **Step 6: 提交**
```bash
git add frontend/src/hooks/useAutoDraft.ts frontend/src/pages/AudioDetail.tsx
git commit -m "feat: 自动草稿保存 (A3)"
```

---

## Task B1: 个人工作台

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`
- Create: `frontend/src/test/Dashboard.test.tsx`

**Interfaces:**
- Consumes: `/api/stats/my-workload` API
- Produces: 工作台组件，显示待标注/审核中/已完成

- [ ] **Step 1: 后端添加个人工作量API测试**

```python
# backend/tests/test_stats_api.py
def test_my_workload():
    response = client.get("/api/stats/my-workload", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert "pending" in data
    assert "reviewing" in data
    assert "completed" in data
```

- [ ] **Step 2: 运行测试确认失败**

- [ ] **Step 3: 后端添加个人工作量端点**

```python
# backend/app/routers/stats.py
@router.get("/my-workload")
def get_my_workload(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pending = db.query(Annotation).filter(
        Annotation.annotator_id == current_user.id,
        Annotation.status == 'draft'
    ).count()
    
    reviewing = db.query(Annotation).filter(
        Annotation.annotator_id == current_user.id,
        Annotation.status == 'submitted'
    ).count()
    
    completed = db.query(Annotation).filter(
        Annotation.annotator_id == current_user.id,
        Annotation.status == 'approved'
    ).count()
    
    return {"pending": pending, "reviewing": reviewing, "completed": completed}
```

- [ ] **Step 4: 运行后端测试确认通过**

- [ ] **Step 5: 前端Dashboard改版测试**

- [ ] **Step 6: 实现个人工作台UI**

```tsx
// Dashboard.tsx 新增
<div className="grid grid-cols-3 gap-4 mb-6">
  <WorkloadCard title="待标注" count={workload.pending} color="yellow" />
  <WorkloadCard title="审核中" count={workload.reviewing} color="blue" />
  <WorkloadCard title="已完成" count={workload.completed} color="green" />
</div>
```

- [ ] **Step 7: 提交**
```bash
git add backend/app/routers/stats.py frontend/src/pages/Dashboard.tsx
git commit -m "feat: 个人工作台 (B1)"
```

---

## Task B2: 个人统计报表

**Files:**
- Modify: `backend/app/routers/stats.py`
- Create: `backend/tests/test_stats_api.py`
- Modify: `frontend/src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: `/api/stats/my-summary` API
- Produces: 个人统计报表组件

- [ ] **Step 1: 添加个人统计API测试**

```python
def test_my_summary():
    response = client.get("/api/stats/my-summary?period=week", headers=auth_header)
    assert response.status_code == 200
    data = response.json()
    assert "total_count" in data
    assert "daily_breakdown" in data
```

- [ ] **Step 2: 运行测试确认失败**

- [ ] **Step 3: 实现个人统计API**

```python
@router.get("/my-summary")
def get_my_summary(
    period: str = "week",  # day, week, month
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 计算日期范围
    if period == "day":
        start_date = datetime.utcnow().replace(hour=0, minute=0, second=0)
    elif period == "week":
        start_date = datetime.utcnow() - timedelta(days=7)
    else:
        start_date = datetime.utcnow() - timedelta(days=30)
    
    annotations = db.query(Annotation).filter(
        Annotation.annotator_id == current_user.id,
        Annotation.created_at >= start_date
    ).all()
    
    return {
        "total_count": len(annotations),
        "by_status": {
            "draft": sum(1 for a in annotations if a.status == 'draft'),
            "submitted": sum(1 for a in annotations if a.status == 'submitted'),
            "approved": sum(1 for a in annotations if a.status == 'approved'),
            "rejected": sum(1 for a in annotations if a.status == 'rejected'),
        },
        "daily_breakdown": [...]  # 每日数量
    }
```

- [ ] **Step 4: 运行后端测试确认通过**

- [ ] **Step 5: 前端添加统计图表**

- [ ] **Step 6: 提交**
```bash
git add backend/app/routers/stats.py frontend/src/pages/Dashboard.tsx
git commit -m "feat: 个人统计报表 (B2)"
```

---

## Task C1: AI预检测

**Files:**
- Create: `backend/app/services/anomaly_detector.py`
- Modify: `backend/app/routers/audio.py`
- Create: `backend/tests/test_anomaly_detector.py`
- Create: `frontend/src/components/AudioWaveform.tsx` (增强)

**Interfaces:**
- Consumes: 音频文件路径
- Produces: `anomaly_segments: [{start: float, end: float, confidence: float}]`

- [ ] **Step 1: 编写异常检测服务测试**

```python
# backend/tests/test_anomaly_detector.py
def test_detect_anomalies():
    detector = AnomalyDetector()
    segments = detector.detect("uploads/test.wav", threshold=0.5)
    assert isinstance(segments, list)
    assert all('start' in s and 'end' in s for s in segments)
```

- [ ] **Step 2: 运行测试确认失败**

- [ ] **Step 3: 实现简单频谱分析检测**

```python
# backend/app/services/anomaly_detector.py
import librosa
import numpy as np

class AnomalyDetector:
    def __init__(self, threshold: float = 0.5):
        self.threshold = threshold
    
    def detect(self, filepath: str) -> List[Dict]:
        y, sr = librosa.load(filepath)
        # 计算频谱质心 (spectral centroid)
        centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
        
        # 简单阈值: 频谱质心高于均值的区域可能是异常
        mean_centroid = np.mean(centroid)
        anomalies = []
        
        frame_length = 512
        for i in range(0, len(centroid) - frame_length, frame_length):
            frame_mean = np.mean(centroid[i:i+frame_length])
            if frame_mean > mean_centroid * (1 + self.threshold):
                start_time = librosa.frames_to_time(i, sr=sr)
                end_time = librosa.frames_to_time(i + frame_length, sr=sr)
                confidence = (frame_mean - mean_centroid) / mean_centroid
                anomalies.append({
                    "start": start_time,
                    "end": end_time,
                    "confidence": min(confidence, 1.0)
                })
        
        return anomalies
```

- [ ] **Step 4: 添加检测API端点**

```python
# backend/app/routers/audio.py
@router.get("/{audio_id}/detect-anomalies")
def detect_anomalies(
    audio_id: uuid.UUID,
    threshold: float = 0.5,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
    if not audio:
        raise HTTPException(404, "Audio not found")
    
    detector = AnomalyDetector(threshold=threshold)
    segments = detector.detect(audio.filepath)
    return {"segments": segments}
```

- [ ] **Step 5: 运行后端测试确认通过**

- [ ] **Step 6: 前端AudioWaveform集成预检测**

- [ ] **Step 7: 提交**
```bash
git add backend/app/services/anomaly_detector.py backend/app/routers/audio.py
git commit -m "feat: AI预检测功能 (C1)"
```

---

## Task C2: 操作日志完善

**Files:**
- Create: `backend/app/models/audit_log.py`
- Modify: `backend/app/routers/annotation.py`
- Create: `backend/tests/test_audit_api.py`
- Create: `backend/app/routers/audit.py`

**Interfaces:**
- Consumes: 操作事件 (创建/更新/删除/审核)
- Produces: 完整审计日志表和查询API

- [ ] **Step 1: 编写审计日志模型测试**

```python
# backend/tests/test_audit_api.py
def test_annotation_create_logs_action():
    response = client.post("/api/annotations", json={...}, headers=auth_header)
    assert response.status_code == 200
    
    # 验证日志被创建
    log_response = client.get("/api/audit/logs?entity_type=annotation", headers=auth_header)
    assert log_response.status_code == 200
    logs = log_response.json()
    assert any(l["action"] == "create" for l in logs)
```

- [ ] **Step 2: 运行测试确认失败**

- [ ] **Step 3: 创建审计日志模型**

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

- [ ] **Step 4: 创建审计路由**

```python
# backend/app/routers/audit.py
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
    # ... 其他过滤
    
    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset((page-1)*page_size).limit(page_size).all()
    
    return {"items": logs, "total": total, "page": page, "page_size": page_size}
```

- [ ] **Step 5: 在annotation路由中记录日志**

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

- [ ] **Step 6: 运行后端测试确认通过**

- [ ] **Step 7: 提交**
```bash
git add backend/app/models/audit_log.py backend/app/routers/audit.py
git commit -m "feat: 操作日志完善 (C2)"
```

---

## 实施顺序

1. **A1: 快捷键** - 最简单，立即提升效率
2. **A2: 标注模板** - 减少重复输入
3. **A3: 自动草稿** - 防止数据丢失
4. **B1: 个人工作台** - 清晰的任务视图
5. **B2: 个人统计** - 工作量可视化
6. **C2: 操作日志** - 审计合规
7. **C1: AI预检测** - 需要 librosa 依赖

---

## 验收标准

- [ ] 所有后端测试通过 (pytest)
- [ ] 所有前端测试通过 (Vitest)
- [ ] 前端构建成功
- [ ] 每个功能独立可测试

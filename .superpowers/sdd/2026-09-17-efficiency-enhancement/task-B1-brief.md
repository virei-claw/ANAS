# Task B1: 个人工作台

**Files:**
- Modify: `backend/app/routers/stats.py`
- Create: `backend/tests/test_stats_api.py`
- Modify: `frontend/src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: `/api/stats/my-workload` API
- Produces: 工作台组件，显示待标注/审核中/已完成

## Steps

### 后端

1. **添加个人工作量API**

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

2. **测试**

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

### 前端

3. **Dashboard改版**

```tsx
// Dashboard.tsx
import { useState, useEffect } from 'react'
import api from '@/lib/api'

function WorkloadCard({ title, count, color }: { title: string, count: number, color: string }) {
  const colors = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800'
  }
  return (
    <div className={`p-4 rounded-lg border ${colors[color as keyof typeof colors]}`}>
      <div className="text-2xl font-bold">{count}</div>
      <div className="text-sm">{title}</div>
    </div>
  )
}

export default function Dashboard() {
  const [workload, setWorkload] = useState({ pending: 0, reviewing: 0, completed: 0 })

  useEffect(() => {
    api.get('/stats/my-workload').then(res => setWorkload(res.data))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">个人工作台</h1>
      <div className="grid grid-cols-3 gap-4">
        <WorkloadCard title="待标注" count={workload.pending} color="yellow" />
        <WorkloadCard title="审核中" count={workload.reviewing} color="blue" />
        <WorkloadCard title="已完成" count={workload.completed} color="green" />
      </div>
      {/* 保留原有统计图表 */}
    </div>
  )
}
```

4. **提交**

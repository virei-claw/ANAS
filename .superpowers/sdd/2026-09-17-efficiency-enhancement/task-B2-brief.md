# Task B2: 个人统计报表

**Files:**
- Modify: `backend/app/routers/stats.py`
- Modify: `frontend/src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: `/api/stats/my-summary` API
- Produces: 个人统计报表组件

## Steps

### 后端

1. **添加个人统计API**

```python
# backend/app/routers/stats.py
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
    else:  # month
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
        }
    }
```

### 前端

2. **添加统计图表**

```tsx
// Dashboard.tsx - 在个人工作台下添加

function PeriodSelector({ period, onChange }: { period: string, onChange: (p: string) => void }) {
  return (
    <div className="flex gap-2 mb-4">
      <button onClick={() => onChange('day')} className={`px-3 py-1 rounded ${period === 'day' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>今日</button>
      <button onClick={() => onChange('week')} className={`px-3 py-1 rounded ${period === 'week' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>本周</button>
      <button onClick={() => onChange('month')} className={`px-3 py-1 rounded ${period === 'month' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>本月</button>
    </div>
  )
}

function StatusBreakdown({ byStatus }: { byStatus: Record<string, number> }) {
  const total = Object.values(byStatus).reduce((a, b) => a + b, 0)
  if (total === 0) return <div className="text-gray-500">暂无数据</div>
  
  return (
    <div className="space-y-2">
      {Object.entries(byStatus).map(([status, count]) => (
        <div key={status} className="flex items-center gap-2">
          <div className="w-20 text-sm">{status}</div>
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${(count/total)*100}%` }} />
          </div>
          <div className="w-8 text-sm text-right">{count}</div>
        </div>
      ))}
    </div>
  )
}

// 在 Dashboard 组件中添加
const [summary, setSummary] = useState({ total_count: 0, by_status: {} })
const [period, setPeriod] = useState('week')

useEffect(() => {
  api.get(`/stats/my-summary?period=${period}`).then(res => setSummary(res.data))
}, [period])

// 在渲染中添加
<div className="mt-6">
  <h2 className="text-lg font-semibold mb-4">个人统计</h2>
  <PeriodSelector period={period} onChange={setPeriod} />
  <div className="bg-white p-4 rounded-lg shadow">
    <div className="text-3xl font-bold mb-4">{summary.total_count}</div>
    <StatusBreakdown byStatus={summary.by_status} />
  </div>
</div>
```

3. **提交**

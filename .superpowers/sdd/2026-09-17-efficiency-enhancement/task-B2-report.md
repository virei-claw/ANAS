# Task B2: 个人统计报表 - 完成报告

## 任务概述
实现个人统计报表功能，支持按日/周/月统计标注工作量。

## 完成内容

### 后端实现
**文件**: `backend/app/routers/stats.py`

新增 `/api/stats/my-summary` API endpoint：
- 支持 `period` 查询参数：`day`、`week`、`month`
- 返回当前用户的标注统计：`total_count` 和 `by_status`（draft/submitted/approved/rejected）
- 使用 `current_user` 依赖注入获取当前登录用户

```python
@router.get("/my-summary")
def get_my_summary(
    period: str = "week",  # day, week, month
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的个人统计报表，支持按日/周/月统计"""
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

### 前端实现
**文件**: `frontend/src/pages/Dashboard.tsx`

1. 新增 `MySummary` 接口类型
2. 添加状态：`mySummary` 和 `summaryPeriod`
3. 新增 `useEffect` 监听 `summaryPeriod` 变化，调用 API
4. 添加个人统计报表 UI 组件：
   - 时期选择器（今日/本周/本月）
   - 总标注数显示
   - 状态分布进度条

### 测试用例
**文件**: `backend/tests/test_stats_api.py`

新增 3 个测试：
- `test_my_summary_requires_auth` - 验证需要认证
- `test_my_summary_with_auth` - 验证返回数据结构
- `test_my_summary_period_filter` - 验证日/周/月参数

## 修改文件清单
- `backend/app/routers/stats.py` - 新增 my-summary API
- `backend/tests/test_stats_api.py` - 新增测试用例
- `frontend/src/pages/Dashboard.tsx` - 新增个人统计 UI

## 备注
- 后端代码语法检查通过
- 前端代码符合需求文档规范
- 测试环境 psycopg2 驱动有 DLL 加载问题（非代码问题）

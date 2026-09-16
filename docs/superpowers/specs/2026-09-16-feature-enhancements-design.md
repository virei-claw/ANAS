# 异音检测数据标注系统 - 功能增强设计文档

**日期**: 2026-09-16
**版本**: v1.0
**状态**: 已批准

---

## 1. 概述

本设计文档涵盖8个功能增强，所有功能均为现有系统的增量开发，不影响现有功能。

### 1.1 功能列表

| # | 功能名称 | 优先级 | 预计工时 |
|---|---------|--------|---------|
| 1 | 标注详情页 - 查看/编辑 | P0 | 4h |
| 2 | 批量操作 - 批量删除/批量提交审核 | P1 | 4h |
| 3 | 标注预览 - 列表中预览时间段 | P2 | 2h |
| 4 | 审核历史 - 查看审核记录 | P0 | 3h |
| 5 | 音频播放控制增强 - 倍速/快进/循环 | P1 | 3h |
| 6 | 数据统计细化 - 按用户/时间统计 | P2 | 4h |
| 7 | 标注导入 - CSV/Excel批量导入 | P3 | 6h |
| 8 | 用户管理 - 角色权限管理 | P1 | 6h |

---

## 2. 功能详细设计

### 2.1 功能1: 标注详情页（查看/编辑）

**状态**: 进行中

#### 需求描述
在音频详情页，标注列表中点击"查看详情"按钮，弹出 Modal 显示标注完整信息，支持编辑保存。

#### 技术方案

**后端** (已有，无需修改):
- `GET /api/annotations/{id}` - 获取单条标注
- `PUT /api/annotations/{id}` - 更新标注

**前端**:
- 新增 `AnnotationDetailModal` 组件 (`AudioDetail.tsx` 内)
- Modal 功能:
  - 查看模式: 显示所有标注字段（零部件、异响类型、路面、车速、温度、场景、原因、解决方案、时间段、状态、标注人、创建时间）
  - 编辑模式: 支持修改所有可编辑字段
  - 保存后刷新列表

**文件变更**:
- `frontend/src/pages/AudioDetail.tsx` - 新增 Modal 组件和详情按钮

---

### 2.2 功能2: 批量操作

#### 需求描述
支持批量删除音频、批量提交标注审核。

#### 技术方案

**后端**:
- `audio.py` 已有 `delete` 单条删除
- 新增 `POST /api/annotations/batch-submit` 批量提交审核

**前端**:
- `AudioList.tsx` 批量操作栏增加"批量提交审核"按钮
- 批量选择逻辑已存在

**文件变更**:
- `backend/app/routers/annotation.py` - 新增批量提交端点
- `frontend/src/pages/AudioList.tsx` - 扩展批量操作

---

### 2.3 功能3: 标注预览

#### 需求描述
在音频列表中，有标注的音频行悬浮时显示已标注的时间段列表。

#### 技术方案

**后端**: 无需修改（复用现有 `GET /api/annotations?audio_id=`）

**前端**:
- `AudioList.tsx` 表格行添加悬浮层
- 音频有标注时显示时间段预览

**文件变更**:
- `frontend/src/pages/AudioList.tsx` - 新增预览悬浮层

---

### 2.4 功能4: 审核历史

#### 需求描述
查看每条标注的审核记录（谁审核的、审核时间、打回原因等）。

#### 技术方案

**后端**:
- 已有 `AnnotationHistory` 表
- 新增 `GET /api/annotations/{id}/history` 端点

**前端**:
- 在 `AnnotationDetailModal` 中增加"审核历史"Tab
- 显示历史记录列表

**文件变更**:
- `backend/app/routers/review.py` - 新增历史查询端点
- `frontend/src/pages/AudioDetail.tsx` - 新增历史记录展示

---

### 2.5 功能5: 音频播放控制增强

#### 需求描述
增加倍速播放、快进快退、循环播放功能。

#### 技术方案

**后端**: 无需修改

**前端**:
- `AudioWaveform.tsx` 新增控制栏:
  - 倍速选择: 0.5x, 0.75x, 1x, 1.25x, 1.5x, 2x
  - 快进/快退: ±10秒
  - 循环播放: 开关

**文件变更**:
- `frontend/src/components/AudioWaveform.tsx` - 扩展播放控制

---

### 2.6 功能6: 数据统计细化

#### 需求描述
按用户、时间、类型统计标注工作量。

#### 技术方案

**后端**:
- 扩展 `stats.py`:
  - `GET /stats/user-workload` - 按用户统计
  - `GET /stats/annotation-trend` - 更细粒度趋势

**前端**:
- `Dashboard.tsx` 新增:
  - 用户工作量排行榜
  - 标注类型分布图

**文件变更**:
- `backend/app/routers/stats.py` - 扩展统计端点
- `frontend/src/pages/Dashboard.tsx` - 新增图表

---

### 2.7 功能7: 标注导入

#### 需求描述
支持 CSV/Excel 批量导入标注数据。

#### 技术方案

**后端**:
- 新增 `POST /api/annotations/import`
- 支持 CSV/Excel 格式
- 导入前校验，错误行跳过

**前端**:
- 新增导入页面或入口
- 上传向导 UI

**文件变更**:
- `backend/app/routers/annotation.py` - 新增导入端点
- 新增 `frontend/src/pages/Import.tsx`

---

### 2.8 功能8: 用户管理

#### 需求描述
完整的角色权限管理（普通用户/审核员/管理员）。

#### 技术方案

**后端**:
- 已有 User/Role 模型
- 新增:
  - `GET/POST/PUT/DELETE /api/users` - 用户 CRUD
  - `GET/POST/DELETE /api/roles` - 角色 CRUD
  - 通用权限中间件 `require_role(roles: List[str])`

**前端**:
- `Settings.tsx` 新增用户管理 Tab
- 用户列表、角色分配

**文件变更**:
- `backend/app/routers/user.py` - 新建用户路由
- `backend/app/routers/auth.py` - 改进权限中间件
- `frontend/src/pages/Settings.tsx` - 新增用户管理界面

---

## 3. 实现进度

| 功能 | 状态 | 备注 |
|------|------|------|
| 1. 标注详情页 | ✅ 已完成 | 前端 Modal 组件 |
| 2. 批量操作 | ⏳ 待开发 | |
| 3. 标注预览 | ⏳ 待开发 | |
| 4. 审核历史 | ⏳ 待开发 | |
| 5. 播放控制增强 | ⏳ 待开发 | |
| 6. 数据统计 | ⏳ 待开发 | |
| 7. 标注导入 | ⏳ 待开发 | |
| 8. 用户管理 | ⏳ 待开发 | |

---

## 4. 测试策略

- 前端: Vitest 单元测试 + 集成测试
- 后端: pytest 单元测试
- 每个功能必须测试通过后才能提交

---

## 5. 风险与依赖

- WaveSurfer.js v7 API 稳定性
- 数据库迁移（如需要新表）
- 批量操作的事务处理

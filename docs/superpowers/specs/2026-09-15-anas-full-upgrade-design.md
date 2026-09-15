# ANAS 异音检测数据标注系统 - 完整升级规范

## 1. 概述

### 1.1 项目背景
ANAS（Abnormal Noise Annotation System）是一个音频异响标注平台，当前版本仅支持基础的上传、播放和标注功能。UI 缺乏专业感，缺少用户系统和权限管理，无法支持团队协作。

### 1.2 升级目标
1. **UI 专业度提升** - 对标大厂标准，增强视觉设计和交互体验
2. **用户认证系统** - 注册/登录/JWT Token
3. **权限管理系统** - RBAC 角色控制
4. **效率工具** - 快捷键、批量操作、数据导出
5. **数据分析** - 标注统计仪表板
6. **标注工作流** - 多人协作、审核流程、标注历史
7. **项目管理** - 任务分配、AI 预标注、Webhook

### 1.3 实施范围
- 前端：React 18 + TypeScript + Vite + Tailwind CSS
- 后端：FastAPI + SQLAlchemy + Pydantic
- 数据库：PostgreSQL（可重建）

---

## 2. UI/UX 升级

### 2.1 导航栏改造
**当前**：纯文字导航栏
**升级后**：
```
┌─────────────────────────────────────────────────────────────────────┐
│ 🔊 ANAS    音频管理  标注任务  统计分析  设置        用户名 ▼ 退出 │
└─────────────────────────────────────────────────────────────────────┘
```
- 添加 Logo（🔊 图标 + "ANAS" 文字）
- 添加面包屑导航（如：首页 / 音频管理 / 音频列表）
- 用户下拉菜单（个人中心、退出登录）
- 移动端响应式折叠菜单
- 图标按钮（使用 lucide-react 图标库）

### 2.2 页面布局（带筛选器）
```
┌─────────────────────────────────────────────────────────────────────┐
│ 🔊 ANAS    音频管理  标注任务  统计分析  设置        用户名 ▼     │
├─────────────────────────────────────────────────────────────────────┤
│  全部  |  已标注  |  未标注        🔍 搜索音频...   [+ 上传]    │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  ☐ │ 文件名            │ 时长   │ 状态    │ 操作        │   │
│  ├───┼────────────────────┼────────┼─────────┼──────────────┤   │
│  │ ☐ │ audio_001.wav     │ 02:30  │ 已标注  │ 查看 删除   │   │
│  │ ☐ │ audio_002.wav     │ 01:45  │ 未标注  │ 查看 删除   │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│              < 上一页  1  2  3  ...  10  下一页 >                  │
└─────────────────────────────────────────────────────────────────────┘
```
- 筛选标签页：全部 / 已标注 / 未标注 / 审核中
- 带图标的搜索框
- 主/次按钮层级区分
- 表格斑马纹 + 悬停高亮

### 2.2 Toast 通知系统
使用 `react-hot-toast` 实现：
- 上传成功：`toast.success('音频上传成功')`
- 上传失败：`toast.error('上传失败，请重试')`
- 删除成功：`toast.success('删除成功')`
- 操作失败：`toast.error(error.message)`

### 2.3 骨架屏加载
```tsx
// 替代 "加载中..." 文字
{loading ? (
  <div className="animate-pulse space-y-4">
    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 rounded"></div>
    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
  </div>
) : (...)}
```

### 2.4 上传进度条
```tsx
// 使用 axios progress 事件
onUploadProgress: (progressEvent) => {
  const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
  setUploadProgress(percent)
}
```
显示进度条百分比和进度条动画。

### 2.5 表格升级
- 添加斑马纹条纹（`odd:bg-gray-50`）
- 悬停高亮（`hover:bg-indigo-50`）
- 选中状态（checkbox 多选）
- 分页器（`Page 1 of 10` + 首页/上一页/下一页/末页）
- 排序（点击表头排序）

### 2.6 空状态设计
```tsx
{audios.length === 0 ? (
  <div className="text-center py-16">
    <div className="text-6xl mb-4">📭</div>
    <h3 className="text-lg font-medium text-gray-900">暂无音频文件</h3>
    <p className="text-gray-500 mt-1">点击上方按钮上传第一个音频</p>
  </div>
) : (...)}
```

---

## 3. 用户认证系统

### 3.1 数据库模型

#### Users 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| username | VARCHAR(50) | 用户名，唯一 |
| email | VARCHAR(100) | 邮箱，唯一 |
| password_hash | VARCHAR(255) | 密码哈希 |
| full_name | VARCHAR(100) | 真实姓名 |
| is_active | BOOLEAN | 是否激活 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### Roles 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| name | VARCHAR(50) | 角色名：admin/annotator/viewer |
| description | VARCHAR(255) | 描述 |

#### UserRoles 表
| 字段 | 类型 | 说明 |
|------|------|------|
| user_id | UUID | 外键 |
| role_id | UUID | 外键 |

#### AuditLogs 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 操作人 |
| action | VARCHAR(50) | 操作类型 |
| resource | VARCHAR(100) | 资源类型 |
| resource_id | VARCHAR(36) | 资源 ID |
| details | JSON | 详情 |
| ip_address | VARCHAR(50) | IP 地址 |
| created_at | DATETIME | 时间 |

### 3.2 API 端点

#### 认证
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| POST | /api/auth/logout | 登出 |
| GET | /api/auth/me | 获取当前用户信息 |

#### 用户管理（管理员）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/users | 用户列表 |
| GET | /api/users/{id} | 用户详情 |
| PUT | /api/users/{id} | 更新用户 |
| DELETE | /api/users/{id} | 删除用户 |
| PUT | /api/users/{id}/role | 分配角色 |

#### 操作日志（管理员）
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/audit-logs | 日志列表 |
| GET | /api/audit-logs/export | 导出日志 |

### 3.3 JWT Token 结构
```json
{
  "sub": "user_id",
  "username": "zhangsan",
  "role": "admin",
  "exp": 1699999999
}
```

### 3.4 路由保护
```tsx
// AuthContext.tsx
const AuthContext = createContext<AuthContextType | null>(null)

// 路由守卫
<ProtectedRoute>
  <Layout />
</ProtectedRoute>

// 公开路由（登录/注册）
<PublicRoute>
  <LoginPage />
</PublicRoute>
```

---

## 4. 权限管理系统

### 4.1 角色定义

| 角色 | 权限 |
|------|------|
| **admin** | 所有功能：用户管理、音频管理、标注管理、字典管理、系统设置、查看日志 |
| **annotator** | 音频上传、标注创建/编辑/删除、查看自己标注 |
| **viewer** | 只读：查看音频和标注 |

### 4.2 权限控制点
- 后端：API 中间件检查 Token 和角色
- 前端：UI 条件渲染（`{user.role === 'admin' && <AdminPanel />}`）

---

## 5. 标注工作流

### 5.1 多人协作
- 同一音频可分配给多个标注员
- 标注员只能查看和编辑自己被分配的音频
- 管理员可查看所有标注

### 5.2 审核流程
```
标注员创建标注 → 提交审核 → 管理员审核 → 通过/打回
                                         ↓
                                   打回：标注员重新修改
                                   通过：标注完成，进入统计
```

**API 端点**：
| 方法 | 路径 | 说明 |
|------|------|------|
| PUT | /api/annotations/{id}/submit | 提交审核 |
| PUT | /api/annotations/{id}/approve | 审核通过 |
| PUT | /api/annotations/{id}/reject | 审核打回 |

**标注状态**：
| 状态 | 说明 |
|------|------|
| draft | 草稿（未提交） |
| submitted | 已提交审核 |
| approved | 审核通过 |
| rejected | 审核打回 |

### 5.3 标注历史
- 每次修改记录版本号
- 可查看历史版本对比
- 支持版本回滚

### 5.4 任务分配
- 管理员创建标注任务
- 将音频/音频集合分配给指定标注员
- 标注员工作台显示待办任务列表

## 6. 效率工具

### 6.1 快捷键
| 快捷键 | 功能 |
|--------|------|
| `Space` | 播放/暂停音频 |
| `←` | 后退 5 秒 |
| `→` | 前进 5 秒 |
| `Delete` | 删除选中项 |
| `Ctrl+A` | 全选 |
| `Esc` | 取消选择/关闭弹窗 |

### 5.2 批量操作
- 批量选择（checkbox）
- 批量删除
- 批量导出

### 5.3 数据导出
支持导出格式：
- CSV
- Excel (.xlsx)

导出内容包括：
- 音频元数据
- 标注详情
- 统计汇总

---

## 7. 项目管理（对标 Label Studio）

### 7.1 项目概念
- 一个项目包含多个音频
- 项目可设置标注模板
- 支持图像/文本/音频/视频多模态扩展

### 7.2 Webhook 集成
- AI 预标注：音频上传后自动调用 AI 接口预标注
- 标注完成通知：标注审核通过后发送 Webhook 通知
- 配置项：Webhook URL + Secret Key

### 7.3 API 端点
| 方法 | 路径 | 说明 |
|------|------|------|
| GET/POST | /api/projects | 项目列表/创建 |
| GET/PUT/DELETE | /api/projects/{id} | 项目 CRUD |
| POST | /api/projects/{id}/assign | 分配标注员 |
| POST | /api/webhooks/config | 配置 Webhook |

## 8. 统计分析

### 8.1 仪表板页面 `/dashboard`

```
┌─────────────────────────────────────────────────────────────────────┐
│  统计分析                                                           │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │ 总音频数  │  │ 总标注数  │  │ 今日标注  │  │ 标注员数  │           │
│  │   128    │  │   456    │  │    23    │  │    12    │           │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘           │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                    标注趋势图 (ECharts)                       │  │
│  │  30 ─                                                   ___   │  │
│  │  25 ─                                              ___        │  │
│  │  20 ─                                         ___             │  │
│  │  15 ─                                   ____                    │  │
│  │  10 ─                             ____                         │  │
│  │   5 ─                       ____                               │  │
│  │   0 ─__________________                                        │  │
│  │        周一  周二  周三  周四  周五  周六  周日                   │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌────────────────────────┐  ┌────────────────────────┐            │
│  │   标注类型分布         │  │   零部件问题排行        │            │
│  │   [饼图]              │  │   [柱状图]             │            │
│  └────────────────────────┘  └────────────────────────┘            │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 统计指标
- 每日/周/月标注数量
- 人均标注效率
- 各类型异响占比
- 高频问题零部件 TOP 10

---

## 9. 实施计划

### Phase 1: UI 体验优化
| 序号 | 任务 | 文件 |
|------|------|------|
| 1.1 | 添加 react-hot-toast | frontend/package.json |
| 1.2 | Toast 通知集成 | 前端各页面 |
| 1.3 | 骨架屏组件 | components/Skeleton.tsx |
| 1.4 | 上传进度条 | AudioList.tsx |
| 1.5 | 表格分页 | AudioList.tsx |
| 1.6 | 空状态设计 | AudioList.tsx |

### Phase 2: 用户认证
| 序号 | 任务 | 文件 |
|------|------|------|
| 2.1 | User/Role 模型 | backend/app/models/user.py |
| 2.2 | 注册/登录 API | backend/app/routers/auth.py |
| 2.3 | JWT 中间件 | backend/app/middleware/auth.py |
| 2.4 | 登录/注册页面 | frontend/src/pages/Login.tsx |
| 2.5 | AuthContext | frontend/src/contexts/AuthContext.tsx |
| 2.6 | 路由守卫 | App.tsx |

### Phase 3: 权限管理 + 标注工作流
| 序号 | 任务 | 文件 |
|------|------|------|
| 3.1 | AuditLog 模型 | backend/app/models/audit.py |
| 3.2 | 权限中间件 | backend/app/middleware/rbac.py |
| 3.3 | 管理员面板 | frontend/src/pages/Admin.tsx |
| 3.4 | 操作日志页面 | frontend/src/pages/AuditLogs.tsx |
| 3.5 | 标注状态字段 | backend/app/models/annotation.py |
| 3.6 | 审核 API | backend/app/routers/review.py |
| 3.7 | 标注历史表 | backend/app/models/annotation_history.py |
| 3.8 | 任务分配表 | backend/app/models/task.py |

### Phase 4: 效率工具 + 项目管理
| 序号 | 任务 | 文件 |
|------|------|------|
| 4.1 | 快捷键 Hook | frontend/src/hooks/useHotKeys.ts |
| 4.2 | 批量选择/操作 | AudioList.tsx |
| 4.3 | 数据导出 API | backend/app/routers/export.py |
| 4.4 | 导出功能 | frontend/src/pages/Export.tsx |
| 4.5 | 项目模型 | backend/app/models/project.py |
| 4.6 | 项目管理 API | backend/app/routers/project.py |
| 4.7 | 项目管理页面 | frontend/src/pages/Projects.tsx |
| 4.8 | Webhook 配置 | backend/app/routers/webhook.py |

### Phase 5: 统计分析
| 序号 | 任务 | 文件 |
|------|------|------|
| 5.1 | 统计 API | backend/app/routers/stats.py |
| 5.2 | 仪表板页面 | frontend/src/pages/Dashboard.tsx |
| 5.3 | ECharts 图表 | Dashboard.tsx |

---

## 10. 技术依赖

### 前端新增依赖
```json
{
  "react-hot-toast": "^2.4.1",
  "echarts": "^5.5.0",
  "echarts-for-react": "^3.0.2",
  "xlsx": "^0.18.5"
}
```

### 后端新增依赖
```txt
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
openpyxl==3.1.2
```

---

## 11. 数据库迁移

### 迁移脚本
```sql
-- Users 表
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Roles 表
CREATE TABLE roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description VARCHAR(255)
);

-- UserRoles 表
CREATE TABLE user_roles (
    user_id VARCHAR(36) REFERENCES users(id),
    role_id VARCHAR(36) REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);

-- AuditLogs 表
CREATE TABLE audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(100),
    resource_id VARCHAR(36),
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 初始化角色
INSERT INTO roles (id, name, description) VALUES
    ('admin-id', 'admin', '系统管理员'),
    ('annotator-id', 'annotator', '标注员'),
    ('viewer-id', 'viewer', '查看者');

-- Projects 表
CREATE TABLE projects (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    webhook_url VARCHAR(500),
    webhook_secret VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tasks 表（标注任务分配）
CREATE TABLE tasks (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) REFERENCES projects(id),
    audio_id VARCHAR(36) REFERENCES audio_files(id),
    assigned_to VARCHAR(36) REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    due_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Annotations 表新增字段
ALTER TABLE annotations ADD COLUMN status VARCHAR(20) DEFAULT 'draft';
ALTER TABLE annotations ADD COLUMN submitted_at TIMESTAMP;
ALTER TABLE annotations ADD COLUMN reviewed_by VARCHAR(36) REFERENCES users(id);
ALTER TABLE annotations ADD COLUMN reviewed_at TIMESTAMP;
ALTER TABLE annotations ADD COLUMN reject_reason TEXT;

-- AnnotationHistory 表（标注历史版本）
CREATE TABLE annotation_history (
    id VARCHAR(36) PRIMARY KEY,
    annotation_id VARCHAR(36) REFERENCES annotations(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    data JSONB NOT NULL,
    changed_by VARCHAR(36) REFERENCES users(id),
    change_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- WebhookLogs 表
CREATE TABLE webhook_logs (
    id VARCHAR(36) PRIMARY KEY,
    url VARCHAR(500) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    payload JSONB,
    response_status INTEGER,
    response_body TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 12. 验收标准

### UI 验收
- [ ] Toast 通知正常显示
- [ ] 骨架屏加载动画
- [ ] 上传进度条实时更新
- [ ] 表格分页正常工作
- [ ] 空状态显示引导文案

### 认证验收
- [ ] 注册/登录功能正常
- [ ] JWT Token 正确解析
- [ ] Token 过期自动跳转登录
- [ ] 登出后清除 Token

### 权限验收
- [ ] admin 可访问所有页面
- [ ] annotator 只能标注
- [ ] viewer 只能查看

### 效率工具验收
- [ ] 快捷键响应正常
- [ ] 批量选择/删除正常
- [ ] CSV/Excel 导出成功

### 标注工作流验收
- [ ] 标注状态：draft → submitted → approved/rejected 正常流转
- [ ] 审核通过/打回功能正常
- [ ] 标注历史可查看

### 项目管理验收
- [ ] 项目创建/编辑/删除正常
- [ ] 标注员分配功能正常
- [ ] Webhook 配置和调用正常

### 统计验收
- [ ] 仪表板数据准确
- [ ] 图表正确渲染

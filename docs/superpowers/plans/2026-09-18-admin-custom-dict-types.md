# 管理员自定义字典类型实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 允许管理员用户在字典管理页面新增自定义字典类型，并对其进行 CRUD 操作

**Architecture:** 
- 新增 `DictType` 模型存储字典类型元信息（type_name, type_code）
- 新增 `DictTypeItem` 模型存储各类型下的具体条目
- 后端 API 支持创建/删除字典类型，向类型添加/删除条目
- 前端支持管理员新增字典类型并管理其条目
- 普通用户只能使用现有字典，不能新增类型

**Tech Stack:** FastAPI + SQLAlchemy + React + TypeScript

**Spec:** 本计划

---

## Global Constraints

- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- TDD 开发流程：先写测试，测试失败后实现

---

## 文件结构

```
backend/
├── app/
│   ├── models/
│   │   └── dict.py          # 新增 DictType, DictTypeItem 模型
│   ├── schemas/
│   │   └── dict.py          # 新增 DictTypeCreate, DictTypeResponse 等 schema
│   └── routers/
│       └── dict.py          # 新增 /dict/types 路由
└── tests/
    └── test_dict_api.py     # 已创建测试文件

frontend/
└── src/
    ├── lib/
    │   └── api.ts           # 新增 dictApi.types 相关接口
    └── pages/
        └── Settings.tsx     # 新增字典类型管理 UI
```

---

## API 设计

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/dict/types` | 获取所有字典类型 | 登录用户 |
| POST | `/api/dict/types` | 创建新字典类型 | 仅管理员 |
| DELETE | `/api/dict/types/{type_id}` | 删除字典类型 | 仅管理员 |
| GET | `/api/dict/types/{type_id}/items` | 获取类型下的所有条目 | 登录用户 |
| POST | `/api/dict/types/{type_id}/items` | 向类型添加条目 | 仅管理员 |
| DELETE | `/api/dict/types/{type_id}/items/{item_id}` | 删除条目 | 仅管理员 |

---

## 数据模型

### DictType
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| type_name | String(100) | 类型显示名称，如"测试项目" |
| type_code | String(100) | 类型代码（唯一），如"test_type" |
| created_at | DateTime | 创建时间 |

### DictTypeItem
| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| dict_type_id | UUID | 关联的字典类型 |
| name | String(100) | 条目名称 |
| created_at | DateTime | 创建时间 |

---

## Task 1: 后端 - 数据模型

**Files:**
- Modify: `backend/app/models/dict.py`
- Test: `backend/tests/test_dict_api.py`

**Interfaces:**
- Produces: `DictType`, `DictTypeItem` SQLAlchemy 模型

- [ ] **Step 1: 编写模型测试（验证RED）**
- [ ] **Step 2: 实现 DictType 和 DictTypeItem 模型**
- [ ] **Step 3: 运行测试验证通过**
- [ ] **Step 4: 提交代码**

---

## Task 2: 后端 - Schema 定义

**Files:**
- Modify: `backend/app/schemas/dict.py`

**Interfaces:**
- Consumes: `DictType`, `DictTypeItem` 模型
- Produces: `DictTypeCreate`, `DictTypeResponse`, `DictTypeItemCreate`, `DictTypeItemResponse` Pydantic 模型

- [ ] **Step 1: 添加 Pydantic Schema**
- [ ] **Step 2: 提交代码**

---

## Task 3: 后端 - API 路由实现

**Files:**
- Modify: `backend/app/routers/dict.py`

**Interfaces:**
- Consumes: `DictType`, `DictTypeItem` 模型及 Schema
- Produces: `/api/dict/types` 相关 API 端点

- [ ] **Step 1: 编写 API 测试**
- [ ] **Step 2: 运行测试验证失败**
- [ ] **Step 3: 实现 API 路由**
- [ ] **Step 4: 运行测试验证通过**
- [ ] **Step 5: 提交代码**

---

## Task 4: 前端 - API 接口

**Files:**
- Modify: `frontend/src/lib/api.ts`

**Interfaces:**
- Produces: `dictApi.types.list()`, `.create()`, `.delete()`, `.items.list()`, `.items.create()`, `.items.delete()`

- [ ] **Step 1: 添加 dictApi.types 相关接口**
- [ ] **Step 2: 提交代码**

---

## Task 5: 前端 - 字典类型管理 UI

**Files:**
- Modify: `frontend/src/pages/Settings.tsx`

**Interfaces:**
- Consumes: `dictApi.types.*` 接口
- Produces: 管理员可在 Settings 页面管理自定义字典类型

- [ ] **Step 1: 在字典管理区域添加"新增字典类型"按钮和对话框**
- [ ] **Step 2: 为每个字典类型显示其条目列表**
- [ ] **Step 3: 支持添加/删除条目**
- [ ] **Step 4: 测试完整流程**
- [ ] **Step 5: 提交代码**

---

## Task 6: 集成测试

- [ ] **Step 1: 运行完整测试套件**
- [ ] **Step 2: 验证所有测试通过**
- [ ] **Step 3: 提交最终代码**

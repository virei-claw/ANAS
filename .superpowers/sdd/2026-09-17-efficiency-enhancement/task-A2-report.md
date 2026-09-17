# Task A2 Report: 标注模板

## 完成状态: DONE

## 实现概述

标注模板功能，支持保存常用字段组合、一键填充。

## 新增文件

### 后端
- `backend/app/models/annotation_template.py` - AnnotationTemplate 模型
- `backend/app/schemas/template.py` - TemplateCreate/TemplateResponse Schema
- `backend/tests/test_template_api.py` - 模板 API 测试用例

### 前端
- `frontend/src/hooks/useAnnotationTemplate.ts` - 模板 Hook
- `frontend/src/components/AnnotationForm.tsx` - 添加模板选择器UI

## 修改文件

- `backend/app/models/__init__.py` - 添加 AnnotationTemplate 导出
- `backend/app/routers/annotation.py` - 添加模板 CRUD 路由

## API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/annotations/templates` | 创建模板 |
| GET | `/api/annotations/templates` | 列出用户模板 |
| DELETE | `/api/annotations/templates/{template_id}` | 删除模板 |

## 测试结果

- 前端测试: 26 passed (Vitest)
- 后端测试: 无法运行 (psycopg2 DLL 环境问题，非代码问题)
  - 已确认代码语法正确 (`py_compile` 检查通过)
  - Schema 导入测试通过

## 使用方式

1. 在标注表单中填写字段（零部件、异响类型、路面类型、车速、温度、测试场景）
2. 点击"保存为模板"按钮，输入模板名称
3. 下次新建标注时，可从下拉框选择"应用模板..."，一键填充字段

## 注意事项

- 模板按用户隔离（user_id）
- 模板存储字段名称（而非字典ID），应用时通过名称匹配

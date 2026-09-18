# 标注支持自定义字典功能实现计划

## 目标
在新建标注时，支持选择管理员创建的自定义字典类型

## 现状
- AnnotationForm 只加载固定的三个字典：partNames, noiseTypes, roadTypes
- 管理员创建的自定义字典类型（DictType）不会显示在标注表单中

## 需要修改的内容

### 1. 前端 - AnnotationForm.tsx
- 加载自定义字典类型列表 `dictApi.types.list()`
- 为每个自定义字典类型添加下拉选择框
- 提交标注时传递选中的自定义字典条目 ID

### 2. 前端 - 标注详情/列表
- 显示标注关联的自定义字典条目

## 实现步骤

### Task 1: 修改 AnnotationForm 加载自定义字典
- 添加 `customTypes` state
- 在 useEffect 中加载 `dictApi.types.list()`
- 为每个自定义字典类型渲染下拉选择框

### Task 2: 提交标注时包含自定义字典数据
- 修改 form state 包含 custom_dict_items
- 修改 handleSubmit 传递完整数据

### Task 3: 测试验证

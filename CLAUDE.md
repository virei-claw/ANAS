# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

异音检测数据标注系统 (ANAS) - 一个前后端分离的音频异响标注平台，支持音频波形/Mel谱可视化、实时回放、异响时间段截取、完整标注信息管理。

## 开发命令

### 后端 (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python run.py        # 启动开发服务器 (http://localhost:8000)
```

### 前端 (React + Vite)
```bash
cd frontend
npm install
npm run dev          # 启动开发服务器 (http://localhost:3000)
npm run build        # 生产构建
```

### 依赖版本要求
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+

## 技术架构

### 后端 (backend/)
- **框架**: FastAPI + SQLAlchemy + Pydantic
- **数据库**: PostgreSQL (连接配置见 `app/config.py`)
- **架构模式**:
  - `app/routers/` - API 路由 (audio, annotation, dict)
  - `app/models/` - SQLAlchemy ORM 模型
  - `app/schemas/` - Pydantic 请求/响应模型

### 前端 (frontend/)
- **框架**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui 组件
- **音频**: WaveSurfer.js v7 (波形/频谱/Regions 选段插件)
- **路由**: React Router v6
- **HTTP**: Axios

### API 结构
所有 API 前缀为 `/api`:
- `POST /api/audio/upload` - 上传音频
- `GET /api/audio` - 音频列表 (分页)
- `GET /api/audio/{id}` - 音频详情
- `DELETE /api/audio/{id}` - 删除音频
- `GET /api/audio/{id}/stream` - 流式播放
- `POST /api/annotations` - 创建标注
- `GET /api/annotations?audio_id=` - 标注列表
- `GET/PUT/DELETE /api/annotations/{id}` - 标注 CRUD
- `GET/POST/DELETE /api/dict/part-names` - 零部件字典
- `GET/POST/DELETE /api/dict/noise-types` - 异响类型字典
- `GET/POST/DELETE /api/dict/road-types` - 路面类型字典

### 数据库表
- `audio_files` - 音频文件 (id, filename, filepath, duration, sample_rate, file_size, created_at)
- `annotations` - 标注 (id, audio_id, part_name_id, noise_type_id, road_type_id, speed, temperature, test_mode, reason, solution, start_time, end_time, created_at)
- `part_names` - 零部件名称字典
- `noise_types` - 异响类型字典
- `road_types` - 路面类型字典

### 前端页面
- `/` - 音频列表页
- `/audio/:id` - 音频详情 + 标注页
- `/settings` - 字典管理页

## 音频可视化组件

`AudioWaveform.tsx` 使用 WaveSurfer.js:
- 波形显示 (waveColor: `#4F46E5`, progressColor: `#7C3AED`)
- Mel谱显示 (SpectrogramPlugin)
- RegionsPlugin 支持拖拽选段
- 播放控制: 播放/暂停、进度跳转、实时时间显示 (mm:ss.ms)

## TDD 开发原则

### 核心规则
1. **实现任何功能前，必须先编写测试用例**
2. 运行测试确保测试失败（红）
3. 实现功能代码
4. 运行测试确保测试通过（绿）
5. 重构代码，确保持续通过（绿）
6. **不完成功能测试不提交代码**
7. Bug修复前先写测试用例复现Bug
8. **所有测试通过后才能提交**

### 测试要求
- 后端使用 pytest 进行单元测试
- 前端使用 Vitest 或 React Testing Library
- 每次提交前必须运行完整测试套件
- 测试覆盖率应覆盖所有业务逻辑

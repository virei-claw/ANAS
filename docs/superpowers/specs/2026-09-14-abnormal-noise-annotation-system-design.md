# 异音检测数据标注系统设计

## 1. 项目概述

### 项目名称
Abnormal Noise Annotation System (ANAS)

### 核心功能
一个前后端分离的异音检测数据标注系统，支持音频波形/Mel谱可视化、实时回放、异响时间段截取、完整标注信息管理。

### 目标用户
异音检测工程师、质量分析人员

---

## 2. 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React + TypeScript + Vite | 现代前端框架 |
| UI组件 | shadcn/ui + Tailwind CSS | 高质量组件库 |
| 音频可视化 | WaveSurfer.js + Regions + Spectrogram | 音频波形/频谱/选段 |
| 后端 | Python + FastAPI | 高性能异步API |
| 数据库 | PostgreSQL | 关系型数据库 |
| 文件存储 | 本地文件系统 (`/uploads`) | 音频文件存储 |

---

## 3. 功能模块

### 3.1 音频文件管理
- **上传音频**：支持 wav/mp3/flac/ogg 格式
- **音频列表**：分页展示，搜索过滤
- **删除音频**：级联删除关联标注

### 3.2 波形与频谱查看
- **波形显示**：WaveSurfer.js 渲染音频波形
- **Mel谱显示**：Spectrogram 插件展示频谱图
- **视图切换**：可切换波形/Mel谱/叠加视图

### 3.3 音频回放控制
- **播放/暂停**：点击波形或按钮控制
- **进度跳转**：点击波形任意位置跳转
- **实时时间显示**：当前播放时间 / 总时长 (mm:ss.ms)

### 3.4 异响时间段截取
- **区域选择**：在波形上拖拽选择时间段
- **时间记录**：自动记录开始/结束时间
- **截取保存**：将选段保存为独立标注

### 3.5 标注信息管理
| 字段 | 类型 | 说明 |
|------|------|------|
| 零部件名称 | 可搜索下拉(支持自定义添加) | 如：刹车片、减震器 |
| 异响类型 | 可搜索下拉(支持自定义添加) | 如：啸叫、摩擦、敲击 |
| 路面类型 | 可搜索下拉(支持自定义添加) | 如：沥青、水泥、碎石 |
| 车速 | 数字输入 (km/h) | 0-300 |
| 温度 | 数字输入 (℃) | -40~100 |
| 测试场景 | 单选按钮 | 动态 / 静态 |
| 原因 | 多行文本输入 | 异响原因描述 |
| 解决方案 | 多行文本输入 | 处理方案建议 |
| 异响时间段 | 自动记录 | 开始时间-结束时间 |
| 创建时间 | 自动记录 | 标注创建时间戳 |

### 3.6 字典管理
- 零部件名称、异响类型、路面类型支持：
  - 查看现有选项列表
  - 添加新选项
  - 删除未使用的选项

---

## 4. 数据库设计

### 4.1 ER图
```
audio_files ──┬── annotations (1:N)
              │
part_names ◄─┼─── annotations
              │
noise_types ◄┼─── annotations
              │
road_types  ◄┘
```

### 4.2 表结构

#### audio_files (音频文件表)
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| filename | VARCHAR(255) | NOT NULL | 原始文件名 |
| filepath | VARCHAR(500) | NOT NULL | 存储路径 |
| duration | FLOAT | NOT NULL | 时长(秒) |
| sample_rate | INTEGER | | 采样率 |
| file_size | BIGINT | NOT NULL | 文件大小(字节) |
| created_at | TIMESTAMP | DEFAULT NOW() | 上传时间 |

#### annotations (标注表)
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| audio_id | UUID | FK → audio_files | 关联音频 |
| part_name_id | UUID | FK → part_names | 零部件 |
| noise_type_id | UUID | FK → noise_types | 异响类型 |
| road_type_id | UUID | FK → road_types | 路面类型 |
| speed | INTEGER | | 车速(km/h) |
| temperature | INTEGER | | 温度(℃) |
| test_mode | VARCHAR(10) | | 'dynamic'/'static' |
| reason | TEXT | | 原因描述 |
| solution | TEXT | | 解决方案 |
| start_time | FLOAT | NOT NULL | 开始时间(秒) |
| end_time | FLOAT | NOT NULL | 结束时间(秒) |
| created_at | TIMESTAMP | DEFAULT NOW() | 创建时间 |

#### part_names (零部件名称字典)
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| name | VARCHAR(100) | UNIQUE, NOT NULL | 名称 |

#### noise_types (异响类型字典)
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | UUID | PK | 主键 |
| name | VARCHAR(100) | UNIQUE, NOT NULL | 名称 |

#### road_types (路面类型字典)
| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|------|
| id | UUID | PK | 主键 |
| name | VARCHAR(100) | UNIQUE, NOT NULL | 名称 |

---

## 5. API设计

### 5.1 音频文件
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/audio/upload | 上传音频文件 |
| GET | /api/audio | 获取音频列表(分页) |
| GET | /api/audio/{id} | 获取音频详情 |
| DELETE | /api/audio/{id} | 删除音频 |
| GET | /api/audio/{id}/stream | 流式播放音频 |

### 5.2 标注
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/annotations | 创建标注 |
| GET | /api/annotations | 获取标注列表 |
| GET | /api/annotations/{id} | 获取标注详情 |
| PUT | /api/annotations/{id} | 更新标注 |
| DELETE | /api/annotations/{id} | 删除标注 |
| GET | /api/audio/{id}/annotations | 获取某音频的所有标注 |

### 5.3 字典管理
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/dict/part-names | 获取零部件列表 |
| POST | /api/dict/part-names | 添加零部件 |
| DELETE | /api/dict/part-names/{id} | 删除零部件 |
| GET | /api/dict/noise-types | 获取异响类型列表 |
| POST | /api/dict/noise-types | 添加异响类型 |
| DELETE | /api/dict/noise-types/{id} | 删除异响类型 |
| GET | /api/dict/road-types | 获取路面类型列表 |
| POST | /api/dict/road-types | 添加路面类型 |
| DELETE | /api/dict/road-types/{id} | 删除路面类型 |

---

## 6. 前端页面结构

```
/                     # 首页/音频列表
/audio/{id}           # 音频详情/标注页面
/audio/{id}/annotate  # 标注编辑页面
/settings             # 字典管理页面
```

### 6.1 音频列表页
- 音频文件表格（名称、时长、上传时间、操作）
- 上传按钮
- 搜索过滤

### 6.2 音频详情页
- WaveSurfer 波形/频谱显示区域
- 播放控制栏（播放/暂停、时间显示）
- 选段工具（拖拽选择）
- 标注信息表单
- 该音频的所有标注列表

---

## 7. 文件结构

```
AbnormalNoiseAnnotation/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI 入口
│   │   ├── config.py            # 配置
│   │   ├── database.py         # 数据库连接
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── audio.py
│   │   │   ├── annotation.py
│   │   │   └── dict.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── audio.py
│   │   │   ├── annotation.py
│   │   │   └── dict.py
│   │   ├── routers/
│   │   │   ├── __init__.py
│   │   │   ├── audio.py
│   │   │   ├── annotation.py
│   │   │   └── dict.py
│   │   └── services/
│   │       ├── __init__.py
│   │       └── audio.py
│   ├── uploads/                  # 音频文件存储
│   ├── requirements.txt
│   └── run.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui 组件
│   │   │   ├── AudioWaveform.tsx
│   │   │   ├── AnnotationForm.tsx
│   │   │   └── DictManager.tsx
│   │   ├── pages/
│   │   │   ├── AudioList.tsx
│   │   │   ├── AudioDetail.tsx
│   │   │   └── Settings.tsx
│   │   ├── lib/
│   │   │   ├── api.ts           # API 客户端
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
│
└── docs/
    └── specs/
        └── 2026-09-14-abnormal-noise-annotation-system-design.md
```

---

## 8. 验收标准

### 8.1 功能验收
- [ ] 可上传音频文件并自动解析时长
- [ ] 波形显示正确，可切换Mel谱视图
- [ ] 播放/暂停/跳转功能正常
- [ ] 实时显示当前播放时间
- [ ] 可拖拽选择时间段并保存为标注
- [ ] 所有标注字段可正常录入和保存
- [ ] 零部件/异响类型/路面类型支持自定义添加
- [ ] 字典项可增删查

### 8.2 非功能验收
- [ ] 音频播放无明显延迟
- [ ] 界面操作流畅
- [ ] 错误提示友好

---

## 9. TODO

- [ ] 初始化项目结构
- [ ] 数据库表创建
- [ ] 后端 API 实现
- [ ] 前端页面实现
- [ ] WaveSurfer 集成
- [ ] 单元测试

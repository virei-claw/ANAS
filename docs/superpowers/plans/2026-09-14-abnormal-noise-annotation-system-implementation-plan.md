# 异音检测数据标注系统实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完成后端 + 前端可运行的异音检测数据标注系统，支持音频上传、波形/Mel谱显示、回放、异响时间段截取、标注管理

**Architecture:** 前后端分离架构，FastAPI 后端 + React 前端，通过 REST API 通信，音频文件本地存储

**Tech Stack:**
- 后端: Python 3.11+ / FastAPI / SQLAlchemy / PostgreSQL
- 前端: React 18 / TypeScript / Vite / shadcn/ui / WaveSurfer.js
- 数据库: PostgreSQL

**Spec:** `docs/superpowers/specs/2026-09-14-abnormal-noise-annotation-system-design.md`

---

## Global Constraints

- Python 3.11+, Node.js 18+
- WaveSurfer.js v7
- FastAPI 0.100+
- React 18+
- PostgreSQL 14+

---

## File Structure

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
│   ├── uploads/
│   ├── requirements.txt
│   └── run.py
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui 组件
│   │   │   ├── AudioWaveform.tsx
│   │   │   ├── AnnotationForm.tsx
│   │   │   ├── AnnotationList.tsx
│   │   │   └── DictManager.tsx
│   │   ├── pages/
│   │   │   ├── AudioList.tsx
│   │   │   ├── AudioDetail.tsx
│   │   │   └── Settings.tsx
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
└── docs/
    └── specs/
        └── 2026-09-14-abnormal-noise-annotation-system-design.md
```

---

## Task Decomposition

### Phase 1: 项目初始化

#### Task 1: 初始化后端项目结构

**Files:**
- Create: `backend/requirements.txt`
- Create: `backend/app/__init__.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`
- Create: `backend/run.py`

**Interfaces:**
- Produces: `backend/run.py` 启动命令

- [ ] **Step 1: 创建 backend/requirements.txt**

```txt
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
asyncpg==0.29.0
psycopg2-binary==2.9.9
pydantic==2.5.3
pydantic-settings==2.1.0
python-multipart==0.0.6
aiofiles==23.2.1
pydub==0.25.1
python-dotenv==1.0.0
```

- [ ] **Step 2: 创建 backend/app/config.py**

```python
from pydantic_settings import BaseSettings
from pathlib import Path

class Settings(BaseSettings):
    PROJECT_NAME: str = "ANAS"
    API_V1_STR: str = "/api"
    UPLOAD_DIR: Path = Path("uploads")
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/anas"

    class Config:
        env_file = ".env"

settings = Settings()
```

- [ ] **Step 3: 创建 backend/app/database.py**

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

- [ ] **Step 4: 创建 backend/app/__init__.py (空文件)**

- [ ] **Step 5: 创建 backend/run.py**

```python
import uvicorn
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
```

---

#### Task 2: 初始化前端项目结构

**Files:**
- Create: `frontend/package.json`
- Create: `frontend/vite.config.ts`
- Create: `frontend/tsconfig.json`
- Create: `frontend/index.html`
- Create: `frontend/src/main.tsx`
- Create: `frontend/src/App.tsx`

**Interfaces:**
- Produces: `frontend/` 可运行的前端项目

- [ ] **Step 1: 创建 frontend/package.json**

```json
{
  "name": "anas-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.21.0",
    "wavesurfer.js": "^7.6.2",
    "wavesurfer.js/plugins/regions": "^7.6.2",
    "wavesurfer.js/plugins/spectrogram": "^7.6.2",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-label": "^2.0.2",
    "@radix-ui/react-select": "^2.0.0",
    "@radix-ui/react-slot": "^1.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.309.0",
    "axios": "^1.6.5"
  },
  "devDependencies": {
    "@types/react": "^18.2.48",
    "@types/react-dom": "^18.2.18",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.33",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3",
    "vite": "^5.0.11"
  }
}
```

- [ ] **Step 2: 创建 frontend/vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 3: 创建 frontend/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 4: 创建 frontend/tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 5: 创建 frontend/index.html**

```html
<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>异音检测数据标注系统</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 6: 创建 frontend/src/main.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
```

- [ ] **Step 7: 创建 frontend/src/index.css**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

- [ ] **Step 8: 创建 frontend/src/App.tsx**

```typescript
import { Routes, Route, Navigate } from 'react-router-dom'
import AudioList from './pages/AudioList'
import AudioDetail from './pages/AudioDetail'
import Settings from './pages/Settings'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <span className="text-xl font-bold">异音检测数据标注系统</span>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<AudioList />} />
        <Route path="/audio/:id" element={<AudioDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  )
}

export default App
```

- [ ] **Step 9: 创建 frontend/tailwind.config.js**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

- [ ] **Step 10: 创建 frontend/postcss.config.js**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

### Phase 2: 后端实现

#### Task 3: 创建数据库模型

**Files:**
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/audio.py`
- Create: `backend/app/models/annotation.py`
- Create: `backend/app/models/dict.py`

**Interfaces:**
- Produces: SQLAlchemy 模型类

- [ ] **Step 1: 创建 backend/app/models/__init__.py**

```python
from app.models.audio import AudioFile
from app.models.annotation import Annotation
from app.models.dict import PartName, NoiseType, RoadType

__all__ = ["AudioFile", "Annotation", "PartName", "NoiseType", "RoadType"]
```

- [ ] **Step 2: 创建 backend/app/models/audio.py**

```python
import uuid
from sqlalchemy import Column, String, Float, Integer, BigInteger, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class AudioFile(Base):
    __tablename__ = "audio_files"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    filename = Column(String(255), nullable=False)
    filepath = Column(String(500), nullable=False)
    duration = Column(Float, nullable=False)
    sample_rate = Column(Integer, nullable=True)
    file_size = Column(BigInteger, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    annotations = relationship("Annotation", back_populates="audio", cascade="all, delete-orphan")
```

- [ ] **Step 3: 创建 backend/app/models/annotation.py**

```python
import uuid
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Annotation(Base):
    __tablename__ = "annotations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audio_id = Column(UUID(as_uuid=True), ForeignKey("audio_files.id", ondelete="CASCADE"), nullable=False)
    part_name_id = Column(UUID(as_uuid=True), ForeignKey("part_names.id"), nullable=True)
    noise_type_id = Column(UUID(as_uuid=True), ForeignKey("noise_types.id"), nullable=True)
    road_type_id = Column(UUID(as_uuid=True), ForeignKey("road_types.id"), nullable=True)
    speed = Column(Integer, nullable=True)
    temperature = Column(Integer, nullable=True)
    test_mode = Column(String(10), nullable=True)  # 'dynamic' or 'static'
    reason = Column(Text, nullable=True)
    solution = Column(Text, nullable=True)
    start_time = Column(Float, nullable=False)
    end_time = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    audio = relationship("AudioFile", back_populates="annotations")
    part_name = relationship("PartName")
    noise_type = relationship("NoiseType")
    road_type = relationship("RoadType")
```

- [ ] **Step 4: 创建 backend/app/models/dict.py**

```python
import uuid
from sqlalchemy import Column, String
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

class PartName(Base):
    __tablename__ = "part_names"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)

class NoiseType(Base):
    __tablename__ = "noise_types"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)

class RoadType(Base):
    __tablename__ = "road_types"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
```

---

#### Task 4: 创建 Pydantic Schemas

**Files:**
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/app/schemas/audio.py`
- Create: `backend/app/schemas/annotation.py`
- Create: `backend/app/schemas/dict.py`

**Interfaces:**
- Consumes: SQLAlchemy 模型
- Produces: Pydantic schemas 用于 API

- [ ] **Step 1: 创建 backend/app/schemas/__init__.py**

```python
from app.schemas.audio import AudioFileCreate, AudioFileResponse, AudioFileList
from app.schemas.annotation import AnnotationCreate, AnnotationUpdate, AnnotationResponse
from app.schemas.dict import DictItemCreate, DictItemResponse

__all__ = [
    "AudioFileCreate", "AudioFileResponse", "AudioFileList",
    "AnnotationCreate", "AnnotationUpdate", "AnnotationResponse",
    "DictItemCreate", "DictItemResponse"
]
```

- [ ] **Step 2: 创建 backend/app/schemas/audio.py**

```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class AudioFileBase(BaseModel):
    filename: str

class AudioFileCreate(AudioFileBase):
    pass

class AudioFileResponse(BaseModel):
    id: UUID
    filename: str
    filepath: str
    duration: float
    sample_rate: Optional[int] = None
    file_size: int
    created_at: datetime

    class Config:
        from_attributes = True

class AudioFileList(BaseModel):
    items: list[AudioFileResponse]
    total: int
    page: int
    page_size: int
```

- [ ] **Step 3: 创建 backend/app/schemas/annotation.py**

```python
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class AnnotationBase(BaseModel):
    speed: Optional[int] = None
    temperature: Optional[int] = None
    test_mode: Optional[str] = None
    reason: Optional[str] = None
    solution: Optional[str] = None
    start_time: float
    end_time: float

class AnnotationCreate(AnnotationBase):
    audio_id: UUID
    part_name_id: Optional[UUID] = None
    noise_type_id: Optional[UUID] = None
    road_type_id: Optional[UUID] = None

class AnnotationUpdate(BaseModel):
    part_name_id: Optional[UUID] = None
    noise_type_id: Optional[UUID] = None
    road_type_id: Optional[UUID] = None
    speed: Optional[int] = None
    temperature: Optional[int] = None
    test_mode: Optional[str] = None
    reason: Optional[str] = None
    solution: Optional[str] = None

class AnnotationResponse(BaseModel):
    id: UUID
    audio_id: UUID
    part_name_id: Optional[UUID] = None
    noise_type_id: Optional[UUID] = None
    road_type_id: Optional[UUID] = None
    speed: Optional[int] = None
    temperature: Optional[int] = None
    test_mode: Optional[str] = None
    reason: Optional[str] = None
    solution: Optional[str] = None
    start_time: float
    end_time: float
    created_at: datetime
    part_name: Optional[str] = None
    noise_type: Optional[str] = None
    road_type: Optional[str] = None

    class Config:
        from_attributes = True
```

- [ ] **Step 4: 创建 backend/app/schemas/dict.py**

```python
from pydantic import BaseModel
from uuid import UUID

class DictItemCreate(BaseModel):
    name: str

class DictItemResponse(BaseModel):
    id: UUID
    name: str

    class Config:
        from_attributes = True
```

---

#### Task 5: 创建 API 路由

**Files:**
- Create: `backend/app/routers/__init__.py`
- Create: `backend/app/routers/audio.py`
- Create: `backend/app/routers/annotation.py`
- Create: `backend/app/routers/dict.py`

**Interfaces:**
- Consumes: Schemas, Database session
- Produces: FastAPI 路由

- [ ] **Step 1: 创建 backend/app/routers/__init__.py**

```python
from app.routers.audio import router as audio_router
from app.routers.annotation import router as annotation_router
from app.routers.dict import router as dict_router

__all__ = ["audio_router", "annotation_router", "dict_router"]
```

- [ ] **Step 2: 创建 backend/app/routers/audio.py**

```python
import os
import uuid
import aiofiles
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from pydub import AudioSegment

from app.database import get_db
from app.models.audio import AudioFile
from app.schemas.audio import AudioFileResponse, AudioFileList

router = APIRouter(prefix="/audio", tags=["audio"])

@router.post("/upload", response_model=AudioFileResponse)
async def upload_audio(file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename")

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ['.wav', '.mp3', '.flac', '.ogg']:
        raise HTTPException(status_code=400, detail="Unsupported file format")

    file_id = uuid.uuid4()
    filepath = f"uploads/{file_id}{ext}"

    os.makedirs("uploads", exist_ok=True)

    async with aiofiles.open(filepath, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)

    audio = AudioSegment.from_file(filepath)
    duration = len(audio) / 1000.0
    sample_rate = audio.frame_rate

    db_audio = AudioFile(
        id=file_id,
        filename=file.filename,
        filepath=filepath,
        duration=duration,
        sample_rate=sample_rate,
        file_size=len(content)
    )
    db.add(db_audio)
    db.commit()
    db.refresh(db_audio)
    return db_audio

@router.get("", response_model=AudioFileList)
def list_audio(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(AudioFile)
    if search:
        query = query.filter(AudioFile.filename.contains(search))

    total = query.count()
    items = query.order_by(AudioFile.created_at.desc()).offset((page-1)*page_size).limit(page_size).all()

    return AudioFileList(items=items, total=total, page=page, page_size=page_size)

@router.get("/{audio_id}", response_model=AudioFileResponse)
def get_audio(audio_id: uuid.UUID, db: Session = Depends(get_db)):
    audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Audio not found")
    return audio

@router.delete("/{audio_id}")
def delete_audio(audio_id: uuid.UUID, db: Session = Depends(get_db)):
    audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Audio not found")

    if os.path.exists(audio.filepath):
        os.remove(audio.filepath)

    db.delete(audio)
    db.commit()
    return {"message": "Deleted"}

@router.get("/{audio_id}/stream")
async def stream_audio(audio_id: uuid.UUID, db: Session = Depends(get_db)):
    audio = db.query(AudioFile).filter(AudioFile.id == audio_id).first()
    if not audio:
        raise HTTPException(status_code=404, detail="Audio not found")

    if not os.path.exists(audio.filepath):
        raise HTTPException(status_code=404, detail="File not found")

    def iterfile():
        with open(audio.filepath, 'rb') as f:
            while chunk := f.read(65536):
                yield chunk

    from fastapi.responses import StreamingResponse
    return StreamingResponse(iterfile(), media_type="audio/mpeg", headers={"Content-Disposition": f"inline; filename={audio.filename}"})
```

- [ ] **Step 3: 创建 backend/app/routers/annotation.py**

```python
import uuid
from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from app.database import get_db
from app.models.annotation import Annotation
from app.models.dict import PartName, NoiseType, RoadType
from app.schemas.annotation import AnnotationCreate, AnnotationUpdate, AnnotationResponse

router = APIRouter(prefix="/annotations", tags=["annotations"])

@router.post("", response_model=AnnotationResponse)
def create_annotation(data: AnnotationCreate, db: Session = Depends(get_db)):
    annotation = Annotation(**data.model_dump())
    db.add(annotation)
    db.commit()
    db.refresh(annotation)
    return AnnotationResponse(
        **annotation.__dict__,
        part_name=annotation.part_name.name if annotation.part_name else None,
        noise_type=annotation.noise_type.name if annotation.noise_type else None,
        road_type=annotation.road_type.name if annotation.road_type else None
    )

@router.get("", response_model=List[AnnotationResponse])
def list_annotations(
    audio_id: Optional[uuid.UUID] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Annotation)
    if audio_id:
        query = query.filter(Annotation.audio_id == audio_id)

    annotations = query.order_by(Annotation.created_at.desc()).all()
    result = []
    for a in annotations:
        result.append(AnnotationResponse(
            **a.__dict__,
            part_name=a.part_name.name if a.part_name else None,
            noise_type=a.noise_type.name if a.noise_type else None,
            road_type=a.road_type.name if a.road_type else None
        ))
    return result

@router.get("/{annotation_id}", response_model=AnnotationResponse)
def get_annotation(annotation_id: uuid.UUID, db: Session = Depends(get_db)):
    annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    return AnnotationResponse(
        **annotation.__dict__,
        part_name=annotation.part_name.name if annotation.part_name else None,
        noise_type=annotation.noise_type.name if annotation.noise_type else None,
        road_type=annotation.road_type.name if annotation.road_type else None
    )

@router.put("/{annotation_id}", response_model=AnnotationResponse)
def update_annotation(annotation_id: uuid.UUID, data: AnnotationUpdate, db: Session = Depends(get_db)):
    annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(annotation, key, value)

    db.commit()
    db.refresh(annotation)
    return AnnotationResponse(
        **annotation.__dict__,
        part_name=annotation.part_name.name if annotation.part_name else None,
        noise_type=annotation.noise_type.name if annotation.noise_type else None,
        road_type=annotation.road_type.name if annotation.road_type else None
    )

@router.delete("/{annotation_id}")
def delete_annotation(annotation_id: uuid.UUID, db: Session = Depends(get_db)):
    annotation = db.query(Annotation).filter(Annotation.id == annotation_id).first()
    if not annotation:
        raise HTTPException(status_code=404, detail="Annotation not found")
    db.delete(annotation)
    db.commit()
    return {"message": "Deleted"}
```

- [ ] **Step 4: 创建 backend/app/routers/dict.py**

```python
import uuid
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models.dict import PartName, NoiseType, RoadType
from app.schemas.dict import DictItemCreate, DictItemResponse

router = APIRouter(prefix="/dict", tags=["dict"])

# Part Names
@router.get("/part-names", response_model=List[DictItemResponse])
def list_part_names(db: Session = Depends(get_db)):
    return db.query(PartName).all()

@router.post("/part-names", response_model=DictItemResponse)
def create_part_name(data: DictItemCreate, db: Session = Depends(get_db)):
    existing = db.query(PartName).filter(PartName.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already exists")
    item = PartName(name=data.name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/part-names/{item_id}")
def delete_part_name(item_id: uuid.UUID, db: Session = Depends(get_db)):
    item = db.query(PartName).filter(PartName.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}

# Noise Types
@router.get("/noise-types", response_model=List[DictItemResponse])
def list_noise_types(db: Session = Depends(get_db)):
    return db.query(NoiseType).all()

@router.post("/noise-types", response_model=DictItemResponse)
def create_noise_type(data: DictItemCreate, db: Session = Depends(get_db)):
    existing = db.query(NoiseType).filter(NoiseType.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already exists")
    item = NoiseType(name=data.name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/noise-types/{item_id}")
def delete_noise_type(item_id: uuid.UUID, db: Session = Depends(get_db)):
    item = db.query(NoiseType).filter(NoiseType.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}

# Road Types
@router.get("/road-types", response_model=List[DictItemResponse])
def list_road_types(db: Session = Depends(get_db)):
    return db.query(RoadType).all()

@router.post("/road-types", response_model=DictItemResponse)
def create_road_type(data: DictItemCreate, db: Session = Depends(get_db)):
    existing = db.query(RoadType).filter(RoadType.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already exists")
    item = RoadType(name=data.name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.delete("/road-types/{item_id}")
def delete_road_type(item_id: uuid.UUID, db: Session = Depends(get_db)):
    item = db.query(RoadType).filter(RoadType.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}
```

---

#### Task 6: 创建 FastAPI 主应用

**Files:**
- Create: `backend/app/main.py`

**Interfaces:**
- Consumes: Routers, Database models
- Produces: FastAPI app 实例

- [ ] **Step 1: 创建 backend/app/main.py**

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.routers import audio_router, annotation_router, dict_router
from app.config import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="0.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(audio_router, prefix=settings.API_V1_STR)
app.include_router(annotation_router, prefix=settings.API_V1_STR)
app.include_router(dict_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "ANAS API", "version": "0.1.0"}

@app.get("/health")
def health():
    return {"status": "ok"}
```

---

### Phase 3: 前端实现

#### Task 7: 创建 API 客户端和工具函数

**Files:**
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/utils.ts`

**Interfaces:**
- Produces: API 调用函数

- [ ] **Step 1: 创建 frontend/src/lib/api.ts**

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

export interface AudioFile {
  id: string
  filename: string
  filepath: string
  duration: number
  sample_rate: number
  file_size: number
  created_at: string
}

export interface Annotation {
  id: string
  audio_id: string
  part_name_id: string | null
  noise_type_id: string | null
  road_type_id: string | null
  speed: number | null
  temperature: number | null
  test_mode: string | null
  reason: string | null
  solution: string | null
  start_time: number
  end_time: number
  created_at: string
  part_name: string | null
  noise_type: string | null
  road_type: string | null
}

export interface DictItem {
  id: string
  name: string
}

export const audioApi = {
  upload: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<AudioFile>('/audio/upload', formData)
  },
  list: (page = 1, pageSize = 20, search?: string) => {
    return api.get<{ items: AudioFile[]; total: number; page: number; page_size: number }>('/audio', {
      params: { page, page_size: pageSize, search },
    })
  },
  get: (id: string) => api.get<AudioFile>(`/audio/${id}`),
  delete: (id: string) => api.delete(`/audio/${id}`),
  streamUrl: (id: string) => `/api/audio/${id}/stream`,
}

export const annotationApi = {
  create: (data: Partial<Annotation>) => api.post<Annotation>('/annotations', data),
  list: (audioId?: string) => api.get<Annotation[]>('/annotations', { params: { audio_id: audioId } }),
  get: (id: string) => api.get<Annotation>(`/annotations/${id}`),
  update: (id: string, data: Partial<Annotation>) => api.put<Annotation>(`/annotations/${id}`, data),
  delete: (id: string) => api.delete(`/annotations/${id}`),
}

export const dictApi = {
  partNames: {
    list: () => api.get<DictItem[]>('/dict/part-names'),
    create: (name: string) => api.post<DictItem>('/dict/part-names', { name }),
    delete: (id: string) => api.delete(`/dict/part-names/${id}`),
  },
  noiseTypes: {
    list: () => api.get<DictItem[]>('/dict/noise-types'),
    create: (name: string) => api.post<DictItem>('/dict/noise-types', { name }),
    delete: (id: string) => api.delete(`/dict/noise-types/${id}`),
  },
  roadTypes: {
    list: () => api.get<DictItem[]>('/dict/road-types'),
    create: (name: string) => api.post<DictItem>('/dict/road-types', { name }),
    delete: (id: string) => api.delete(`/dict/road-types/${id}`),
  },
}

export default api
```

- [ ] **Step 2: 创建 frontend/src/lib/utils.ts**

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 100)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
```

---

#### Task 8: 创建 AudioWaveform 组件

**Files:**
- Create: `frontend/src/components/AudioWaveform.tsx`

**Interfaces:**
- Props: `audioUrl: string, onRegionSave?: (start: number, end: number) => void`
- Produces: 波形显示 + 选段功能

- [ ] **Step 1: 创建 frontend/src/components/AudioWaveform.tsx**

```typescript
import { useEffect, useRef, useState, useCallback } from 'react'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/plugins/regions'
import SpectrogramPlugin from 'wavesurfer.js/plugins/spectrogram'
import { formatTime } from '@/lib/utils'

interface AudioWaveformProps {
  audioUrl: string
  onRegionSave?: (start: number, end: number) => void
}

export default function AudioWaveform({ audioUrl, onRegionSave }: AudioWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<WaveSurfer | null>(null)
  const regionsRef = useRef<RegionsPlugin | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [viewMode, setViewMode] = useState<'wave' | 'spectrogram'>('wave')
  const [region, setRegion] = useState<{ start: number; end: number } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const regions = RegionsPlugin.create()
    regionsRef.current = regions

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4F46E5',
      progressColor: '#7C3AED',
      cursorColor: '#EF4444',
      plugins: [
        regions,
        SpectrogramPlugin.create({
          labels: true,
          frequencyMax: 8000,
        }),
      ],
    })

    wavesurferRef.current = ws

    ws.on('play', () => setIsPlaying(true))
    ws.on('pause', () => setIsPlaying(false))
    ws.on('timeupdate', (time) => setCurrentTime(time))
    ws.on('ready', () => setDuration(ws.getDuration()))
    ws.on('finish', () => setIsPlaying(false))

    regions.on('region-created', (reg) => {
      setRegion({ start: reg.start, end: reg.end })
    })

    regions.on('region-updated', (reg) => {
      setRegion({ start: reg.start, end: reg.end })
    })

    ws.load(audioUrl)

    return () => {
      ws.destroy()
    }
  }, [audioUrl])

  const togglePlay = useCallback(() => {
    wavesurferRef.current?.playPause()
  }, [])

  const handleSaveRegion = useCallback(() => {
    if (region && onRegionSave) {
      onRegionSave(region.start, region.end)
      regionsRef.current?.clearRegions()
      setRegion(null)
    }
  }, [region, onRegionSave])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          {isPlaying ? '暂停' : '播放'}
        </button>
        <div className="text-sm">
          <span className="font-mono">{formatTime(currentTime)}</span>
          <span className="mx-2">/</span>
          <span className="font-mono">{formatTime(duration)}</span>
        </div>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={() => setViewMode('wave')}
            className={`px-3 py-1 rounded ${viewMode === 'wave' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'}`}
          >
            波形
          </button>
          <button
            onClick={() => setViewMode('spectrogram')}
            className={`px-3 py-1 rounded ${viewMode === 'spectrogram' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'}`}
          >
            Mel谱
          </button>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-40 bg-gray-100 rounded" />

      {region && (
        <div className="flex items-center gap-4 p-3 bg-indigo-50 rounded-lg">
          <span className="text-sm">
            选段: {formatTime(region.start)} - {formatTime(region.end)}
          </span>
          <button
            onClick={handleSaveRegion}
            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
          >
            保存标注
          </button>
          <button
            onClick={() => {
              regionsRef.current?.clearRegions()
              setRegion(null)
            }}
            className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
          >
            取消
          </button>
        </div>
      )}
    </div>
  )
}
```

---

#### Task 9: 创建 AnnotationForm 组件

**Files:**
- Create: `frontend/src/components/AnnotationForm.tsx`

**Interfaces:**
- Props: `audioId: string, startTime: number, endTime: number, onSuccess: () => void, onCancel: () => void`
- Produces: 标注表单

- [ ] **Step 1: 创建 frontend/src/components/AnnotationForm.tsx**

```typescript
import { useState, useEffect } from 'react'
import { annotationApi, dictApi, DictItem } from '@/lib/api'

interface AnnotationFormProps {
  audioId: string
  startTime: number
  endTime: number
  onSuccess: () => void
  onCancel: () => void
}

export default function AnnotationForm({ audioId, startTime, endTime, onSuccess, onCancel }: AnnotationFormProps) {
  const [partNames, setPartNames] = useState<DictItem[]>([])
  const [noiseTypes, setNoiseTypes] = useState<DictItem[]>([])
  const [roadTypes, setRoadTypes] = useState<DictItem[]>([])
  const [newPartName, setNewPartName] = useState('')
  const [newNoiseType, setNewNoiseType] = useState('')
  const [newRoadType, setNewRoadType] = useState('')
  const [showAddPart, setShowAddPart] = useState(false)
  const [showAddNoise, setShowAddNoise] = useState(false)
  const [showAddRoad, setShowAddRoad] = useState(false)

  const [form, setForm] = useState({
    part_name_id: '',
    noise_type_id: '',
    road_type_id: '',
    speed: '',
    temperature: '',
    test_mode: 'dynamic',
    reason: '',
    solution: '',
  })

  useEffect(() => {
    loadDict()
  }, [])

  const loadDict = async () => {
    const [parts, noises, roads] = await Promise.all([
      dictApi.partNames.list(),
      dictApi.noiseTypes.list(),
      dictApi.roadTypes.list(),
    ])
    setPartNames(parts.data)
    setNoiseTypes(noises.data)
    setRoadTypes(roads.data)
  }

  const handleAddPart = async () => {
    if (!newPartName.trim()) return
    await dictApi.partNames.create(newPartName)
    setNewPartName('')
    setShowAddPart(false)
    loadDict()
  }

  const handleAddNoise = async () => {
    if (!newNoiseType.trim()) return
    await dictApi.noiseTypes.create(newNoiseType)
    setNewNoiseType('')
    setShowAddNoise(false)
    loadDict()
  }

  const handleAddRoad = async () => {
    if (!newRoadType.trim()) return
    await dictApi.roadTypes.create(newRoadType)
    setNewRoadType('')
    setShowAddRoad(false)
    loadDict()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await annotationApi.create({
      audio_id: audioId,
      start_time: startTime,
      end_time: endTime,
      part_name_id: form.part_name_id || null,
      noise_type_id: form.noise_type_id || null,
      road_type_id: form.road_type_id || null,
      speed: form.speed ? Number(form.speed) : null,
      temperature: form.temperature ? Number(form.temperature) : null,
      test_mode: form.test_mode,
      reason: form.reason || null,
      solution: form.solution || null,
    })
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold">新建标注</h3>

      <div className="grid grid-cols-2 gap-4">
        {/* 零部件名称 */}
        <div>
          <label className="block text-sm font-medium mb-1">零部件名称</label>
          {showAddPart ? (
            <div className="flex gap-2">
              <input
                value={newPartName}
                onChange={(e) => setNewPartName(e.target.value)}
                className="flex-1 border rounded px-2 py-1"
                placeholder="输入名称"
              />
              <button type="button" onClick={handleAddPart} className="px-2 py-1 bg-green-500 text-white rounded text-sm">添加</button>
              <button type="button" onClick={() => setShowAddPart(false)} className="px-2 py-1 bg-gray-200 rounded text-sm">取消</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={form.part_name_id}
                onChange={(e) => setForm({ ...form, part_name_id: e.target.value })}
                className="flex-1 border rounded px-2 py-1"
              >
                <option value="">请选择</option>
                {partNames.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => setShowAddPart(true)} className="px-2 py-1 bg-blue-500 text-white rounded text-sm">+</button>
            </div>
          )}
        </div>

        {/* 异响类型 */}
        <div>
          <label className="block text-sm font-medium mb-1">异响类型</label>
          {showAddNoise ? (
            <div className="flex gap-2">
              <input
                value={newNoiseType}
                onChange={(e) => setNewNoiseType(e.target.value)}
                className="flex-1 border rounded px-2 py-1"
                placeholder="输入类型"
              />
              <button type="button" onClick={handleAddNoise} className="px-2 py-1 bg-green-500 text-white rounded text-sm">添加</button>
              <button type="button" onClick={() => setShowAddNoise(false)} className="px-2 py-1 bg-gray-200 rounded text-sm">取消</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={form.noise_type_id}
                onChange={(e) => setForm({ ...form, noise_type_id: e.target.value })}
                className="flex-1 border rounded px-2 py-1"
              >
                <option value="">请选择</option>
                {noiseTypes.map((n) => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => setShowAddNoise(true)} className="px-2 py-1 bg-blue-500 text-white rounded text-sm">+</button>
            </div>
          )}
        </div>

        {/* 路面类型 */}
        <div>
          <label className="block text-sm font-medium mb-1">路面类型</label>
          {showAddRoad ? (
            <div className="flex gap-2">
              <input
                value={newRoadType}
                onChange={(e) => setNewRoadType(e.target.value)}
                className="flex-1 border rounded px-2 py-1"
                placeholder="输入类型"
              />
              <button type="button" onClick={handleAddRoad} className="px-2 py-1 bg-green-500 text-white rounded text-sm">添加</button>
              <button type="button" onClick={() => setShowAddRoad(false)} className="px-2 py-1 bg-gray-200 rounded text-sm">取消</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={form.road_type_id}
                onChange={(e) => setForm({ ...form, road_type_id: e.target.value })}
                className="flex-1 border rounded px-2 py-1"
              >
                <option value="">请选择</option>
                {roadTypes.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => setShowAddRoad(true)} className="px-2 py-1 bg-blue-500 text-white rounded text-sm">+</button>
            </div>
          )}
        </div>

        {/* 车速 */}
        <div>
          <label className="block text-sm font-medium mb-1">车速 (km/h)</label>
          <input
            type="number"
            value={form.speed}
            onChange={(e) => setForm({ ...form, speed: e.target.value })}
            className="w-full border rounded px-2 py-1"
            min="0"
            max="300"
          />
        </div>

        {/* 温度 */}
        <div>
          <label className="block text-sm font-medium mb-1">温度 (℃)</label>
          <input
            type="number"
            value={form.temperature}
            onChange={(e) => setForm({ ...form, temperature: e.target.value })}
            className="w-full border rounded px-2 py-1"
            min="-40"
            max="100"
          />
        </div>

        {/* 测试场景 */}
        <div>
          <label className="block text-sm font-medium mb-1">测试场景</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="test_mode"
                value="dynamic"
                checked={form.test_mode === 'dynamic'}
                onChange={(e) => setForm({ ...form, test_mode: e.target.value })}
              />
              动态
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="test_mode"
                value="static"
                checked={form.test_mode === 'static'}
                onChange={(e) => setForm({ ...form, test_mode: e.target.value })}
              />
              静态
            </label>
          </div>
        </div>
      </div>

      {/* 原因 */}
      <div>
        <label className="block text-sm font-medium mb-1">原因</label>
        <textarea
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          className="w-full border rounded px-2 py-1 h-20"
          placeholder="描述异响原因..."
        />
      </div>

      {/* 解决方案 */}
      <div>
        <label className="block text-sm font-medium mb-1">解决方案</label>
        <textarea
          value={form.solution}
          onChange={(e) => setForm({ ...form, solution: e.target.value })}
          className="w-full border rounded px-2 py-1 h-20"
          placeholder="描述处理方案..."
        />
      </div>

      {/* 时间信息 */}
      <div className="text-sm text-gray-600">
        异响时间段: {startTime.toFixed(2)}s - {endTime.toFixed(2)}s
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">取消</button>
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">保存</button>
      </div>
    </form>
  )
}
```

---

#### Task 10: 创建页面组件

**Files:**
- Create: `frontend/src/pages/AudioList.tsx`
- Create: `frontend/src/pages/AudioDetail.tsx`
- Create: `frontend/src/pages/Settings.tsx`

**Interfaces:**
- Produces: 完整页面

- [ ] **Step 1: 创建 frontend/src/pages/AudioList.tsx**

```typescript
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { audioApi, AudioFile } from '@/lib/api'
import { formatDuration, formatFileSize } from '@/lib/utils'

export default function AudioList() {
  const [audios, setAudios] = useState<AudioFile[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)

  const loadAudios = async () => {
    setLoading(true)
    try {
      const res = await audioApi.list(1, 100, search || undefined)
      setAudios(res.data.items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAudios()
  }, [search])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      await audioApi.upload(file)
      await loadAudios()
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除吗？')) return
    await audioApi.delete(id)
    loadAudios()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">音频文件</h1>
        <div className="flex gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索文件名..."
            className="px-3 py-2 border rounded-lg w-64"
          />
          <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700">
            {uploading ? '上传中...' : '上传音频'}
            <input type="file" accept=".wav,.mp3,.flac,.ogg" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : audios.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无音频文件</div>
      ) : (
        <table className="w-full bg-white rounded-lg shadow">
          <thead>
            <tr className="border-b">
              <th className="text-left px-4 py-3">文件名</th>
              <th className="text-left px-4 py-3">时长</th>
              <th className="text-left px-4 py-3">大小</th>
              <th className="text-left px-4 py-3">上传时间</th>
              <th className="text-left px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {audios.map((audio) => (
              <tr key={audio.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{audio.filename}</td>
                <td className="px-4 py-3">{formatDuration(audio.duration)}</td>
                <td className="px-4 py-3">{formatFileSize(audio.file_size)}</td>
                <td className="px-4 py-3">{new Date(audio.created_at).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <Link to={`/audio/${audio.id}`} className="text-indigo-600 hover:underline mr-4">查看</Link>
                  <button onClick={() => handleDelete(audio.id)} className="text-red-600 hover:underline">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
```

- [ ] **Step 2: 创建 frontend/src/pages/AudioDetail.tsx**

```typescript
import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { audioApi, annotationApi, AudioFile, Annotation } from '@/lib/api'
import AudioWaveform from '@/components/AudioWaveform'
import AnnotationForm from '@/components/AnnotationForm'
import { formatTime } from '@/lib/utils'

export default function AudioDetail() {
  const { id } = useParams<{ id: string }>()
  const [audio, setAudio] = useState<AudioFile | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<{ start: number; end: number } | null>(null)

  const loadData = useCallback(async () => {
    if (!id) return
    const [audioRes, annotationRes] = await Promise.all([
      audioApi.get(id),
      annotationApi.list(id),
    ])
    setAudio(audioRes.data)
    setAnnotations(annotationRes.data)
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRegionSave = useCallback((start: number, end: number) => {
    setSelectedRegion({ start, end })
    setShowForm(true)
  }, [])

  const handleFormSuccess = useCallback(() => {
    setShowForm(false)
    setSelectedRegion(null)
    loadData()
  }, [loadData])

  if (!audio) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link to="/" className="text-indigo-600 hover:underline mb-4 inline-block">← 返回列表</Link>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-xl font-bold mb-2">{audio.filename}</h1>
        <div className="text-sm text-gray-500">
          时长: {formatTime(audio.duration)} | 采样率: {audio.sample_rate} Hz | 大小: {(audio.file_size / 1024 / 1024).toFixed(2)} MB
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">波形 & 频谱</h2>
        <AudioWaveform
          audioUrl={`/api/audio/${id}/stream`}
          onRegionSave={handleRegionSave}
        />
      </div>

      {showForm && selectedRegion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-full max-w-2xl">
            <AnnotationForm
              audioId={id!}
              startTime={selectedRegion.start}
              endTime={selectedRegion.end}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowForm(false)
                setSelectedRegion(null)
              }}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">标注列表 ({annotations.length})</h2>
        {annotations.length === 0 ? (
          <div className="text-gray-500 text-center py-4">暂无标注</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">零部件</th>
                <th className="py-2">异响类型</th>
                <th className="py-2">路面</th>
                <th className="py-2">车速</th>
                <th className="py-2">温度</th>
                <th className="py-2">场景</th>
                <th className="py-2">时间段</th>
                <th className="py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {annotations.map((ann) => (
                <tr key={ann.id} className="border-b">
                  <td className="py-2">{ann.part_name || '-'}</td>
                  <td className="py-2">{ann.noise_type || '-'}</td>
                  <td className="py-2">{ann.road_type || '-'}</td>
                  <td className="py-2">{ann.speed ?? '-'}</td>
                  <td className="py-2">{ann.temperature ?? '-'}</td>
                  <td className="py-2">{ann.test_mode === 'dynamic' ? '动态' : '静态'}</td>
                  <td className="py-2 font-mono text-sm">{formatTime(ann.start_time)} - {formatTime(ann.end_time)}</td>
                  <td className="py-2">
                    <button
                      onClick={async () => {
                        if (!confirm('确定删除?')) return
                        await annotationApi.delete(ann.id)
                        loadData()
                      }}
                      className="text-red-600 hover:underline text-sm"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 创建 frontend/src/pages/Settings.tsx**

```typescript
import { useEffect, useState } from 'react'
import { dictApi, DictItem } from '@/lib/api'

export default function Settings() {
  const [partNames, setPartNames] = useState<DictItem[]>([])
  const [noiseTypes, setNoiseTypes] = useState<DictItem[]>([])
  const [roadTypes, setRoadTypes] = useState<DictItem[]>([])
  const [newPart, setNewPart] = useState('')
  const [newNoise, setNewNoise] = useState('')
  const [newRoad, setNewRoad] = useState('')

  const loadAll = async () => {
    const [p, n, r] = await Promise.all([
      dictApi.partNames.list(),
      dictApi.noiseTypes.list(),
      dictApi.roadTypes.list(),
    ])
    setPartNames(p.data)
    setNoiseTypes(n.data)
    setRoadTypes(r.data)
  }

  useEffect(() => { loadAll() }, [])

  const handleAddPart = async () => {
    if (!newPart.trim()) return
    await dictApi.partNames.create(newPart)
    setNewPart('')
    loadAll()
  }

  const handleAddNoise = async () => {
    if (!newNoise.trim()) return
    await dictApi.noiseTypes.create(newNoise)
    setNewNoise('')
    loadAll()
  }

  const handleAddRoad = async () => {
    if (!newRoad.trim()) return
    await dictApi.roadTypes.create(newRoad)
    setNewRoad('')
    loadAll()
  }

  const handleDeletePart = async (itemId: string) => {
    if (!confirm('确定删除?')) return
    await dictApi.partNames.delete(itemId)
    loadAll()
  }

  const handleDeleteNoise = async (itemId: string) => {
    if (!confirm('确定删除?')) return
    await dictApi.noiseTypes.delete(itemId)
    loadAll()
  }

  const handleDeleteRoad = async (itemId: string) => {
    if (!confirm('确定删除?')) return
    await dictApi.roadTypes.delete(itemId)
    loadAll()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">字典管理</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* 零部件名称 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">零部件名称</h2>
          <div className="flex gap-2 mb-4">
            <input
              value={newPart}
              onChange={(e) => setNewPart(e.target.value)}
              placeholder="输入名称"
              className="flex-1 border rounded px-2 py-1"
            />
            <button onClick={handleAddPart} className="px-3 py-1 bg-indigo-600 text-white rounded">添加</button>
          </div>
          <ul className="space-y-2">
            {partNames.map((p) => (
              <li key={p.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>{p.name}</span>
                <button onClick={() => handleDeletePart(p.id)} className="text-red-600 text-sm hover:underline">删除</button>
              </li>
            ))}
          </ul>
        </div>

        {/* 异响类型 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">异响类型</h2>
          <div className="flex gap-2 mb-4">
            <input
              value={newNoise}
              onChange={(e) => setNewNoise(e.target.value)}
              placeholder="输入类型"
              className="flex-1 border rounded px-2 py-1"
            />
            <button onClick={handleAddNoise} className="px-3 py-1 bg-indigo-600 text-white rounded">添加</button>
          </div>
          <ul className="space-y-2">
            {noiseTypes.map((n) => (
              <li key={n.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>{n.name}</span>
                <button onClick={() => handleDeleteNoise(n.id)} className="text-red-600 text-sm hover:underline">删除</button>
              </li>
            ))}
          </ul>
        </div>

        {/* 路面类型 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">路面类型</h2>
          <div className="flex gap-2 mb-4">
            <input
              value={newRoad}
              onChange={(e) => setNewRoad(e.target.value)}
              placeholder="输入类型"
              className="flex-1 border rounded px-2 py-1"
            />
            <button onClick={handleAddRoad} className="px-3 py-1 bg-indigo-600 text-white rounded">添加</button>
          </div>
          <ul className="space-y-2">
            {roadTypes.map((r) => (
              <li key={r.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>{r.name}</span>
                <button onClick={() => handleDeleteRoad(r.id)} className="text-red-600 text-sm hover:underline">删除</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
```

---

## Self-Review Checklist

### Spec Coverage
- [x] 音频上传功能 - Task 5 (audio.py upload endpoint)
- [x] 波形显示 - Task 8 (AudioWaveform)
- [x] Mel谱显示 - Task 8 (WaveSurfer SpectrogramPlugin)
- [x] 音频回放 - Task 8 (AudioWaveform play/pause)
- [x] 实时时间显示 - Task 8 (formatTime)
- [x] 异响时间段截取 - Task 8 (RegionsPlugin)
- [x] 标注字段完整 - Task 9 (AnnotationForm)
- [x] 零部件/异响/路面自定义 - Task 9, 10 (Settings)

### Placeholder Scan
- [ ] 无 TODO/TBD 标记
- [ ] 所有代码块完整

### Type Consistency
- [ ] API 路径一致 (/api 前缀)
- [ ] 字段名称匹配 schemas 和 models

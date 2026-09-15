# Phase 1: UI 体验优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 ANAS 前端 UI 升级为专业级视觉设计，包含 Toast 通知、骨架屏、进度条、分页、空状态、导航栏改造

**Architecture:** 在现有 React + TypeScript + Tailwind CSS 基础上，添加 react-hot-toast 通知系统，重构 App.tsx 导航栏，改造 AudioList.tsx 列表页面

**Tech Stack:** React 18, TypeScript, Tailwind CSS, react-hot-toast, lucide-react

**Spec:** `docs/superpowers/specs/2026-09-15-anas-full-upgrade-design.md`

---

## Global Constraints

- 前端目录: `frontend/src/`
- 后端目录: `backend/`
- 组件文件: `frontend/src/components/`
- 页面文件: `frontend/src/pages/`
- 库文件: `frontend/src/lib/`

---

## Task 1: 安装依赖

**Files:**
- Modify: `frontend/package.json`

- [ ] **Step 1: 安装 react-hot-toast 和 lucide-react**

```bash
cd frontend && npm install react-hot-toast lucide-react
```

---

## Task 2: 创建 Toast 通知组件

**Files:**
- Create: `frontend/src/components/Toast.tsx`

- [ ] **Step 1: 创建 Toast 组件**

```tsx
import { Toaster } from 'react-hot-toast'

export default function Toast() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#363636',
          color: '#fff',
          borderRadius: '8px',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#fff',
          },
        },
        error: {
          iconTheme: {
            primary: '#ef4444',
            secondary: '#fff',
          },
        },
      }}
    />
  )
}
```

- [ ] **Step 2: 在 App.tsx 中引入 Toast 组件**

Modify: `frontend/src/App.tsx`

```tsx
import { Routes, Route } from 'react-router-dom'
import AudioList from './pages/AudioList'
import AudioDetail from './pages/AudioDetail'
import Settings from './pages/Settings'
import Toast from './components/Toast'

function App() {
  return (
    <>
      <Toast />
      <div className="min-h-screen bg-gray-50">
        {/* ... existing nav and routes */}
      </div>
    </>
  )
}

export default App
```

---

## Task 3: 创建骨架屏组件

**Files:**
- Create: `frontend/src/components/Skeleton.tsx`

- [ ] **Step 1: 创建 Skeleton 组件**

```tsx
export function AudioTableSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow animate-pulse">
      <div className="p-4 border-b">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
      <div className="divide-y">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="w-8 h-8 bg-gray-200 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-24"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AudioCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
      </div>
    </div>
  )
}
```

---

## Task 4: 改造导航栏

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: 添加 Logo 和用户菜单**

```tsx
import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Home, Settings, BarChart3, User, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import Toast from './components/Toast'

// 导航栏组件
function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const navItems = [
    { path: '/', label: '音频管理', icon: Home },
    { path: '/tasks', label: '标注任务', icon: User },
    { path: '/dashboard', label: '统计分析', icon: BarChart3 },
    { path: '/settings', label: '设置', icon: Settings },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AN</span>
            </div>
            <span className="text-xl font-bold text-gray-900">ANAS</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(path)
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
              <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">Z</span>
              </div>
              <span className="text-sm text-gray-700">张三</span>
            </div>
            <button className="p-2 hover:bg-gray-100 rounded-lg md:hidden">
              <Menu size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

function App() {
  return (
    <>
      <Toast />
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <Routes>
          <Route path="/" element={<AudioList />} />
          <Route path="/audio/:id" element={<AudioDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </>
  )
}

export default App
```

---

## Task 5: 改造 AudioList 页面

**Files:**
- Modify: `frontend/src/pages/AudioList.tsx`

- [ ] **Step 1: 添加导入和状态**

```tsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { audioApi, AudioFile } from '@/lib/api'
import { formatDuration, formatFileSize } from '@/lib/utils'
import { AudioTableSkeleton } from '@/components/Skeleton'
import { Upload, Search, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

// 筛选状态
type FilterStatus = 'all' | 'annotated' | 'unannotated' | 'reviewing'
```

- [ ] **Step 2: 添加筛选器和搜索框**

```tsx
// 筛选标签
const filters: { key: FilterStatus; label: string; icon: typeof CheckCircle }[] = [
  { key: 'all', label: '全部', icon: Clock },
  { key: 'annotated', label: '已标注', icon: CheckCircle },
  { key: 'unannotated', label: '未标注', icon: XCircle },
  { key: 'reviewing', label: '审核中', icon: Clock },
]

// 在组件中添加
<div className="flex justify-between items-center mb-6">
  <div className="flex gap-2">
    {filters.map(({ key, label, icon: Icon }) => (
      <button
        key={key}
        onClick={() => setFilter(key)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          filter === key
            ? 'bg-indigo-600 text-white'
            : 'bg-white text-gray-600 hover:bg-gray-100'
        }`}
      >
        <Icon size={16} />
        {label}
      </button>
    ))}
  </div>

  {/* 搜索框 */}
  <div className="relative">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
    <input
      type="text"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="搜索音频..."
      className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </div>
</div>
```

- [ ] **Step 3: 添加上传进度条**

```tsx
const [uploadProgress, setUploadProgress] = useState<number | null>(null)

// handleUpload 函数中添加 progress
const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  setUploading(true)
  try {
    await audioApi.upload(file, {
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        setUploadProgress(percent)
      },
    })
    toast.success('音频上传成功')
    await loadAudios()
  } catch (error: any) {
    toast.error(error?.message || '上传失败')
  } finally {
    setUploading(false)
    setUploadProgress(null)
  }
}

// 上传按钮中添加进度条显示
{uploadProgress !== null ? (
  <div className="flex items-center gap-2">
    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-indigo-600 transition-all"
        style={{ width: `${uploadProgress}%` }}
      />
    </div>
    <span className="text-sm text-gray-600">{uploadProgress}%</span>
  </div>
) : (
  <label className="...">
    上传音频
    <input type="file" ... />
  </label>
)}
```

- [ ] **Step 4: 改造表格为空状态**

```tsx
{loading ? (
  <AudioTableSkeleton />
) : audios.length === 0 ? (
  <div className="text-center py-16 bg-white rounded-lg shadow">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Upload className="text-gray-400" size={32} />
    </div>
    <h3 className="text-lg font-medium text-gray-900">暂无音频文件</h3>
    <p className="text-gray-500 mt-1">点击上方按钮上传第一个音频</p>
  </div>
) : (
  <table className="w-full bg-white rounded-lg shadow overflow-hidden">
    {/* 表格内容 */}
  </table>
)}
```

- [ ] **Step 5: 添加分页**

```tsx
// 分页组件
function Pagination({ current, total, onPageChange }: { current: number; total: number; onPageChange: (page: number) => void }) {
  const totalPages = Math.ceil(total / pageSize)
  
  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-sm text-gray-600">
        共 {total} 条，每页 {pageSize} 条
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(current - 1)}
          disabled={current === 1}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={18} />
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let page = i + 1
          if (totalPages > 5) {
            if (current > 3) page = current - 2 + i
            if (current > totalPages - 2) page = totalPages - 4 + i
          }
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-lg text-sm font-medium ${
                current === page
                  ? 'bg-indigo-600 text-white'
                  : 'hover:bg-gray-100'
              }`}
            >
              {page}
            </button>
          )
        })}
        <button
          onClick={() => onPageChange(current + 1)}
          disabled={current === totalPages}
          className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: 添加删除确认和 Toast**

```tsx
const handleDelete = async (id: string) => {
  if (!confirm('确定要删除吗？')) return
  try {
    await audioApi.delete(id)
    toast.success('删除成功')
    loadAudios()
  } catch (error: any) {
    toast.error(error?.message || '删除失败')
  }
}
```

---

## Task 6: 提交 Phase 1

- [ ] **Step 1: 提交代码**

```bash
git add -A
git commit -m "feat(phase1): UI 体验优化 - Toast通知、骨架屏、进度条、分页、空状态

Phase 1 完成:
- 添加 react-hot-toast 通知系统
- 创建 Skeleton 骨架屏组件
- 改造导航栏：Logo、图标、响应式
- 改造 AudioList：筛选器、搜索框、上传进度条、空状态、分页

Co-Authored-By: Claude <noreply@anthropic.com>"
```

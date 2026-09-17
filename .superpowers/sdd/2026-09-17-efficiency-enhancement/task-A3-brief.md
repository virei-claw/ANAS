# Task A3: 自动草稿保存

**Files:**
- Create: `frontend/src/hooks/useAutoDraft.ts`
- Modify: `frontend/src/pages/AudioDetail.tsx`
- Create: `frontend/src/test/useAutoDraft.test.ts`

**Interfaces:**
- Consumes: `localStorage` for draft storage
- Produces: `useAutoDraft(audioId, annotationData)` hook with `restoreDraft()`, `clearDraft()`

## Steps

### 1. 实现草稿hook

```typescript
// frontend/src/hooks/useAutoDraft.ts

const DRAFT_KEY = 'annotation_draft_'
const DRAFT_INTERVAL = 30000 // 30秒

export function useAutoDraft(audioId: string, data: any) {
  const timerRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    timerRef.current = setInterval(() => {
      localStorage.setItem(DRAFT_KEY + audioId, JSON.stringify({
        data,
        savedAt: new Date().toISOString()
      }))
    }, DRAFT_INTERVAL)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [audioId, data])

  const restoreDraft = useCallback(() => {
    const saved = localStorage.getItem(DRAFT_KEY + audioId)
    return saved ? JSON.parse(saved) : null
  }, [audioId])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY + audioId)
  }, [audioId])

  return { restoreDraft, clearDraft }
}
```

### 2. 在AudioDetail中集成

```typescript
// AudioDetail.tsx
const { restoreDraft, clearDraft } = useAutoDraft(id, selectedRegion)

// 在标注创建成功后清除草稿
const handleFormSuccess = () => {
  clearDraft()
  loadData()
}

// 页面加载时检查草稿
useEffect(() => {
  const draft = restoreDraft()
  if (draft) {
    // 提示用户恢复草稿
    toast.success('检测到未保存的草稿')
  }
}, [id])
```

### 3. 测试

```typescript
// frontend/src/test/useAutoDraft.test.ts
it('每30秒自动保存草稿', async () => {
  vi.useFakeTimers()
  const { result } = renderHook(() => useAutoDraft('audio-123', { reason: 'test' }))
  
  vi.advanceTimersByTime(30000)
  
  expect(localStorage.setItem).toHaveBeenCalled()
  vi.useRealTimers()
})

it('恢复草稿', () => {
  localStorage.setItem('annotation_draft_audio-123', JSON.stringify({ data: { reason: 'test' } }))
  const { result } = renderHook(() => useAutoDraft('audio-123', {}))
  
  const draft = result.current.restoreDraft()
  expect(draft.data.reason).toBe('test')
})

it('清除草稿', () => {
  localStorage.setItem('annotation_draft_audio-123', JSON.stringify({ data: {} }))
  const { result } = renderHook(() => useAutoDraft('audio-123', {}))
  
  result.current.clearDraft()
  expect(localStorage.removeItem).toHaveBeenCalledWith('annotation_draft_audio-123')
})
```

### 4. 提交

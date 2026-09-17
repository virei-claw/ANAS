# Task A1: 快捷键支持

**Files:**
- Create: `frontend/src/hooks/useHotkeys.ts`
- Create: `frontend/src/components/HotkeyHelp.tsx`
- Modify: `frontend/src/components/AudioWaveform.tsx`
- Create: `frontend/src/test/useHotkeys.test.ts`

**Interfaces:**
- Consumes: 无
- Produces: `useHotkeys(handlers: Record<string, () => void>)` hook, `HotkeyHelp` component

## Steps

1. **编写快捷键hook测试**

```typescript
// frontend/src/test/useHotkeys.test.ts
import { renderHook, act } from '@testing-library/react'
import { useHotkeys } from '../hooks/useHotkeys'

describe('useHotkeys', () => {
  it('空格键触发播放/暂停', async () => {
    const handler = vi.fn()
    const { result } = renderHook(() => useHotkeys({ ' ': handler }))
    
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
    })
    
    expect(handler).toHaveBeenCalled()
  })

  it('J键快退10秒', async () => {
    const handler = vi.fn()
    const { result } = renderHook(() => useHotkeys({ j: handler }))
    
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }))
    })
    
    expect(handler).toHaveBeenCalled()
  })

  it('K键播放/暂停', async () => {
    const handler = vi.fn()
    const { result } = renderHook(() => useHotkeys({ k: handler }))
    
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }))
    })
    
    expect(handler).toHaveBeenCalled()
  })

  it('L键快进10秒', async () => {
    const handler = vi.fn()
    const { result } = renderHook(() => useHotkeys({ l: handler }))
    
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'l' }))
    })
    
    expect(handler).toHaveBeenCalled()
  })

  it('忽略输入框中的按键', async () => {
    const handler = vi.fn()
    const { result } = renderHook(() => useHotkeys({ ' ': handler }))
    
    act(() => {
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()
      document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
      document.body.removeChild(input)
    })
    
    expect(handler).not.toHaveBeenCalled()
  })
})
```

2. **实现useHotkeys hook**

```typescript
// frontend/src/hooks/useHotkeys.ts
import { useEffect } from 'react'

export function useHotkeys(handlers: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框中的按键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }
      const handler = handlers[e.key]
      if (handler) {
        e.preventDefault()
        handler()
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers])
}
```

3. **在AudioWaveform中集成快捷键**
   - 空格: togglePlay
   - J: skip(-10)
   - K: togglePlay
   - L: skip(10)
   - [: skip(-5)
   - ]: skip(5)

4. **创建HotkeyHelp组件显示快捷键提示**

5. **运行测试确认通过**

6. **提交** `git add ... && git commit -m "feat: 快捷键支持 (A1)"`

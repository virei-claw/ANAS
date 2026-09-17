import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useAutoDraft } from '../hooks/useAutoDraft'

describe('useAutoDraft', () => {
  let setItemSpy: ReturnType<typeof vi.spyOn>
  let removeItemSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    removeItemSpy = vi.spyOn(Storage.prototype, 'removeItem')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('每30秒自动保存草稿到localStorage', async () => {
    vi.useFakeTimers()
    renderHook(() => useAutoDraft('audio-123', { reason: 'test reason' }))

    // 初始时不应保存
    expect(setItemSpy).not.toHaveBeenCalled()

    // 前进30秒
    act(() => {
      vi.advanceTimersByTime(30000)
    })

    // 应该调用localStorage.setItem保存草稿
    expect(setItemSpy).toHaveBeenCalledWith(
      'annotation_draft_audio-123',
      expect.stringContaining('"reason":"test reason"')
    )
    vi.useRealTimers()
  })

  it('恢复草稿返回null当无草稿时', () => {
    const { result } = renderHook(() => useAutoDraft('audio-123', {}))

    const draft = result.current.restoreDraft()
    expect(draft).toBeNull()
  })

  it('恢复草稿返回保存的数据', () => {
    const savedDraft = {
      data: { reason: 'test reason', part_name: 'engine' },
      savedAt: '2024-01-01T00:00:00.000Z'
    }
    localStorage.setItem('annotation_draft_audio-123', JSON.stringify(savedDraft))

    const { result } = renderHook(() => useAutoDraft('audio-123', {}))

    const draft = result.current.restoreDraft()
    expect(draft).not.toBeNull()
    expect(draft.data.reason).toBe('test reason')
    expect(draft.data.part_name).toBe('engine')
  })

  it('清除草稿', () => {
    localStorage.setItem('annotation_draft_audio-123', JSON.stringify({ data: {} }))

    const { result } = renderHook(() => useAutoDraft('audio-123', {}))

    result.current.clearDraft()

    expect(removeItemSpy).toHaveBeenCalledWith('annotation_draft_audio-123')
    expect(localStorage.getItem('annotation_draft_audio-123')).toBeNull()
  })

  it('数据变化时重新设置定时器', async () => {
    vi.useFakeTimers()
    const { rerender } = renderHook(
      ({ audioId, data }: { audioId: string; data: any }) => useAutoDraft(audioId, data),
      { initialProps: { audioId: 'audio-123', data: { reason: 'initial' } } }
    )

    act(() => {
      vi.advanceTimersByTime(30000)
    })

    // 第一次保存
    const firstCallCount = setItemSpy.mock.calls.length

    // 更新数据
    rerender({ audioId: 'audio-123', data: { reason: 'updated' } })

    act(() => {
      vi.advanceTimersByTime(30000)
    })

    // 应该有更多保存调用
    expect(setItemSpy.mock.calls.length).toBeGreaterThan(firstCallCount)
    vi.useRealTimers()
  })

  it('组件卸载时清除定时器', async () => {
    vi.useFakeTimers()
    const { unmount } = renderHook(() => useAutoDraft('audio-123', { reason: 'test' }))

    act(() => {
      vi.advanceTimersByTime(15000)
    })

    // 卸载组件
    unmount()

    // 前进到应该触发保存的时间，但组件已卸载，不应保存
    act(() => {
      vi.advanceTimersByTime(20000)
    })

    // 因为组件已卸载，清除定时器被调用，不应有更多保存
    expect(setItemSpy).not.toHaveBeenCalled()
    vi.useRealTimers()
  })
})

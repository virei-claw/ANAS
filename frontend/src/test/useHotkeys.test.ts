import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHotkeys } from '../hooks/useHotkeys'

describe('useHotkeys', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Clean up any event listeners
  })

  it('空格键触发播放/暂停', async () => {
    const handler = vi.fn()
    renderHook(() => useHotkeys({ ' ': handler }))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }))
    })

    expect(handler).toHaveBeenCalled()
  })

  it('J键快退10秒', async () => {
    const handler = vi.fn()
    renderHook(() => useHotkeys({ j: handler }))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j' }))
    })

    expect(handler).toHaveBeenCalled()
  })

  it('K键播放/暂停', async () => {
    const handler = vi.fn()
    renderHook(() => useHotkeys({ k: handler }))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k' }))
    })

    expect(handler).toHaveBeenCalled()
  })

  it('L键快进10秒', async () => {
    const handler = vi.fn()
    renderHook(() => useHotkeys({ l: handler }))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'l' }))
    })

    expect(handler).toHaveBeenCalled()
  })

  it('左方括号键快退5秒', async () => {
    const handler = vi.fn()
    renderHook(() => useHotkeys({ '[': handler }))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: '[' }))
    })

    expect(handler).toHaveBeenCalled()
  })

  it('右方括号键快进5秒', async () => {
    const handler = vi.fn()
    renderHook(() => useHotkeys({ ']': handler }))

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ']' }))
    })

    expect(handler).toHaveBeenCalled()
  })

  it('忽略输入框中的按键', async () => {
    const handler = vi.fn()
    renderHook(() => useHotkeys({ ' ': handler }))

    act(() => {
      const input = document.createElement('input')
      document.body.appendChild(input)
      input.focus()
      // In jsdom, manually set the event target to simulate focused input
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
      Object.defineProperty(event, 'target', { value: input })
      document.dispatchEvent(event)
      document.body.removeChild(input)
    })

    expect(handler).not.toHaveBeenCalled()
  })

  it('忽略textarea中的按键', async () => {
    const handler = vi.fn()
    renderHook(() => useHotkeys({ ' ': handler }))

    act(() => {
      const textarea = document.createElement('textarea')
      document.body.appendChild(textarea)
      textarea.focus()
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true })
      Object.defineProperty(event, 'target', { value: textarea })
      document.dispatchEvent(event)
      document.body.removeChild(textarea)
    })

    expect(handler).not.toHaveBeenCalled()
  })
})

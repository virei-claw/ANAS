import { useEffect, useCallback } from 'react'

interface HotKeyConfig {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  handler: () => void
  description?: string
}

export function useHotKeys(hotKeys: HotKeyConfig[], enabled: boolean = true) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // Ignore if user is typing in input/textarea
    const target = event.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return
    }

    for (const hotKey of hotKeys) {
      const keyMatch = event.key.toLowerCase() === hotKey.key.toLowerCase()
      const ctrlMatch = hotKey.ctrlKey ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey
      const shiftMatch = hotKey.shiftKey ? event.shiftKey : !event.shiftKey
      const altMatch = hotKey.altKey ? event.altKey : !event.altKey

      if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
        event.preventDefault()
        event.stopPropagation()
        hotKey.handler()
        break
      }
    }
  }, [hotKeys, enabled])

  useEffect(() => {
    if (!enabled) return
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, enabled])
}

// 预设快捷键
export const hotKeyPresets = {
  playPause: { key: ' ', description: '播放/暂停' },
  seekBack: { key: 'ArrowLeft', description: '后退 5 秒' },
  seekForward: { key: 'ArrowRight', description: '前进 5 秒' },
  delete: { key: 'Delete', description: '删除选中项' },
  selectAll: { key: 'a', ctrlKey: true, description: '全选' },
  escape: { key: 'Escape', description: '取消选择' },
}

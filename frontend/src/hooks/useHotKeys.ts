import { useEffect, useCallback } from 'react'

/**
 * Simplified hotkeys hook that accepts a simple key-handler map.
 * Automatically ignores key events when user is typing in input/textarea.
 * Key matching is case-insensitive.
 */
export function useHotkeys(handlers: Record<string, () => void>) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Ignore if user is typing in input/textarea
    const target = event.target as HTMLElement
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable
    ) {
      return
    }

    // Case-insensitive key matching
    const key = event.key.toLowerCase()
    const handler = handlers[key] || handlers[event.key]
    if (handler) {
      event.preventDefault()
      handler()
    }
  }, [handlers])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}

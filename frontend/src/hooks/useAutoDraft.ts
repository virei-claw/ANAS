import { useEffect, useRef, useCallback } from 'react'

const DRAFT_KEY = 'annotation_draft_'
const DRAFT_INTERVAL = 30000 // 30秒

interface DraftData {
  data: any
  savedAt: string
}

export function useAutoDraft(audioId: string, data: any) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>()

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

  const restoreDraft = useCallback((): DraftData | null => {
    const saved = localStorage.getItem(DRAFT_KEY + audioId)
    return saved ? JSON.parse(saved) : null
  }, [audioId])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY + audioId)
  }, [audioId])

  return { restoreDraft, clearDraft }
}

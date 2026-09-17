import { useState, useEffect, useCallback } from 'react'
import api from '@/lib/api'

export interface AnnotationTemplate {
  id: string
  name: string
  part_name: string | null
  noise_type: string | null
  road_type: string | null
  speed: number | null
  temperature: number | null
  test_mode: string | null
  created_at: string
}

export function useAnnotationTemplate() {
  const [templates, setTemplates] = useState<AnnotationTemplate[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.get<AnnotationTemplate[]>('/annotations/templates')
      setTemplates(res.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const create = async (data: Omit<AnnotationTemplate, 'id' | 'created_at'>) => {
    await api.post('/annotations/templates', data)
    await load()
  }

  const remove = async (id: string) => {
    await api.delete(`/annotations/templates/${id}`)
    await load()
  }

  return { templates, loading, reload: load, create, remove }
}

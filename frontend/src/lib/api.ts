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
  clip_filepath: string | null
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
  clip: (audioId: string, startTime: number, endTime: number) => {
    return api.post<{ clip_filepath: string; clip_id: string }>(`/audio/${audioId}/clip`, null, {
      params: { start_time: startTime, end_time: endTime },
    })
  },
  streamClipUrl: (clipFilepath: string) => `/api/audio/clip/${encodeURIComponent(clipFilepath)}`,
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

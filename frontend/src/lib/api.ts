import axios, { AxiosProgressEvent } from 'axios'

const api = axios.create({
  baseURL: '/api',
})

// 请求拦截器：自动附加 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器：处理 401 未授权
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export interface AudioFile {
  id: string
  filename: string
  filepath: string
  duration: number
  sample_rate: number
  file_size: number
  uploader_id?: string
  uploader_name?: string
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
  status: string
  created_at: string
  part_name: string | null
  noise_type: string | null
  road_type: string | null
  annotator_id?: string
  annotator_name?: string
}

export interface AnnotationHistory {
  id: string
  annotation_id: string
  version: number
  data: Record<string, any>
  changed_by: string | null
  change_reason: string | null
  created_at: string
}

export interface DictItem {
  id: string
  name: string
}

export interface User {
  id: string
  username: string
  email: string
  full_name?: string
  is_active?: boolean
  created_at?: string
  roles?: Role[]
}

export interface Role {
  id: string
  name: string
  description?: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface UserListResponse {
  items: User[]
  total: number
  page: number
  page_size: number
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post<LoginResponse>('/auth/login', new URLSearchParams({ username, password }).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }),
  register: (data: { username: string; email: string; password: string; full_name?: string }) =>
    api.post<User>('/auth/register', data),
  getCurrentUser: () => api.get<User>('/auth/me'),
}

export const userApi = {
  list: (page = 1, pageSize = 20, search?: string) => {
    return api.get<UserListResponse>('/users', {
      params: { page, page_size: pageSize, search },
    })
  },
  get: (id: string) => api.get<User>(`/users/${id}`),
  create: (data: { username: string; email: string; password: string; full_name?: string }) =>
    api.post<User>('/users', data),
  update: (id: string, data: { email?: string; full_name?: string; is_active?: boolean }) =>
    api.put<User>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  assignRoles: (id: string, roleNames: string[]) =>
    api.put<User>(`/users/${id}/roles`, { role_names: roleNames }),
  listRoles: () => api.get<Role[]>('/users/roles'),
}

export const audioApi = {
  upload: (file: File, options?: { onUploadProgress?: (progressEvent: AxiosProgressEvent) => void }) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<AudioFile>('/audio/upload', formData, {
      onUploadProgress: options?.onUploadProgress,
    })
  },
  list: (page = 1, pageSize = 20, search?: string, filter?: string) => {
    return api.get<{ items: AudioFile[]; total: number; page: number; page_size: number }>('/audio', {
      params: { page, page_size: pageSize, search, filter },
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

export interface ImportResult {
  total: number
  success: number
  failed: number
  errors: { row: number; message: string }[]
}

export const annotationApi = {
  create: (data: Partial<Annotation>) => api.post<Annotation>('/annotations', data),
  list: (audioId?: string) => api.get<Annotation[]>('/annotations', { params: { audio_id: audioId } }),
  get: (id: string) => api.get<Annotation>(`/annotations/${id}`),
  update: (id: string, data: Partial<Annotation>) => api.put<Annotation>(`/annotations/${id}`, data),
  delete: (id: string) => api.delete(`/annotations/${id}`),
  submit: (id: string) => api.put(`/annotations/${id}/submit`),
  batchSubmit: (ids: string[]) => api.post('/annotations/batch-submit', { annotation_ids: ids }),
  getHistory: (annotationId: string) => api.get<AnnotationHistory[]>(`/annotations/${annotationId}/history`),
  import: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<ImportResult>('/annotations/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
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

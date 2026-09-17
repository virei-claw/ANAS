import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from './Dashboard'
import api from '@/lib/api'

vi.mock('@/lib/api')

const mockStats = {
  total_audios: 10,
  total_annotations: 20,
  today_annotations: 5,
  active_users: 3,
  status_counts: { draft: 5, submitted: 3, approved: 10, rejected: 2 },
  noise_type_stats: [],
  part_stats: [],
  daily_trend: []
}

const mockUserWorkload: any[] = []

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/stats/dashboard') {
        return Promise.resolve({ data: mockStats })
      }
      if (url === '/stats/user-workload') {
        return Promise.resolve({ data: mockUserWorkload })
      }
      return Promise.reject(new Error('Unknown URL'))
    })
  })

  it('should display page header', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('统计分析')).toBeInTheDocument()
    })
  })

  it('should call dashboard APIs', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/stats/dashboard')
      expect(api.get).toHaveBeenCalledWith('/stats/user-workload')
    })
  })

  it('should display stat cards', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('总音频数')).toBeInTheDocument()
    })
  })

  it('should display status distribution section', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('标注状态分布')).toBeInTheDocument()
    })
  })

  it('should display user workload ranking section', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('用户工作量排行')).toBeInTheDocument()
    })
  })
})

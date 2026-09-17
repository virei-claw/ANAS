import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Dashboard from '../pages/Dashboard'
import api from '@/lib/api'

vi.mock('@/lib/api')

const mockMyWorkload = {
  pending: 5,
  reviewing: 3,
  completed: 12
}

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

describe('Dashboard my-workload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(api.get as any).mockImplementation((url: string) => {
      if (url === '/stats/my-workload') {
        return Promise.resolve({ data: mockMyWorkload })
      }
      if (url === '/stats/dashboard') {
        return Promise.resolve({ data: mockStats })
      }
      if (url === '/stats/user-workload') {
        return Promise.resolve({ data: mockUserWorkload })
      }
      return Promise.reject(new Error('Unknown URL'))
    })
  })

  it('should call /stats/my-workload API', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/stats/my-workload')
    })
  })

  it('should display pending/reviewing/completed counts', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      // Check 个人工作台 section has correct values
      const pendingCard = screen.getByText('待标注').parentElement
      const reviewingCard = screen.getByText('审核中').parentElement
      const completedCard = screen.getByText('已完成').parentElement

      expect(pendingCard?.textContent).toContain('5')
      expect(reviewingCard?.textContent).toContain('3')
      expect(completedCard?.textContent).toContain('12')
    })
  })

  it('should display workload card labels', async () => {
    render(
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('待标注')).toBeInTheDocument()
      expect(screen.getByText('审核中')).toBeInTheDocument()
      expect(screen.getByText('已完成')).toBeInTheDocument()
    })
  })
})

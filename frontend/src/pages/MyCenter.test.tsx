import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import MyCenter from './MyCenter'
import { annotationApi } from '@/lib/api'

// Mock API
vi.mock('@/lib/api', () => ({
  annotationApi: {
    myList: vi.fn(),
  },
}))

const mockAnnotations = [
  {
    id: '1',
    audio_id: 'audio-1',
    audio_filename: 'test_audio.wav',
    part_name: '发动机',
    noise_type: '异响',
    road_type: '沥青',
    speed: 60,
    temperature: 25,
    test_mode: 'dynamic',
    reason: '测试原因',
    solution: '解决方案',
    start_time: 10.5,
    end_time: 15.3,
    clip_filepath: null,
    status: 'draft',
    created_at: '2024-01-01T00:00:00Z',
    part_name_id: null,
    noise_type_id: null,
    road_type_id: null,
    annotator_id: 'user-1',
    annotator_name: '测试用户',
  },
  {
    id: '2',
    audio_id: 'audio-1',
    audio_filename: 'test_audio.wav',
    part_name: '底盘',
    noise_type: '噪音',
    road_type: '水泥',
    speed: 80,
    temperature: 30,
    test_mode: 'static',
    reason: '',
    solution: '',
    start_time: 20.0,
    end_time: 25.0,
    clip_filepath: null,
    status: 'rejected',
    created_at: '2024-01-02T00:00:00Z',
    part_name_id: null,
    noise_type_id: null,
    road_type_id: null,
    annotator_id: 'user-1',
    annotator_name: '测试用户',
  },
]

describe('MyCenter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display loading state initially', () => {
    vi.mocked(annotationApi.myList).mockImplementation(
      () => new Promise(() => {}) // Never resolves to keep loading
    )

    render(
      <MemoryRouter>
        <MyCenter />
      </MemoryRouter>
    )

    expect(screen.getByText('加载中...')).toBeDefined()
  })

  it('should display annotations list', async () => {
    vi.mocked(annotationApi.myList).mockResolvedValue({
      data: mockAnnotations,
    } as any)

    render(
      <MemoryRouter>
        <MyCenter />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('我的标注')).toBeDefined()
      expect(screen.getByText('发动机')).toBeDefined()
      expect(screen.getByText('底盘')).toBeDefined()
    })
  })

  it('should display empty state when no annotations', async () => {
    vi.mocked(annotationApi.myList).mockResolvedValue({
      data: [],
    } as any)

    render(
      <MemoryRouter>
        <MyCenter />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('暂无标注')).toBeDefined()
    })
  })

  it('should filter by status when clicking filter buttons', async () => {
    vi.mocked(annotationApi.myList).mockResolvedValue({
      data: mockAnnotations,
    } as any)

    render(
      <MemoryRouter>
        <MyCenter />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('发动机')).toBeDefined()
    })

    // Click on "已驳回" filter
    const rejectedButton = screen.getByRole('button', { name: /已驳回/ })
    await userEvent.click(rejectedButton)

    // API should be called with status=rejected
    expect(annotationApi.myList).toHaveBeenCalledWith('rejected')
  })

  it('should display rejected badge with count', async () => {
    vi.mocked(annotationApi.myList).mockResolvedValue({
      data: mockAnnotations,
    } as any)

    render(
      <MemoryRouter>
        <MyCenter />
      </MemoryRouter>
    )

    await waitFor(() => {
      // Should show rejected badge with count 1
      const badge = screen.getByText('1')
      expect(badge).toBeDefined()
    })
  })

  it('should display status tags correctly', async () => {
    vi.mocked(annotationApi.myList).mockResolvedValue({
      data: mockAnnotations,
    } as any)

    render(
      <MemoryRouter>
        <MyCenter />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('草稿')).toBeDefined()
      expect(screen.getByText('已驳回')).toBeDefined()
    })
  })

  it('should show resubmit button for draft annotations', async () => {
    vi.mocked(annotationApi.myList).mockResolvedValue({
      data: mockAnnotations,
    } as any)

    render(
      <MemoryRouter>
        <MyCenter />
      </MemoryRouter>
    )

    await waitFor(() => {
      const resubmitButton = screen.getByText('提交审核')
      expect(resubmitButton).toBeDefined()
    })
  })

  it('should show re-annotate link for rejected annotations', async () => {
    vi.mocked(annotationApi.myList).mockResolvedValue({
      data: mockAnnotations,
    } as any)

    render(
      <MemoryRouter>
        <MyCenter />
      </MemoryRouter>
    )

    await waitFor(() => {
      const reAnnotateLink = screen.getByText('重新标注')
      expect(reAnnotateLink).toBeDefined()
    })
  })

  it('should handle API error', async () => {
    vi.mocked(annotationApi.myList).mockRejectedValue(new Error('API Error'))

    render(
      <MemoryRouter>
        <MyCenter />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText(/暂无标注/)).toBeDefined()
    })
  })
})

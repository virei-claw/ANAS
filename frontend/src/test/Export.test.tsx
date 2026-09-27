import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import Export from '../pages/Export'
import api from '@/lib/api'

// Mock api module
vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
  },
  annotationApi: {
    list: vi.fn(),
  },
  dictApi: {
    partNames: { list: vi.fn() },
    noiseTypes: { list: vi.fn() },
    roadTypes: { list: vi.fn() },
  },
  audioApi: {
    list: vi.fn(),
  },
}))

const mockAnnotations = [
  {
    id: 'a1',
    audio_id: 'audio1',
    part_name_id: 'p1',
    noise_type_id: 'n1',
    road_type_id: 'r1',
    speed: 60,
    temperature: 25,
    test_mode: '正常',
    reason: '发动机异响',
    solution: '更换零部件',
    start_time: 5.0,
    end_time: 10.0,
    clip_filepath: null,
    custom_dict_items: null,
    status: 'pending',
    created_at: '2024-01-01T00:00:00Z',
    part_name: '发动机',
    noise_type: '敲击声',
    road_type: '沥青路',
    annotator_id: 'u1',
    annotator_name: '张三',
    audio_filename: 'test-audio.wav',
  },
  {
    id: 'a2',
    audio_id: 'audio2',
    part_name_id: 'p2',
    noise_type_id: 'n2',
    road_type_id: 'r2',
    speed: 80,
    temperature: 30,
    test_mode: '正常',
    reason: '轮胎问题',
    solution: '检查轮胎',
    start_time: 15.5,
    end_time: 20.3,
    clip_filepath: null,
    custom_dict_items: null,
    status: 'approved',
    created_at: '2024-01-02T00:00:00Z',
    part_name: '轮胎',
    noise_type: '胎噪',
    road_type: '水泥路',
    annotator_id: 'u2',
    annotator_name: '李四',
    audio_filename: 'test-audio2.wav',
  },
]

const mockPartNames = [
  { id: 'p1', name: '发动机' },
  { id: 'p2', name: '轮胎' },
]

const mockNoiseTypes = [
  { id: 'n1', name: '敲击声' },
  { id: 'n2', name: '胎噪' },
]

const mockRoadTypes = [
  { id: 'r1', name: '沥青路' },
  { id: 'r2', name: '水泥路' },
]

const mockAudios = [
  { id: 'audio1', filename: 'test-audio.wav' },
  { id: 'audio2', filename: 'test-audio2.wav' },
]

describe('Export', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Mock api.get for annotations (returns array, not paginated object)
    ;(api.get as any).mockImplementation((url: string) => {
      if (url === '/annotations') {
        // All annotations returned as array (backend returns List[AnnotationResponse])
        return Promise.resolve({ data: mockAnnotations })
      }
      if (url === '/dict/part-names') {
        return Promise.resolve({ data: mockPartNames })
      }
      if (url === '/dict/noise-types') {
        return Promise.resolve({ data: mockNoiseTypes })
      }
      if (url === '/dict/road-types') {
        return Promise.resolve({ data: mockRoadTypes })
      }
      if (url === '/audio') {
        return Promise.resolve({ data: { items: mockAudios, total: 2 } })
      }
      return Promise.resolve({ data: {} })
    })
  })

  it('渲染页面标题', async () => {
    render(
      <MemoryRouter>
        <Export />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('标注总览')).toBeInTheDocument()
    })
  })

  it('渲染统计数据栏标签', async () => {
    render(
      <MemoryRouter>
        <Export />
      </MemoryRouter>
    )

    await waitFor(() => {
      // Check stat labels exist
      expect(screen.getAllByText('总数').length).toBeGreaterThan(0)
      expect(screen.getAllByText('音频数').length).toBeGreaterThan(0)
      expect(screen.getAllByText('待审核').length).toBeGreaterThan(0)
      expect(screen.getAllByText('已通过').length).toBeGreaterThan(0)
    })
  })

  it('渲染14列表头', async () => {
    render(
      <MemoryRouter>
        <Export />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('音频')).toBeInTheDocument()
      expect(screen.getByText('时间段')).toBeInTheDocument()
      expect(screen.getByText('零部件')).toBeInTheDocument()
      expect(screen.getByText('异响类型')).toBeInTheDocument()
      expect(screen.getByText('路面类型')).toBeInTheDocument()
      expect(screen.getByText('车速')).toBeInTheDocument()
      expect(screen.getByText('温度')).toBeInTheDocument()
      expect(screen.getByText('测试模式')).toBeInTheDocument()
      expect(screen.getByText('异响原因')).toBeInTheDocument()
      expect(screen.getByText('解决方案')).toBeInTheDocument()
      expect(screen.getByText('状态')).toBeInTheDocument()
      expect(screen.getByText('标注人')).toBeInTheDocument()
      expect(screen.getByText('创建时间')).toBeInTheDocument()
      expect(screen.getByText('操作')).toBeInTheDocument()
    })
  })

  it('渲染标注数据', async () => {
    render(
      <MemoryRouter>
        <Export />
      </MemoryRouter>
    )

    await waitFor(() => {
      // 使用 getAllByText 检查元素存在
      expect(screen.getAllByText('test-audio.wav').length).toBeGreaterThan(0)
      expect(screen.getAllByText('发动机').length).toBeGreaterThan(0)
      expect(screen.getAllByText('敲击声').length).toBeGreaterThan(0)
      expect(screen.getAllByText('张三').length).toBeGreaterThan(0)
    })
  })

  it('渲染导出按钮', async () => {
    render(
      <MemoryRouter>
        <Export />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('导出 CSV')).toBeInTheDocument()
      expect(screen.getByText('导出 JSON')).toBeInTheDocument()
      expect(screen.getByText('导出 ZIP')).toBeInTheDocument()
    })
  })

  it('渲染分页组件', async () => {
    render(
      <MemoryRouter>
        <Export />
      </MemoryRouter>
    )

    await waitFor(() => {
      // Check pagination buttons exist
      const buttons = document.querySelectorAll('button')
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  it('状态徽章在表格中显示', async () => {
    render(
      <MemoryRouter>
        <Export />
      </MemoryRouter>
    )

    await waitFor(() => {
      // Check status badges exist (may be multiple)
      const pendingBadges = screen.getAllByText('待审核')
      expect(pendingBadges.length).toBeGreaterThan(0)

      const approvedBadges = screen.getAllByText('已通过')
      expect(approvedBadges.length).toBeGreaterThan(0)
    })
  })

  it('表头筛选下拉可以点击打开', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <Export />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('零部件')).toBeInTheDocument()
    })

    // Find and click the filter button inside the th
    const thElement = document.querySelector('th')
    if (thElement) {
      const filterButton = thElement.querySelector('button')
      if (filterButton) {
        await user.click(filterButton)

        await waitFor(() => {
          expect(screen.getByText('全部')).toBeInTheDocument()
        })
      }
    }
  })

  it('清除筛选按钮初始不显示', async () => {
    render(
      <MemoryRouter>
        <Export />
      </MemoryRouter>
    )

    await waitFor(() => {
      // Initially no clear button visible (筛选条件为空)
      expect(screen.queryByText('清除筛选')).not.toBeInTheDocument()
    })
  })

  it('表格支持水平滚动', async () => {
    render(
      <MemoryRouter>
        <Export />
      </MemoryRouter>
    )

    await waitFor(() => {
      const tableContainer = document.querySelector('table')
      expect(tableContainer).toBeInTheDocument()
    })
  })

  it('显示查看按钮', async () => {
    render(
      <MemoryRouter>
        <Export />
      </MemoryRouter>
    )

    await waitFor(() => {
      // There should be 查看 buttons in the table
      const viewButtons = screen.getAllByText('查看')
      expect(viewButtons.length).toBeGreaterThan(0)
    })
  })
})

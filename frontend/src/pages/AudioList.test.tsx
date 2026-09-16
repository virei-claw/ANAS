import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AudioList from '../pages/AudioList'
import { audioApi, annotationApi } from '@/lib/api'

vi.mock('@/lib/api')

const mockAudios = [
  {
    id: '1',
    filename: 'test-audio.wav',
    filepath: '/audio/test.wav',
    duration: 30,
    sample_rate: 44100,
    file_size: 1024000,
    uploader_name: '测试用户',
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    filename: 'annotated-audio.wav',
    filepath: '/audio/annotated.wav',
    duration: 60,
    sample_rate: 44100,
    file_size: 2048000,
    uploader_name: '测试用户',
    created_at: '2024-01-02T00:00:00Z',
  },
]

const mockAnnotations = [
  {
    id: 'a1',
    audio_id: '2',
    part_name_id: 'p1',
    noise_type_id: 'n1',
    road_type_id: 'r1',
    speed: 60,
    temperature: 25,
    test_mode: '正常',
    reason: '异响原因',
    solution: '解决方案',
    start_time: 5.0,
    end_time: 10.0,
    clip_filepath: null,
    status: 'pending',
    created_at: '2024-01-02T00:00:00Z',
    part_name: '发动机',
    noise_type: '敲击声',
    road_type: '沥青路',
    annotator_id: 'u1',
    annotator_name: '标注员',
  },
  {
    id: 'a2',
    audio_id: '2',
    part_name_id: 'p2',
    noise_type_id: 'n2',
    road_type_id: 'r1',
    speed: 80,
    temperature: 30,
    test_mode: '正常',
    reason: '异响原因2',
    solution: '解决方案2',
    start_time: 15.5,
    end_time: 20.3,
    clip_filepath: null,
    status: 'pending',
    created_at: '2024-01-02T00:00:00Z',
    part_name: '轮胎',
    noise_type: '胎噪',
    road_type: '沥青路',
    annotator_id: 'u1',
    annotator_name: '标注员',
  },
]

describe('AudioList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(audioApi.list as any).mockResolvedValue({
      data: { items: mockAudios, total: 2 },
    })
    ;(audioApi.get as any).mockResolvedValue({ data: mockAudios[0] })
    ;(annotationApi.list as any).mockResolvedValue({ data: mockAnnotations })
  })

  it('渲染音频列表', async () => {
    render(
      <MemoryRouter>
        <AudioList />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('test-audio.wav')).toBeInTheDocument()
      expect(screen.getByText('annotated-audio.wav')).toBeInTheDocument()
    })
  })

  it('悬浮在有标注的音频行上时显示标注预览', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <AudioList />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('annotated-audio.wav')).toBeInTheDocument()
    })

    // 找到有标注的音频行并悬浮
    const annotatedRow = screen.getByText('annotated-audio.wav').closest('tr')
    if (annotatedRow) {
      await user.hover(annotatedRow)

      await waitFor(() => {
        // 检查是否显示标注预览
        expect(screen.getByText(/00:05.0 - 00:10.0/)).toBeInTheDocument()
        expect(screen.getByText(/00:15.5 - 00:20.3/)).toBeInTheDocument()
        expect(screen.getByText(/发动机 - 敲击声/)).toBeInTheDocument()
        expect(screen.getByText(/轮胎 - 胎噪/)).toBeInTheDocument()
      })
    }
  })
})

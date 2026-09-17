import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import AudioWaveform from './AudioWaveform'

// 使用 vi.hoisted() 来定义mock函数
const mockGet = vi.hoisted(() => vi.fn())

// Mock wavesurfer.js
vi.mock('wavesurfer.js', () => {
  const mockWs = {
    load: vi.fn(),
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    playPause: vi.fn(),
    getDuration: vi.fn().mockReturnValue(60),
    getCurrentTime: vi.fn().mockReturnValue(10),
    seekTo: vi.fn(),
    setPlaybackRate: vi.fn(),
    on: vi.fn((event, callback) => {
      // Immediately call ready callback for tests
      if (event === 'ready') {
        setTimeout(() => callback(), 0)
      }
    }),
    destroy: vi.fn(),
  }
  const MockWs: any = vi.fn(() => mockWs)
  MockWs.create = vi.fn(() => mockWs)
  return {
    default: MockWs,
  }
})

vi.mock('wavesurfer.js/plugins/regions', () => {
  return {
    default: {
      create: vi.fn(() => ({
        enableDragSelection: vi.fn(),
        getRegions: vi.fn().mockReturnValue([]),
        clearRegions: vi.fn(),
        on: vi.fn(),
      })),
    },
  }
})

vi.mock('wavesurfer.js/dist/plugins/spectrogram.js', () => {
  return {
    default: {
      create: vi.fn(() => ({})),
    },
  }
})

// Mock API
vi.mock('@/lib/api', () => ({
  default: {
    get: mockGet,
  },
}))

describe('AudioWaveform AI检测功能', () => {
  const mockAudioUrl = '/api/audio/1/stream'
  const mockAudioId = '1'

  beforeEach(() => {
    mockGet.mockReset()
    mockGet.mockResolvedValue({
      data: { segments: [{ start: 1.0, end: 2.0, confidence: 0.8 }] }
    })
  })

  describe('AI检测按钮', () => {
    it('应显示AI检测按钮当audioId提供时', async () => {
      await act(async () => {
        render(<AudioWaveform audioUrl={mockAudioUrl} audioId={mockAudioId} />)
      })
      // 等待ready事件触发
      await waitFor(() => expect(screen.getByRole('button', { name: /AI检测/i })).toBeInTheDocument())
    })

    it('当audioId未提供时不应显示AI检测按钮', async () => {
      await act(async () => {
        render(<AudioWaveform audioUrl={mockAudioUrl} />)
      })
      expect(screen.queryByRole('button', { name: /AI检测/i })).not.toBeInTheDocument()
    })

    it('AI检测按钮在音频加载后应可用', async () => {
      await act(async () => {
        render(<AudioWaveform audioUrl={mockAudioUrl} audioId={mockAudioId} />)
      })
      // 等待ready事件触发
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /AI检测/i })
        expect(button).not.toBeDisabled()
      })
    })
  })

  describe('AI检测功能', () => {
    it('点击AI检测按钮应调用API', async () => {
      await act(async () => {
        render(<AudioWaveform audioUrl={mockAudioUrl} audioId={mockAudioId} />)
      })

      // 等待ready
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /AI检测/i })).not.toBeDisabled()
      })

      const button = screen.getByRole('button', { name: /AI检测/i })
      await act(async () => {
        fireEvent.click(button)
      })

      // 验证API被调用
      expect(mockGet).toHaveBeenCalledWith(`/audio/${mockAudioId}/detect-anomalies`)
    })

    it('AI检测完成后应显示检测结果', async () => {
      mockGet.mockResolvedValue({
        data: {
          segments: [
            { start: 1.0, end: 2.0, confidence: 0.8 },
            { start: 3.0, end: 4.0, confidence: 0.6 }
          ]
        }
      })

      await act(async () => {
        render(<AudioWaveform audioUrl={mockAudioUrl} audioId={mockAudioId} />)
      })

      // 等待ready
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /AI检测/i })).not.toBeDisabled()
      })

      const button = screen.getByRole('button', { name: /AI检测/i })
      await act(async () => {
        fireEvent.click(button)
      })

      // 等待UI更新
      await waitFor(() => {
        expect(screen.getByText(/发现 2 个异常区间/)).toBeInTheDocument()
      })
    })

    it('AI检测按钮点击后应显示加载状态', async () => {
      mockGet.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ data: { segments: [] } }), 100)))

      await act(async () => {
        render(<AudioWaveform audioUrl={mockAudioUrl} audioId={mockAudioId} />)
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /AI检测/i })).not.toBeDisabled()
      })

      const button = screen.getByRole('button', { name: /AI检测/i })
      await act(async () => {
        fireEvent.click(button)
      })

      // 立即检查按钮文字变为"检测中..."
      expect(screen.getByRole('button', { name: /检测中/i })).toBeInTheDocument()
    })
  })

  describe('检测结果展示', () => {
    it('应显示检测到的异常区间详情', async () => {
      mockGet.mockResolvedValue({
        data: {
          segments: [
            { start: 1.5, end: 2.5, confidence: 0.75 }
          ]
        }
      })

      await act(async () => {
        render(<AudioWaveform audioUrl={mockAudioUrl} audioId={mockAudioId} />)
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /AI检测/i })).not.toBeDisabled()
      })

      const button = screen.getByRole('button', { name: /AI检测/i })
      await act(async () => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        // 检查置信度百分比显示
        expect(screen.getByText(/75%/)).toBeInTheDocument()
      })
    })

    it('当无异常区间时应显示0个区间', async () => {
      mockGet.mockResolvedValue({
        data: { segments: [] }
      })

      await act(async () => {
        render(<AudioWaveform audioUrl={mockAudioUrl} audioId={mockAudioId} />)
      })

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /AI检测/i })).not.toBeDisabled()
      })

      const button = screen.getByRole('button', { name: /AI检测/i })
      await act(async () => {
        fireEvent.click(button)
      })

      await waitFor(() => {
        expect(screen.getByText(/发现 0 个异常区间/)).toBeInTheDocument()
      })
    })
  })
})

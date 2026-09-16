import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react'
import AudioWaveform from './AudioWaveform'

// Mock wavesurfer.js - 在 vi.mock 内部定义所有需要的 mock
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

describe('AudioWaveform 播放控制增强功能', () => {
  const mockAudioUrl = '/api/audio/1/stream'

  describe('UI 元素渲染', () => {
    it('应显示播放/暂停按钮', async () => {
      await act(async () => {
        render(<AudioWaveform audioUrl={mockAudioUrl} />)
      })
      expect(screen.getByRole('button', { name: /播放|暂停/i })).toBeInTheDocument()
    })

    it('应显示快退按钮 (-10秒)', async () => {
      await act(async () => {
        render(<AudioWaveform audioUrl={mockAudioUrl} />)
      })
      expect(screen.getByTitle('快退10秒')).toBeInTheDocument()
    })

    it('应显示快进按钮 (+10秒)', async () => {
      await act(async () => {
        render(<AudioWaveform audioUrl={mockAudioUrl} />)
      })
      expect(screen.getByTitle('快进10秒')).toBeInTheDocument()
    })

    it('应显示播放速度选择器', async () => {
      await act(async () => {
        render(<AudioWaveform audioUrl={mockAudioUrl} />)
      })
      expect(screen.getByLabelText(/播放速度/i)).toBeInTheDocument()
    })

    it('应显示循环播放复选框', async () => {
      await act(async () => {
        render(<AudioWaveform audioUrl={mockAudioUrl} />)
      })
      expect(screen.getByRole('checkbox', { name: /循环播放/i })).toBeInTheDocument()
    })

    it('应显示 Mel谱 按钮', async () => {
      await act(async () => {
        render(<AudioWaveform audioUrl={mockAudioUrl} />)
      })
      expect(screen.getByRole('button', { name: 'Mel谱' })).toBeInTheDocument()
    })
  })

  describe('倍速播放选项', () => {
    it('应提供所有指定倍速选项', async () => {
      await act(async () => {
        render(<AudioWaveform audioUrl={mockAudioUrl} />)
      })
      const select = screen.getByLabelText(/播放速度/i) as HTMLSelectElement
      const options = Array.from(select.options).map(opt => opt.value)
      expect(options).toEqual(['0.5', '0.75', '1', '1.25', '1.5', '2'])
    })

    it('默认倍速应为 1x', async () => {
      await act(async () => {
        render(<AudioWaveform audioUrl={mockAudioUrl} />)
      })
      const select = screen.getByLabelText(/播放速度/i) as HTMLSelectElement
      expect(select.value).toBe('1')
    })
  })

  describe('循环播放', () => {
    it('默认循环播放应为关闭状态', async () => {
      await act(async () => {
        render(<AudioWaveform audioUrl={mockAudioUrl} />)
      })
      const checkbox = screen.getByRole('checkbox', { name: /循环播放/i })
      expect(checkbox).not.toBeChecked()
    })

    it('点击循环播放复选框应切换状态', async () => {
      await act(async () => {
        render(<AudioWaveform audioUrl={mockAudioUrl} />)
      })
      const checkbox = screen.getByRole('checkbox', { name: /循环播放/i })
      await act(async () => {
        fireEvent.click(checkbox)
      })
      expect(checkbox).toBeChecked()
    })

    it('再次点击循环播放复选框应关闭', async () => {
      await act(async () => {
        render(<AudioWaveform audioUrl={mockAudioUrl} />)
      })
      const checkbox = screen.getByRole('checkbox', { name: /循环播放/i })
      await act(async () => {
        fireEvent.click(checkbox)
        fireEvent.click(checkbox)
      })
      expect(checkbox).not.toBeChecked()
    })
  })

  describe('快进/快退功能', () => {
    it('快进按钮和快退按钮在音频加载后应可用', async () => {
      await act(async () => {
        render(<AudioWaveform audioUrl={mockAudioUrl} />)
      })
      // 等待 ready 事件触发
      await waitFor(() => expect(screen.getByTitle('快进10秒')).toBeEnabled())

      const skipForwardBtn = screen.getByTitle('快进10秒')
      const skipBackwardBtn = screen.getByTitle('快退10秒')

      // 验证按钮可点击且不会抛出错误
      await act(async () => {
        fireEvent.click(skipForwardBtn)
        fireEvent.click(skipBackwardBtn)
      })

      expect(skipForwardBtn).toBeEnabled()
      expect(skipBackwardBtn).toBeEnabled()
    })

    it('快进快退按钮在音频未加载时应禁用', async () => {
      // 使用一个不存在的 audioUrl 让组件保持未就绪状态
      await act(async () => {
        render(<AudioWaveform audioUrl="" />)
      })

      const skipForwardBtn = screen.getByTitle('快进10秒')
      const skipBackwardBtn = screen.getByTitle('快退10秒')

      expect(skipForwardBtn).toBeDisabled()
      expect(skipBackwardBtn).toBeDisabled()
    })
  })

  describe('播放速度选择', () => {
    it('应能选择 2x 倍速', async () => {
      await act(async () => {
        render(<AudioWaveform audioUrl={mockAudioUrl} />)
      })

      const select = screen.getByLabelText(/播放速度/i) as HTMLSelectElement
      await act(async () => {
        fireEvent.change(select, { target: { value: '2' } })
      })

      expect(select.value).toBe('2')
    })

    it('应能选择 0.5x 倍速', async () => {
      await act(async () => {
        render(<AudioWaveform audioUrl={mockAudioUrl} />)
      })

      const select = screen.getByLabelText(/播放速度/i) as HTMLSelectElement
      await act(async () => {
        fireEvent.change(select, { target: { value: '0.5' } })
      })

      expect(select.value).toBe('0.5')
    })
  })
})

import { useEffect, useRef, useState, useCallback } from 'react'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/plugins/regions'
import SpectrogramPlugin from 'wavesurfer.js/dist/plugins/spectrogram.js'
import { formatTime } from '@/lib/utils'
import { useHotkeys } from '@/hooks/useHotkeys'
import HotkeyHelp from './HotkeyHelp'
import api from '@/lib/api'

interface AudioWaveformProps {
  audioUrl: string
  audioId?: string
  onRegionSave?: (start: number, end: number) => void
}

interface AnomalySegment {
  start: number
  end: number
  confidence: number
}

export default function AudioWaveform({ audioUrl, audioId, onRegionSave }: AudioWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const wsRef = useRef<WaveSurfer | null>(null)
  const regionsRef = useRef<RegionsPlugin | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [region, setRegion] = useState<{ start: number; end: number } | null>(null)
  const [showSpectrogram, setShowSpectrogram] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [isLooping, setIsLooping] = useState(false)
  const [isDetecting, setIsDetecting] = useState(false)
  const [detectedSegments, setDetectedSegments] = useState<AnomalySegment[]>([])
  const [showDetection, setShowDetection] = useState(false)

  useEffect(() => {
    if (!containerRef.current || !audioUrl) return

    if (wsRef.current) {
      try { wsRef.current.destroy() } catch (e) { /* ignore */ }
    }

    const regions = RegionsPlugin.create()
    regionsRef.current = regions

    const spectrogram = SpectrogramPlugin.create({
      labels: true,
    })

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: '#4F46E5',
      progressColor: '#7C3AED',
      cursorColor: '#EF4444',
      height: 128,
      plugins: showSpectrogram ? [regions, spectrogram] : [regions],
    })

    regions.enableDragSelection({
      drag: true,
      resize: true,
    })

    wsRef.current = ws

    ws.on('play', () => setIsPlaying(true))
    ws.on('pause', () => setIsPlaying(false))
    ws.on('timeupdate', (time) => setCurrentTime(time))
    ws.on('ready', () => {
      setDuration(ws.getDuration())
      setIsReady(true)
      setError(null)
    })
    ws.on('finish', () => {
      setIsPlaying(false)
      if (isLooping) {
        ws.play()
      }
    })
    ws.on('error', (err) => {
      console.error('WaveSurfer error:', err)
      setError('音频加载失败: ' + String(err))
    })

    regions.on('region-created', (reg) => {
      setRegion({ start: reg.start, end: reg.end })
    })
    regions.on('region-updated', (reg) => {
      setRegion({ start: reg.start, end: reg.end })
    })

    ws.load(audioUrl)

    return () => {
      try {
        ws.destroy()
      } catch (e) {
        // Ignore destroy errors during unmount
      }
      wsRef.current = null
      regionsRef.current = null
    }
  }, [audioUrl, showSpectrogram, isLooping])

  const togglePlay = useCallback(() => {
    wsRef.current?.playPause()
  }, [])

  const playRegion = useCallback(() => {
    if (!region || !regionsRef.current) return
    const regions = regionsRef.current.getRegions()
    if (regions.length > 0) {
      regions[0].play()
    }
  }, [region])

  const handleSaveRegion = useCallback(() => {
    if (region && onRegionSave) {
      onRegionSave(region.start, region.end)
      regionsRef.current?.clearRegions()
      setRegion(null)
    }
  }, [region, onRegionSave])

  const toggleSpectrogram = useCallback(() => {
    setShowSpectrogram(prev => !prev)
  }, [])

  const skip = useCallback((seconds: number) => {
    if (!wsRef.current) return
    const current = wsRef.current.getCurrentTime()
    const dur = wsRef.current.getDuration()
    wsRef.current.seekTo((current + seconds) / dur)
  }, [])

  const handlePlaybackRateChange = useCallback((rate: number) => {
    setPlaybackRate(rate)
    wsRef.current?.setPlaybackRate(rate)
  }, [])

  const toggleLoop = useCallback(() => {
    setIsLooping(prev => !prev)
  }, [])

  const handleDetect = useCallback(async () => {
    if (!audioId || isDetecting) return
    setIsDetecting(true)
    setShowDetection(false)
    setDetectedSegments([])
    try {
      const res = await api.get(`/audio/${audioId}/detect-anomalies`)
      setDetectedSegments(res.data.segments || [])
      setShowDetection(true)
    } catch (err) {
      console.error('AI检测失败:', err)
    } finally {
      setIsDetecting(false)
    }
  }, [audioId, isDetecting])

  // 快捷键支持
  useHotkeys({
    ' ': togglePlay,
    j: () => skip(-10),
    k: togglePlay,
    l: () => skip(10),
    '[': () => skip(-5),
    ']': () => skip(5),
  })

  // 通用按钮样式
  const buttonBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    fontSize: '14px',
    fontWeight: 500,
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'var(--font-body)',
  }

  const primaryButtonStyle: React.CSSProperties = {
    ...buttonBase,
    background: isReady ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : '#D1D5DB',
    color: 'white',
    boxShadow: isReady ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
  }

  const secondaryButtonStyle: React.CSSProperties = {
    ...buttonBase,
    background: '#F3F4F6',
    color: '#374151',
  }

  const spectrogramButtonStyle: React.CSSProperties = {
    ...buttonBase,
    background: showSpectrogram ? '#EEF2FF' : '#F3F4F6',
    color: showSpectrogram ? '#4F46E5' : '#6B7280',
  }

  const detectButtonStyle: React.CSSProperties = {
    ...buttonBase,
    background: isReady && !isDetecting ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)' : '#D1D5DB',
    color: 'white',
    boxShadow: isReady && !isDetecting ? '0 4px 12px rgba(220,38,38,0.3)' : 'none',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Playback Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          disabled={!isReady}
          style={primaryButtonStyle}
          onMouseEnter={(e) => { if (isReady) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(37,99,235,0.4)'; }}}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isReady ? '0 4px 12px rgba(37,99,235,0.3)' : 'none'; }}
        >
          {isPlaying ? '暂停' : '播放'}
        </button>

        {/* Time Display */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontFamily: 'var(--font-display)',
          fontSize: '14px',
          fontWeight: 500,
          color: '#374151'
        }}>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatTime(currentTime)}</span>
          <span style={{ color: '#9CA3AF' }}>/</span>
          <span style={{ fontVariantNumeric: 'tabular-nums', color: '#6B7280' }}>{formatTime(duration)}</span>
        </div>

        {/* Skip Buttons */}
        <button
          onClick={() => skip(-10)}
          disabled={!isReady}
          style={{
            ...secondaryButtonStyle,
            padding: '8px 12px',
            background: isReady ? '#F9FAFB' : '#F3F4F6',
            color: isReady ? '#374151' : '#9CA3AF',
            cursor: isReady ? 'pointer' : 'not-allowed',
          }}
          title="快退10秒"
        >
          -10s
        </button>
        <button
          onClick={() => skip(10)}
          disabled={!isReady}
          style={{
            ...secondaryButtonStyle,
            padding: '8px 12px',
            background: isReady ? '#F9FAFB' : '#F3F4F6',
            color: isReady ? '#374151' : '#9CA3AF',
            cursor: isReady ? 'pointer' : 'not-allowed',
          }}
          title="快进10秒"
        >
          +10s
        </button>

        {/* Playback Speed */}
        <select
          value={playbackRate}
          onChange={(e) => handlePlaybackRateChange(Number(e.target.value))}
          disabled={!isReady}
          style={{
            padding: '8px 12px',
            fontSize: '14px',
            fontFamily: 'var(--font-body)',
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            outline: 'none',
            cursor: isReady ? 'pointer' : 'not-allowed',
            color: '#374151',
          }}
          aria-label="播放速度"
        >
          <option value={0.5}>0.5x</option>
          <option value={0.75}>0.75x</option>
          <option value={1}>1x</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
          <option value={2}>2x</option>
        </select>

        {/* Loop Toggle */}
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '14px',
          color: isLooping ? '#2563EB' : '#6B7280',
          cursor: 'pointer',
          fontFamily: 'var(--font-body)',
          fontWeight: 500,
        }}>
          <input
            type="checkbox"
            checked={isLooping}
            onChange={toggleLoop}
            style={{ cursor: 'pointer' }}
          />
          循环
        </label>

        {/* Spectrogram Toggle */}
        <button
          onClick={toggleSpectrogram}
          style={spectrogramButtonStyle}
        >
          Mel谱
        </button>

        {/* AI Detection */}
        {audioId && (
          <button
            onClick={handleDetect}
            disabled={!isReady || isDetecting}
            style={detectButtonStyle}
            onMouseEnter={(e) => { if (isReady && !isDetecting) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(220,38,38,0.4)'; }}}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isReady && !isDetecting ? '0 4px 12px rgba(220,38,38,0.3)' : 'none'; }}
          >
            {isDetecting ? '检测中...' : 'AI检测'}
          </button>
        )}

        {/* Status */}
        {!isReady && !error && (
          <span style={{ fontSize: '14px', color: '#9CA3AF', fontFamily: 'var(--font-body)' }}>加载中...</span>
        )}
        {error && (
          <span style={{ fontSize: '14px', color: '#DC2626', fontFamily: 'var(--font-body)' }}>{error}</span>
        )}
        {showDetection && (
          <span style={{ fontSize: '14px', color: '#DC2626', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
            发现 {detectedSegments.length} 个异常区间
          </span>
        )}
      </div>

      {/* Hotkey Help */}
      <HotkeyHelp />

      {/* Waveform Container */}
      <div ref={containerRef} style={{ width: '100%', background: '#F9FAFB', borderRadius: '12px', minHeight: '128px', overflow: 'hidden' }} />

      {/* AI Detection Results */}
      {showDetection && detectedSegments.length > 0 && (
        <div style={{ padding: '16px', background: '#FEF2F2', borderRadius: '12px', border: '1px solid #FECACA' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#991B1B', marginBottom: '12px', fontFamily: 'var(--font-display)' }}>AI检测结果:</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {detectedSegments.map((seg, i) => (
              <div key={i} style={{ fontSize: '14px', color: '#DC2626', fontFamily: 'var(--font-body)' }}>
                {formatTime(seg.start)} - {formatTime(seg.end)} (置信度: {(seg.confidence * 100).toFixed(0)}%)
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Region Selection */}
      {region && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '16px',
          background: '#EEF2FF',
          borderRadius: '12px',
          border: '1px solid #C7D2FE'
        }}>
          <span style={{ fontSize: '14px', color: '#4338CA', fontFamily: 'var(--font-body)', fontWeight: 500 }}>
            选段: {formatTime(region.start)} - {formatTime(region.end)}
          </span>
          <button
            onClick={playRegion}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            播放选中片段
          </button>
          <button
            onClick={handleSaveRegion}
            style={{
              padding: '8px 16px',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
              fontFamily: 'var(--font-body)',
            }}
          >
            保存标注
          </button>
          <button
            onClick={() => {
              regionsRef.current?.clearRegions()
              setRegion(null)
            }}
            style={{
              padding: '8px 16px',
              background: '#F3F4F6',
              color: '#6B7280',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            取消
          </button>
        </div>
      )}
    </div>
  )
}

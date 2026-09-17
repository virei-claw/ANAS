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
        // Ignore destroy errors during unmount (AbortError etc)
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          disabled={!isReady}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isPlaying ? '暂停' : '播放'}
        </button>
        <div className="text-sm">
          <span className="font-mono">{formatTime(currentTime)}</span>
          <span className="mx-2">/</span>
          <span className="font-mono">{formatTime(duration)}</span>
        </div>
        <button
          onClick={() => skip(-10)}
          disabled={!isReady}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
          title="快退10秒"
        >
          -10s
        </button>
        <button
          onClick={() => skip(10)}
          disabled={!isReady}
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
          title="快进10秒"
        >
          +10s
        </button>
        <select
          value={playbackRate}
          onChange={(e) => handlePlaybackRateChange(Number(e.target.value))}
          disabled={!isReady}
          className="px-2 py-1 border rounded disabled:bg-gray-100"
          aria-label="播放速度"
        >
          <option value={0.5}>0.5x</option>
          <option value={0.75}>0.75x</option>
          <option value={1}>1x</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
          <option value={2}>2x</option>
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isLooping}
            onChange={toggleLoop}
            className="rounded"
          />
          循环播放
        </label>
        <button
          onClick={toggleSpectrogram}
          className={`px-3 py-1 rounded ${showSpectrogram ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'}`}
        >
          Mel谱
        </button>
        {audioId && (
          <button
            onClick={handleDetect}
            disabled={!isReady || isDetecting}
            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isDetecting ? '检测中...' : 'AI检测'}
          </button>
        )}
        {!isReady && !error && <span className="text-sm text-gray-500">加载中...</span>}
        {error && <span className="text-sm text-red-500">{error}</span>}
        {showDetection && (
          <span className="text-sm text-red-600">
            发现 {detectedSegments.length} 个异常区间
          </span>
        )}
      </div>

      <HotkeyHelp />

      <div ref={containerRef} className="w-full bg-gray-100 rounded" style={{ minHeight: '128px' }} />

      {showDetection && detectedSegments.length > 0 && (
        <div className="mt-2 p-3 bg-red-50 rounded-lg">
          <div className="text-sm font-medium text-red-700 mb-2">AI检测结果:</div>
          <div className="space-y-1">
            {detectedSegments.map((seg, i) => (
              <div key={i} className="text-sm text-red-600">
                {formatTime(seg.start)} - {formatTime(seg.end)} (置信度: {(seg.confidence * 100).toFixed(0)}%)
              </div>
            ))}
          </div>
        </div>
      )}

      {region && (
        <div className="flex items-center gap-4 p-3 bg-indigo-50 rounded-lg">
          <span className="text-sm">
            选段: {formatTime(region.start)} - {formatTime(region.end)}
          </span>
          <button
            onClick={playRegion}
            className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
          >
            播放选中片段
          </button>
          <button
            onClick={handleSaveRegion}
            className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700"
          >
            保存标注
          </button>
          <button
            onClick={() => {
              regionsRef.current?.clearRegions()
              setRegion(null)
            }}
            className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
          >
            取消
          </button>
        </div>
      )}
    </div>
  )
}

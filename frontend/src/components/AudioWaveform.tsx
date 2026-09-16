import { useEffect, useRef, useState, useCallback } from 'react'
import WaveSurfer from 'wavesurfer.js'
import RegionsPlugin from 'wavesurfer.js/plugins/regions'
import SpectrogramPlugin from 'wavesurfer.js/dist/plugins/spectrogram.js'
import { formatTime } from '@/lib/utils'

interface AudioWaveformProps {
  audioUrl: string
  onRegionSave?: (start: number, end: number) => void
}

export default function AudioWaveform({ audioUrl, onRegionSave }: AudioWaveformProps) {
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
        {!isReady && !error && <span className="text-sm text-gray-500">加载中...</span>}
        {error && <span className="text-sm text-red-500">{error}</span>}
      </div>

      <div ref={containerRef} className="w-full bg-gray-100 rounded" style={{ minHeight: '128px' }} />

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

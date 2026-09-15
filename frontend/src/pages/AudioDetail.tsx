import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { audioApi, annotationApi, AudioFile, Annotation } from '@/lib/api'
import AudioWaveform from '@/components/AudioWaveform'
import AnnotationForm from '@/components/AnnotationForm'
import { formatTime } from '@/lib/utils'

export default function AudioDetail() {
  const { id } = useParams<{ id: string }>()
  const [audio, setAudio] = useState<AudioFile | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<{ start: number; end: number } | null>(null)

  const loadData = useCallback(async () => {
    if (!id) return
    const [audioRes, annotationRes] = await Promise.all([
      audioApi.get(id),
      annotationApi.list(id),
    ])
    setAudio(audioRes.data)
    setAnnotations(annotationRes.data)
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleRegionSave = useCallback((start: number, end: number) => {
    setSelectedRegion({ start, end })
    setShowForm(true)
  }, [])

  const handleFormSuccess = useCallback(() => {
    setShowForm(false)
    setSelectedRegion(null)
    loadData()
  }, [loadData])

  if (!audio) {
    return <div className="text-center py-8">加载中...</div>
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <Link to="/" className="text-indigo-600 hover:underline mb-4 inline-block">← 返回列表</Link>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-xl font-bold mb-2">{audio.filename}</h1>
        <div className="text-sm text-gray-500">
          时长: {formatTime(audio.duration)} | 采样率: {audio.sample_rate} Hz | 大小: {(audio.file_size / 1024 / 1024).toFixed(2)} MB
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">波形 & 频谱</h2>
        <AudioWaveform
          audioUrl={`/api/audio/${id}/stream`}
          onRegionSave={handleRegionSave}
        />
      </div>

      {showForm && selectedRegion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="w-full max-w-2xl">
            <AnnotationForm
              audioId={id!}
              startTime={selectedRegion.start}
              endTime={selectedRegion.end}
              onSuccess={handleFormSuccess}
              onCancel={() => {
                setShowForm(false)
                setSelectedRegion(null)
              }}
            />
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">标注列表 ({annotations.length})</h2>
        {annotations.length === 0 ? (
          <div className="text-gray-500 text-center py-4">暂无标注</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">零部件</th>
                <th className="py-2">异响类型</th>
                <th className="py-2">路面</th>
                <th className="py-2">车速</th>
                <th className="py-2">温度</th>
                <th className="py-2">场景</th>
                <th className="py-2">时间段</th>
                <th className="py-2">操作</th>
              </tr>
            </thead>
            <tbody>
              {annotations.map((ann) => (
                <tr key={ann.id} className="border-b">
                  <td className="py-2">{ann.part_name || '-'}</td>
                  <td className="py-2">{ann.noise_type || '-'}</td>
                  <td className="py-2">{ann.road_type || '-'}</td>
                  <td className="py-2">{ann.speed ?? '-'}</td>
                  <td className="py-2">{ann.temperature ?? '-'}</td>
                  <td className="py-2">{ann.test_mode === 'dynamic' ? '动态' : '静态'}</td>
                  <td className="py-2">{ann.annotator_name || '未知'}</td>
                  <td className="py-2 font-mono text-sm">{formatTime(ann.start_time)} - {formatTime(ann.end_time)}</td>
                  <td className="py-2">
                    <button
                      onClick={async () => {
                        if (!confirm('确定删除?')) return
                        await annotationApi.delete(ann.id)
                        loadData()
                      }}
                      className="text-red-600 hover:underline text-sm"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

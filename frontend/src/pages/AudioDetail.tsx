import { useEffect, useState, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { audioApi, annotationApi, AudioFile, Annotation } from '@/lib/api'
import AudioWaveform from '@/components/AudioWaveform'
import AnnotationForm from '@/components/AnnotationForm'
import { formatTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import { X, Edit2, Save, Clock } from 'lucide-react'
import { useAutoDraft } from '@/hooks/useAutoDraft'

// 标注详情 Modal 组件
interface AnnotationDetailModalProps {
  annotation: Annotation
  onClose: () => void
  onSave: (id: string, data: Partial<Annotation>) => Promise<void>
  onRefresh: () => void
}

interface HistoryItem {
  id: string
  annotation_id: string
  version: number
  data: Record<string, any>
  changed_by: string | null
  change_reason: string | null
  created_at: string
}

function AnnotationDetailModal({ annotation, onClose, onSave, onRefresh }: AnnotationDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState<'detail' | 'history'>('detail')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [formData, setFormData] = useState({
    part_name: annotation.part_name || '',
    noise_type: annotation.noise_type || '',
    road_type: annotation.road_type || '',
    speed: annotation.speed ?? '',
    temperature: annotation.temperature ?? '',
    test_mode: annotation.test_mode || '',
    reason: annotation.reason || '',
    solution: annotation.solution || '',
  })
  const [saving, setSaving] = useState(false)

  // annotation 变化时重置状态
  useEffect(() => {
    setIsEditing(false)
    setActiveTab('detail')
    setHistory([])
    setFormData({
      part_name: annotation.part_name || '',
      noise_type: annotation.noise_type || '',
      road_type: annotation.road_type || '',
      speed: annotation.speed ?? '',
      temperature: annotation.temperature ?? '',
      test_mode: annotation.test_mode || '',
      reason: annotation.reason || '',
      solution: annotation.solution || '',
    })
  }, [annotation.id])

  // 加载历史记录
  useEffect(() => {
    if (activeTab === 'history') {
      setLoadingHistory(true)
      console.log('Fetching history for annotation:', annotation.id)
      annotationApi.getHistory(annotation.id)
        .then(res => {
          console.log('History response:', res)
          setHistory(Array.isArray(res.data) ? res.data : [])
        })
        .catch(err => {
          console.error('History error details:', {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data
          })
          if (err.response?.status === 404) {
            setHistory([])
          } else {
            toast.error(err.response?.data?.detail || err.message || '加载历史记录失败')
          }
        })
        .finally(() => setLoadingHistory(false))
    }
  }, [activeTab, annotation.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(annotation.id, {
        part_name: formData.part_name || null,
        noise_type: formData.noise_type || null,
        road_type: formData.road_type || null,
        speed: formData.speed === '' ? null : Number(formData.speed),
        temperature: formData.temperature === '' ? null : Number(formData.temperature),
        test_mode: formData.test_mode || null,
        reason: formData.reason || null,
        solution: formData.solution || null,
      })
      toast.success('保存成功')
      setIsEditing(false)
      onRefresh()
    } catch (error) {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }

  const renderDetailTab = () => (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">零部件</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.part_name}
              onChange={(e) => setFormData({ ...formData, part_name: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 rounded-lg">{annotation.part_name || '-'}</div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">异响类型</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.noise_type}
              onChange={(e) => setFormData({ ...formData, noise_type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 rounded-lg">{annotation.noise_type || '-'}</div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">路面类型</label>
          {isEditing ? (
            <input
              type="text"
              value={formData.road_type}
              onChange={(e) => setFormData({ ...formData, road_type: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 rounded-lg">{annotation.road_type || '-'}</div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">车速 (km/h)</label>
          {isEditing ? (
            <input
              type="number"
              value={formData.speed}
              onChange={(e) => setFormData({ ...formData, speed: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 rounded-lg">{annotation.speed ?? '-'}</div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">温度 (°C)</label>
          {isEditing ? (
            <input
              type="number"
              value={formData.temperature}
              onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          ) : (
            <div className="px-3 py-2 bg-gray-50 rounded-lg">{annotation.temperature ?? '-'}</div>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">测试场景</label>
          {isEditing ? (
            <select
              value={formData.test_mode}
              onChange={(e) => setFormData({ ...formData, test_mode: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">请选择</option>
              <option value="dynamic">动态</option>
              <option value="static">静态</option>
            </select>
          ) : (
            <div className="px-3 py-2 bg-gray-50 rounded-lg">
              {annotation.test_mode === 'dynamic' ? '动态' : annotation.test_mode === 'static' ? '静态' : '-'}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">异响原因</label>
        {isEditing ? (
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        ) : (
          <div className="px-3 py-2 bg-gray-50 rounded-lg min-h-[60px]">{annotation.reason || '-'}</div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">解决方案</label>
        {isEditing ? (
          <textarea
            value={formData.solution}
            onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        ) : (
          <div className="px-3 py-2 bg-gray-50 rounded-lg min-h-[60px]">{annotation.solution || '-'}</div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
        <div>时间段: <span className="font-mono">{formatTime(annotation.start_time)} - {formatTime(annotation.end_time)}</span></div>
        <div>状态: <span className={`font-medium ${
          annotation.status === 'approved' ? 'text-green-600' :
          annotation.status === 'rejected' ? 'text-red-600' :
          annotation.status === 'submitted' ? 'text-blue-600' : 'text-gray-600'
        }`}>{
          annotation.status === 'approved' ? '已通过' :
          annotation.status === 'rejected' ? '已驳回' :
          annotation.status === 'submitted' ? '审核中' : '草稿'
        }</span></div>
        <div>标注人: {annotation.annotator_name || '未知'}</div>
        <div>创建时间: {new Date(annotation.created_at).toLocaleString()}</div>
      </div>
    </>
  )

  const renderHistoryTab = () => (
    <div className="space-y-4">
      {loadingHistory ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : history.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无审核历史</div>
      ) : (
        <div className="space-y-3">
          {history.map((h) => (
            <div key={h.id} className="border rounded-lg p-3 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className={`px-2 py-0.5 text-xs rounded ${
                  h.data?.status === 'approved' ? 'bg-green-100 text-green-700' :
                  h.data?.status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }`}>
                  {h.data?.status === 'approved' ? '审核通过' :
                   h.data?.status === 'rejected' ? '审核驳回' : '其他操作'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(h.created_at).toLocaleString()}
                </span>
              </div>
              {h.change_reason && (
                <div className="text-sm text-gray-700 mb-1">
                  <span className="text-gray-500">原因：</span>{h.change_reason}
                </div>
              )}
              {h.data?.reject_reason && (
                <div className="text-sm text-gray-700 mb-1">
                  <span className="text-gray-500">驳回原因：</span>{h.data.reject_reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('detail')}
              className={`px-3 py-1 text-sm rounded ${activeTab === 'detail' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              详情
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${activeTab === 'history' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Clock size={14} />
              审核历史
            </button>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {activeTab === 'detail' ? renderDetailTab() : renderHistoryTab()}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                disabled={saving}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? '保存中...' : '保存'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded-lg hover:bg-gray-100"
              >
                关闭
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
              >
                <Edit2 size={18} />
                编辑
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AudioDetail() {
  const { id } = useParams<{ id: string }>()
  const [audio, setAudio] = useState<AudioFile | null>(null)
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [showForm, setShowForm] = useState(false)
  const [selectedRegion, setSelectedRegion] = useState<{ start: number; end: number } | null>(null)
  const [selectedAnnotation, setSelectedAnnotation] = useState<Annotation | null>(null)

  // 自动草稿保存
  const { restoreDraft, clearDraft } = useAutoDraft(id || '', selectedRegion)

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

  // 页面加载时检查草稿
  useEffect(() => {
    const draft = restoreDraft()
    if (draft) {
      toast.success('检测到未保存的草稿，是否恢复？', {
        duration: 5000,
      })
    }
  }, [id])

  const handleRegionSave = useCallback((start: number, end: number) => {
    setSelectedRegion({ start, end })
    setShowForm(true)
  }, [])

  const handleFormSuccess = useCallback(() => {
    clearDraft()
    setShowForm(false)
    setSelectedRegion(null)
    loadData()
  }, [loadData, clearDraft])

  const handleAnnotationSave = useCallback(async (annotationId: string, data: Partial<Annotation>) => {
    await annotationApi.update(annotationId, data)
  }, [])

  const handleDetailClose = useCallback(() => {
    setSelectedAnnotation(null)
  }, [])

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
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
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
                <th className="py-2">标注用户</th>
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
                  <td className="py-2 font-mono text-sm">{formatTime(ann.start_time)} - {formatTime(ann.end_time)}</td>
                  <td className="py-2">{ann.annotator_name || '未知'}</td>
                  <td className="py-2 flex gap-2">
                    <button
                      onClick={() => setSelectedAnnotation(ann)}
                      className="text-indigo-600 hover:underline text-sm"
                    >
                      查看详情
                    </button>
                    {ann.status === 'draft' && (
                      <button
                        onClick={async () => {
                          if (!confirm('确定提交审核?')) return
                          await annotationApi.submit(ann.id)
                          toast.success('已提交审核')
                          loadData()
                        }}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        提交审核
                      </button>
                    )}
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

      {selectedAnnotation && (
        <AnnotationDetailModal
          annotation={selectedAnnotation}
          onClose={handleDetailClose}
          onSave={handleAnnotationSave}
          onRefresh={loadData}
        />
      )}
    </div>
  )
}

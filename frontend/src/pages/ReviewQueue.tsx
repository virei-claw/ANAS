import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '@/lib/api'

interface PendingAnnotation {
  id: string
  audio_id: string
  audio_filename: string
  start_time: number
  end_time: number
  status: string
  created_at: string
  part_name: string | null
  noise_type: string | null
}

export default function ReviewQueue() {
  const [annotations, setAnnotations] = useState<PendingAnnotation[]>([])
  const [loading, setLoading] = useState(false)

  const loadPending = async () => {
    setLoading(true)
    try {
      const response = await api.get('/annotations/pending')
      setAnnotations(response.data)
    } catch (error: any) {
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPending()
  }, [])

  const handleApprove = async (id: string) => {
    try {
      await api.put(`/annotations/${id}/approve`)
      toast.success('审核通过')
      loadPending()
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || '操作失败')
    }
  }

  const handleReject = async (id: string) => {
    const reason = prompt('请输入打回原因:')
    if (!reason) return
    try {
      await api.put(`/annotations/${id}/reject`, { reject_reason: reason })
      toast.success('已打回')
      loadPending()
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || '操作失败')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">待审核标注</h1>

      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : annotations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <div className="text-6xl mb-4">✅</div>
          <h3 className="text-lg font-medium text-gray-900">暂无待审核标注</h3>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">音频</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">时间段</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">零部件</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">异响类型</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {annotations.map((ann) => (
                <tr key={ann.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/audio/${ann.audio_id}`} className="text-indigo-600 hover:underline">
                      {ann.audio_filename}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">
                    {ann.start_time.toFixed(2)}s - {ann.end_time.toFixed(2)}s
                  </td>
                  <td className="px-4 py-3">{ann.part_name || '-'}</td>
                  <td className="px-4 py-3">{ann.noise_type || '-'}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleApprove(ann.id)}
                      className="text-green-600 hover:underline mr-4"
                    >
                      通过
                    </button>
                    <button
                      onClick={() => handleReject(ann.id)}
                      className="text-red-600 hover:underline"
                    >
                      打回
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

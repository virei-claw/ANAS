import { useEffect, useState } from 'react'
import { AudioLines, FileText, Clock, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'

interface DashboardStats {
  total_audios: number
  total_annotations: number
  today_annotations: number
  active_users: number
  status_counts: {
    draft: number
    submitted: number
    approved: number
    rejected: number
  }
  noise_type_stats: { name: string; count: number }[]
  part_stats: { name: string; count: number }[]
  daily_trend: { date: string; count: number }[]
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const resp = await api.get('/stats/dashboard')
      setStats(resp.data)
    } catch {
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    { label: '总音频数', value: stats.total_audios, icon: AudioLines, color: 'bg-blue-500' },
    { label: '总标注数', value: stats.total_annotations, icon: FileText, color: 'bg-green-500' },
    { label: '今日标注', value: stats.today_annotations, icon: TrendingUp, color: 'bg-purple-500' },
    { label: '待审核', value: stats.status_counts.submitted, icon: Clock, color: 'bg-orange-500' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">统计分析</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-500 text-sm">{label}</span>
              <div className={`${color} p-3 rounded-lg`}>
                <Icon className="text-white" size={24} />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{value}</div>
          </div>
        ))}
      </div>

      {/* 标注状态分布 */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold mb-4">标注状态分布</h3>
          <div className="space-y-3">
            {Object.entries(stats.status_counts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">{status}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="font-semibold mb-4">异响类型分布</h3>
          {stats.noise_type_stats.length === 0 ? (
            <p className="text-gray-500 text-sm">暂无数据</p>
          ) : (
            <div className="space-y-2">
              {stats.noise_type_stats.slice(0, 5).map(({ name, count }) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{name}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 零部件问题排行 */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold mb-4">零部件问题排行 TOP 10</h3>
        {stats.part_stats.length === 0 ? (
          <p className="text-gray-500 text-sm">暂无数据</p>
        ) : (
          <div className="space-y-2">
            {stats.part_stats.map(({ name, count }, idx) => (
              <div key={name} className="flex items-center gap-4">
                <span className="w-6 text-gray-400 text-sm">{idx + 1}</span>
                <span className="flex-1 text-sm text-gray-600">{name}</span>
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-indigo-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (count / stats.part_stats[0].count) * 100)}%` }}
                  />
                </div>
                <span className="font-medium w-8 text-right">{count}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

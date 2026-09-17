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

interface UserWorkload {
  user_id: number
  username: string
  full_name: string
  count: number
}

interface MyWorkload {
  pending: number
  reviewing: number
  completed: number
}

interface MySummary {
  total_count: number
  by_status: {
    draft: number
    submitted: number
    approved: number
    rejected: number
  }
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [userWorkload, setUserWorkload] = useState<UserWorkload[]>([])
  const [myWorkload, setMyWorkload] = useState<MyWorkload>({ pending: 0, reviewing: 0, completed: 0 })
  const [mySummary, setMySummary] = useState<MySummary>({ total_count: 0, by_status: { draft: 0, submitted: 0, approved: 0, rejected: 0 } })
  const [summaryPeriod, setSummaryPeriod] = useState('week')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    api.get(`/stats/my-summary?period=${summaryPeriod}`).then(res => setMySummary(res.data))
  }, [summaryPeriod])

  const loadStats = async () => {
    setLoading(true)
    try {
      const [statsResp, workloadResp, myWorkloadResp] = await Promise.all([
        api.get('/stats/dashboard'),
        api.get('/stats/user-workload'),
        api.get('/stats/my-workload')
      ])
      setStats(statsResp.data)
      setUserWorkload(workloadResp.data)
      setMyWorkload(myWorkloadResp.data)
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

  const workloadColors = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    green: 'bg-green-50 border-green-200 text-green-800'
  }

  const workloadCards = [
    { title: '待标注', count: myWorkload.pending, color: 'yellow' as const },
    { title: '审核中', count: myWorkload.reviewing, color: 'blue' as const },
    { title: '已完成', count: myWorkload.completed, color: 'green' as const },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">统计分析</h1>

      {/* 个人工作台 */}
      <h2 className="text-xl font-semibold mb-4">个人工作台</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        {workloadCards.map(({ title, count, color }) => (
          <div key={title} className={`p-4 rounded-lg border ${workloadColors[color]}`}>
            <div className="text-2xl font-bold">{count}</div>
            <div className="text-sm">{title}</div>
          </div>
        ))}
      </div>

      {/* 个人统计报表 */}
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">个人统计</h2>
        <div className="flex gap-2 mb-4">
          <button onClick={() => setSummaryPeriod('day')} className={`px-3 py-1 rounded ${summaryPeriod === 'day' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>今日</button>
          <button onClick={() => setSummaryPeriod('week')} className={`px-3 py-1 rounded ${summaryPeriod === 'week' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>本周</button>
          <button onClick={() => setSummaryPeriod('month')} className={`px-3 py-1 rounded ${summaryPeriod === 'month' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}>本月</button>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-3xl font-bold mb-4">{mySummary.total_count}</div>
          <div className="space-y-2">
            {Object.entries(mySummary.by_status).map(([status, count]) => {
              const total = Object.values(mySummary.by_status).reduce((a, b) => a + b, 0)
              const percentage = total > 0 ? (count / total) * 100 : 0
              return (
                <div key={status} className="flex items-center gap-2">
                  <div className="w-20 text-sm capitalize">{status}</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                  <div className="w-8 text-sm text-right">{count}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

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

      {/* 用户工作量排行榜 */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="font-semibold mb-4">用户工作量排行</h3>
        {userWorkload.length === 0 ? (
          <p className="text-gray-500 text-sm">暂无数据</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">排名</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">用户名</th>
                  <th className="text-left py-2 px-3 text-gray-500 font-medium">姓名</th>
                  <th className="text-right py-2 px-3 text-gray-500 font-medium">标注数量</th>
                </tr>
              </thead>
              <tbody>
                {userWorkload
                  .sort((a, b) => b.count - a.count)
                  .map(({ user_id, username, full_name, count }, idx) => (
                    <tr key={user_id} className="border-b last:border-0">
                      <td className="py-2 px-3 text-gray-400">{idx + 1}</td>
                      <td className="py-2 px-3">{username}</td>
                      <td className="py-2 px-3">{full_name || '-'}</td>
                      <td className="py-2 px-3 text-right font-medium">{count}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

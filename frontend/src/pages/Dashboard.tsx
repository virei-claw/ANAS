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

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [userWorkload, setUserWorkload] = useState<UserWorkload[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    setLoading(true)
    try {
      const [statsResp, workloadResp] = await Promise.all([
        api.get('/stats/dashboard'),
        api.get('/stats/user-workload')
      ])
      setStats(statsResp.data)
      setUserWorkload(workloadResp.data)
    } catch {
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  if (loading || !stats) {
    return (
      <div style={{ padding: '32px', maxWidth: '1280px', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ height: '32px', background: '#E5E7EB', borderRadius: '8px', width: '200px' }}></div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: '120px', background: '#E5E7EB', borderRadius: '16px' }}></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const statCards = [
    { label: '总音频数', value: stats.total_audios, icon: AudioLines, gradient: 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)' },
    { label: '总标注数', value: stats.total_annotations, icon: FileText, gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' },
    { label: '今日标注', value: stats.today_annotations, icon: TrendingUp, gradient: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)' },
    { label: '待审核', value: stats.status_counts.submitted, icon: Clock, gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' },
  ]

  const statusLabels: Record<string, { label: string; color: string }> = {
    draft: { label: '草稿', color: '#6B7280' },
    submitted: { label: '审核中', color: '#F59E0B' },
    approved: { label: '已通过', color: '#10B981' },
    rejected: { label: '已拒绝', color: '#EF4444' },
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1280px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#111827',
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.02em',
          margin: 0
        }}>统计分析</h1>
        <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>查看整体标注数据统计概况</p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {statCards.map(({ label, value, icon: Icon, gradient }) => (
          <div
            key={label}
            style={{
              background: gradient,
              borderRadius: '16px',
              padding: '20px',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{
              position: 'absolute',
              top: '-30px',
              right: '-30px',
              width: '100px',
              height: '100px',
              background: 'rgba(255,255,255,0.15)',
              borderRadius: '50%'
            }} />
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', position: 'relative' }}>
              <div>
                <div style={{ fontSize: '32px', fontWeight: 700, fontFamily: 'var(--font-display)', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: '13px', marginTop: '8px', opacity: 0.9 }}>{label}</div>
              </div>
              <div style={{
                width: '44px',
                height: '44px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Icon size={22} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Status Distribution */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
          border: '1px solid #F3F4F6'
        }}>
          <h3 style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#374151',
            fontFamily: 'var(--font-display)',
            margin: '0 0 20px 0'
          }}>标注状态分布</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {Object.entries(stats.status_counts).map(([status, count]) => {
              const { label, color } = statusLabels[status] || { label: status, color: '#6B7280' }
              return (
                <div key={status} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />
                    <span style={{ fontSize: '14px', color: '#374151' }}>{label}</span>
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Noise Type Distribution */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
          border: '1px solid #F3F4F6'
        }}>
          <h3 style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#374151',
            fontFamily: 'var(--font-display)',
            margin: '0 0 20px 0'
          }}>异响类型分布</h3>
          {stats.noise_type_stats.length === 0 ? (
            <p style={{ fontSize: '14px', color: '#9CA3AF', textAlign: 'center', padding: '20px 0' }}>暂无数据</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {stats.noise_type_stats.slice(0, 5).map(({ name, count }) => (
                <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#374151' }}>{name}</span>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#111827' }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Parts Ranking */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        border: '1px solid #F3F4F6',
        marginBottom: '24px'
      }}>
        <h3 style={{
          fontSize: '15px',
          fontWeight: 600,
          color: '#374151',
          fontFamily: 'var(--font-display)',
          margin: '0 0 20px 0'
        }}>零部件问题排行 TOP 10</h3>
        {stats.part_stats.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#9CA3AF', textAlign: 'center', padding: '20px 0' }}>暂无数据</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {stats.part_stats.map(({ name, count }, idx) => {
              const maxCount = stats.part_stats[0]?.count || 1
              return (
                <div key={name} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: idx < 3 ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : '#F3F4F6',
                    color: idx < 3 ? 'white' : '#6B7280',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600
                  }}>
                    {idx + 1}
                  </div>
                  <span style={{ flex: 1, fontSize: '14px', color: '#374151' }}>{name}</span>
                  <div style={{ width: '120px', height: '6px', background: '#F3F4F6', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${(count / maxCount) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #2563EB 0%, #3B82F6 100%)',
                      borderRadius: '3px'
                    }} />
                  </div>
                  <span style={{ width: '32px', fontSize: '14px', fontWeight: 600, color: '#111827', textAlign: 'right' }}>{count}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* User Workload */}
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        border: '1px solid #F3F4F6'
      }}>
        <h3 style={{
          fontSize: '15px',
          fontWeight: 600,
          color: '#374151',
          fontFamily: 'var(--font-display)',
          margin: '0 0 20px 0'
        }}>用户工作量排行</h3>
        {userWorkload.length === 0 ? (
          <p style={{ fontSize: '14px', color: '#9CA3AF', textAlign: 'center', padding: '20px 0' }}>暂无数据</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>排名</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>用户名</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>姓名</th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>标注数量</th>
                </tr>
              </thead>
              <tbody>
                {userWorkload.sort((a, b) => b.count - a.count).map(({ user_id, username, full_name, count }, idx) => {
                  const isTop3 = idx < 3
                  return (
                    <tr key={user_id} style={{ transition: 'background 0.15s ease' }}>
                      <td style={{ padding: '16px', borderBottom: '1px solid #F3F4F6' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '28px',
                          height: '28px',
                          borderRadius: '8px',
                          background: isTop3 ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : '#F3F4F6',
                          color: isTop3 ? 'white' : '#6B7280',
                          fontWeight: 600,
                          fontSize: '13px',
                          boxShadow: isTop3 ? '0 2px 8px rgba(37,99,235,0.3)' : 'none'
                        }}>
                          {idx + 1}
                        </div>
                      </td>
                      <td style={{ padding: '16px', borderBottom: '1px solid #F3F4F6', fontSize: '14px', fontWeight: 500, color: '#374151' }}>{username}</td>
                      <td style={{ padding: '16px', borderBottom: '1px solid #F3F4F6', fontSize: '14px', color: '#6B7280' }}>{full_name || '-'}</td>
                      <td style={{ padding: '16px', borderBottom: '1px solid #F3F4F6', textAlign: 'right' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '4px 12px',
                          background: isTop3 ? 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)' : '#F3F4F6',
                          color: isTop3 ? '#1D4ED8' : '#6B7280',
                          borderRadius: '9999px',
                          fontWeight: 600,
                          fontSize: '14px'
                        }}>
                          {count}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

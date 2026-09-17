import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  road_type: string | null
  clip_filepath: string | null
  annotator_name: string | null
}

export default function ReviewQueue() {
  const [annotations, setAnnotations] = useState<PendingAnnotation[]>([])
  const [loading, setLoading] = useState(false)
  const [playingId, setPlayingId] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      const isAdmin = userData.roles?.some((r: { name: string }) => r.name === 'admin')
      if (!isAdmin) {
        navigate('/')
        toast.error('无权限访问')
      }
    } else {
      navigate('/login')
    }
  }, [navigate])

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
      await api.put(`/annotations/${id}/reject?reject_reason=${encodeURIComponent(reason)}`)
      toast.success('已打回')
      loadPending()
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || '操作失败')
    }
  }

  const handlePlayClip = async (ann: PendingAnnotation) => {
    if (playingId === ann.id) {
      setPlayingId(null)
      return
    }
    if (!ann.clip_filepath) {
      toast.error('无音频片段')
      return
    }
    setPlayingId(ann.id)
    // 使用 audio 标签播放
    const audio = new Audio(`/api/audio/clip/${encodeURIComponent(ann.clip_filepath)}`)
    audio.onended = () => setPlayingId(null)
    audio.onerror = () => {
      toast.error('音频播放失败')
      setPlayingId(null)
    }
    audio.play()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toFixed(2).padStart(5, '0')}`
  }

  return (
    <div style={{ padding: '32px', maxWidth: '1280px', margin: '0 auto', animation: 'fadeIn 0.5s ease-out' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{
          fontSize: '28px',
          fontWeight: 700,
          color: '#111827',
          fontFamily: 'var(--font-display)',
          letterSpacing: '-0.02em',
          margin: 0
        }}>待审核标注</h1>
        <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>审核并批准或驳回标注申请</p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF', background: 'white', borderRadius: '16px', boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)' }}>加载中...</div>
      ) : annotations.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '80px 0',
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
          border: '1px solid #F3F4F6'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
          <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>暂无待审核标注</h3>
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
          border: '1px solid #F3F4F6',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F9FAFB', borderBottom: '2px solid #E5E7EB' }}>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>音频</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>时间段</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>零部件</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>异响类型</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>标注人</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {annotations.map((ann) => (
                <tr key={ann.id} style={{ borderBottom: '1px solid #F3F4F6', transition: 'background 0.15s ease' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <Link to={`/audio/${ann.audio_id}`} style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#2563EB',
                        textDecoration: 'none'
                      }}
                        onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline' }}
                        onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none' }}>
                        {ann.audio_filename}
                      </Link>
                      {ann.clip_filepath && (
                        <button
                          onClick={() => handlePlayClip(ann)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 500,
                            background: playingId === ann.id ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)' : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                            width: 'fit-content'
                          }}
                        >
                          {playingId === ann.id ? '⏸ 停止' : '▶ 播放片段'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontFamily: 'var(--font-display)', fontSize: '14px', color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                    {formatTime(ann.start_time)} - {formatTime(ann.end_time)}
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{ann.part_name || '-'}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{ann.noise_type || '-'}</td>
                  <td style={{ padding: '16px', fontSize: '14px', color: '#6B7280' }}>{ann.annotator_name || '-'}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleApprove(ann.id)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          fontWeight: 500,
                          background: '#D1FAE5',
                          color: '#059669',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        通过
                      </button>
                      <button
                        onClick={() => handleReject(ann.id)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          fontWeight: 500,
                          background: '#FEE2E2',
                          color: '#DC2626',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer'
                        }}
                      >
                        驳回
                      </button>
                    </div>
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

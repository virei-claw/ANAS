import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { annotationApi, Annotation } from '@/lib/api'
import { formatTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import { FileAudio, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react'

type FilterStatus = 'all' | 'draft' | 'submitted' | 'approved' | 'rejected'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: '草稿', color: '#6B7280', bg: '#F3F4F6' },
  submitted: { label: '审核中', color: '#F59E0B', bg: '#FEF3C7' },
  approved: { label: '已通过', color: '#10B981', bg: '#D1FAE5' },
  rejected: { label: '已驳回', color: '#EF4444', bg: '#FEE2E2' },
}

export default function MyCenter() {
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<FilterStatus>('all')

  const filters: { key: FilterStatus; label: string; icon: typeof CheckCircle }[] = [
    { key: 'all', label: '全部', icon: FileAudio },
    { key: 'draft', label: '草稿', icon: AlertCircle },
    { key: 'submitted', label: '审核中', icon: Clock },
    { key: 'approved', label: '已通过', icon: CheckCircle },
    { key: 'rejected', label: '已驳回', icon: XCircle },
  ]

  const loadAnnotations = async () => {
    setLoading(true)
    try {
      const status = filter === 'all' ? undefined : filter
      const res = await annotationApi.myList(status)
      setAnnotations(res.data)
    } catch (err) {
      toast.error('加载标注列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnnotations()
  }, [filter])

  const handleResubmit = async (ann: Annotation) => {
    try {
      await annotationApi.submit(ann.id)
      toast.success('已重新提交审核')
      loadAnnotations()
    } catch (err) {
      toast.error('提交失败')
    }
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
        }}>我的标注</h1>
        <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>查看和管理您的标注任务</p>
      </div>

      {/* 状态筛选 */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        {filters.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: filter === key ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : 'white',
              color: filter === key ? 'white' : '#6B7280',
              boxShadow: filter === key ? '0 4px 12px rgba(37,99,235,0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
              border: filter === key ? 'none' : '1px solid #E5E7EB'
            }}
          >
            <Icon size={16} />
            {label}
            {key === 'rejected' && annotations.filter(a => a.status === 'rejected').length > 0 && (
              <span style={{
                background: '#EF4444',
                color: 'white',
                fontSize: '11px',
                fontWeight: 600,
                padding: '2px 6px',
                borderRadius: '9999px',
                marginLeft: '4px'
              }}>
                {annotations.filter(a => a.status === 'rejected').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 表格 */}
      {loading ? (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '80px',
          textAlign: 'center',
          color: '#9CA3AF',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
          border: '1px solid #F3F4F6'
        }}>加载中...</div>
      ) : annotations.length === 0 ? (
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '80px',
          textAlign: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
          border: '1px solid #F3F4F6'
        }}>
          <FileAudio size={48} color="#9CA3AF" style={{ marginBottom: '16px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#111827', margin: 0 }}>暂无标注</h3>
          <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '8px' }}>点击音频列表开始您的第一个标注</p>
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
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB' }}>音频文件</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB' }}>零部件</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB' }}>异响类型</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB' }}>时间段</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB' }}>状态</th>
                <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {annotations.map((ann) => {
                const status = statusConfig[ann.status] || statusConfig.draft
                return (
                  <tr key={ann.id} style={{ borderBottom: '1px solid #F3F4F6', transition: 'background 0.15s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <Link to={`/audio/${ann.audio_id}`} style={{
                        fontSize: '14px',
                        fontWeight: 500,
                        color: '#2563EB',
                        textDecoration: 'none'
                      }}>
                        {ann.audio_filename || ann.audio_id.substring(0, 8)}
                      </Link>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#374151' }}>{ann.part_name || '-'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: '#374151' }}>{ann.noise_type || '-'}</td>
                    <td style={{ padding: '14px 16px', fontFamily: 'var(--font-display)', fontSize: '13px', color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
                      {formatTime(ann.start_time)} - {formatTime(ann.end_time)}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: status.bg,
                        color: status.color,
                        borderRadius: '9999px'
                      }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link
                          to={`/audio/${ann.audio_id}`}
                          style={{
                            padding: '6px 12px',
                            fontSize: '13px',
                            fontWeight: 500,
                            background: '#EFF6FF',
                            color: '#2563EB',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            textDecoration: 'none'
                          }}
                        >
                          {ann.status === 'rejected' ? '重新标注' : '查看详情'}
                        </Link>
                        {ann.status === 'draft' && (
                          <button
                            onClick={() => handleResubmit(ann)}
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
                            提交审核
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

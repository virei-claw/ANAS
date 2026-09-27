import { useState, useEffect, useRef } from 'react'
import { FileText, FileJson, Archive, ChevronDown, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { dictApi, audioApi, Annotation } from '@/lib/api'
import api from '@/lib/api'
import { formatTime } from '@/lib/utils'

interface FilterParams {
  part_name?: string
  noise_type?: string
  road_type?: string
  status?: string
  annotator_name?: string
  start_date?: string
  end_date?: string
}

interface DictItem {
  id: string
  name: string
}

// 状态徽章组件
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    pending: { bg: 'var(--color-warning-soft)', color: 'var(--color-warning)' },
    approved: { bg: 'var(--color-success-soft)', color: 'var(--color-success)' },
    rejected: { bg: 'var(--color-error-soft)', color: 'var(--color-error)' },
    draft: { bg: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' },
  }
  const labels: Record<string, string> = {
    pending: '待审核',
    approved: '已通过',
    rejected: '已驳回',
    draft: '草稿',
  }
  const style = styles[status] || styles.draft
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '4px 10px',
      fontSize: '12px',
      fontWeight: 500,
      borderRadius: '9999px',
      background: style.bg,
      color: style.color,
    }}>
      {labels[status] || status}
    </span>
  )
}

// 分页组件
function Pagination({ current, total, pageSize, onPageChange }: { current: number; total: number; pageSize: number; onPageChange: (page: number) => void }) {
  const totalPages = Math.ceil(total / pageSize)
  const pages: (number | string)[] = []

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (current > 3) pages.push('...')
    for (let i = Math.max(2, current - 1); i <= Math.min(totalPages - 1, current + 1); i++) {
      pages.push(i)
    }
    if (current < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px' }}>
      <button
        onClick={() => onPageChange(current - 1)}
        disabled={current === 1}
        style={{
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-card)',
          cursor: current === 1 ? 'not-allowed' : 'pointer',
          opacity: current === 1 ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <ChevronLeft size={18} />
      </button>
      {pages.map((page, idx) =>
        typeof page === 'number' ? (
          <button
            key={idx}
            onClick={() => onPageChange(page)}
            style={{
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: current === page ? 'var(--color-accent)' : 'var(--color-border)',
              background: current === page ? 'var(--color-accent)' : 'var(--color-bg-card)',
              color: current === page ? 'white' : 'var(--color-text-primary)',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 500,
            }}
          >
            {page}
          </button>
        ) : (
          <span key={idx} style={{ padding: '0 8px', color: 'var(--color-text-tertiary)' }}>...</span>
        )
      )}
      <button
        onClick={() => onPageChange(current + 1)}
        disabled={current === totalPages}
        style={{
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-card)',
          cursor: current === totalPages ? 'not-allowed' : 'pointer',
          opacity: current === totalPages ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}

// 表头筛选下拉组件
function HeaderFilterDropdown({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: DictItem[]
  value: string
  onChange: (val: string) => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 8px',
          fontSize: '12px',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: value ? 'var(--color-accent)' : 'var(--color-text-secondary)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          borderRadius: 'var(--radius-sm)',
          transition: 'all var(--transition-fast)',
        }}
      >
        {label}
        {value && (
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--color-accent)',
          }} />
        )}
        <ChevronDown size={12} style={{ opacity: 0.6 }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: '4px',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
          zIndex: 100,
          minWidth: '160px',
          padding: '8px 0',
          animation: 'scaleIn 0.15s ease-out',
        }}>
          <div
            onClick={() => { onChange(''); setIsOpen(false); }}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: !value ? 'var(--color-accent-soft)' : 'transparent',
              color: !value ? 'var(--color-accent)' : 'var(--color-text-primary)',
            }}
          >
            <span>全部</span>
            {!value && <Check size={14} />}
          </div>
          {options.map((opt) => (
            <div
              key={opt.id}
              onClick={() => { onChange(opt.name); setIsOpen(false); }}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: value === opt.name ? 'var(--color-accent-soft)' : 'transparent',
                color: value === opt.name ? 'var(--color-accent)' : 'var(--color-text-primary)',
                transition: 'background var(--transition-fast)',
              }}
              onMouseEnter={(e) => { if (value !== opt.name) e.currentTarget.style.background = 'var(--color-bg-secondary)'; }}
              onMouseLeave={(e) => { if (value !== opt.name) e.currentTarget.style.background = 'transparent'; }}
            >
              <span>{opt.name}</span>
              {value === opt.name && <Check size={14} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Export() {
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [loading, setLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  // 字典数据
  const [partNames, setPartNames] = useState<DictItem[]>([])
  const [noiseTypes, setNoiseTypes] = useState<DictItem[]>([])
  const [roadTypes, setRoadTypes] = useState<DictItem[]>([])

  // 筛选条件
  const [filters, setFilters] = useState<FilterParams>({
    part_name: '',
    noise_type: '',
    road_type: '',
    status: '',
    annotator_name: '',
    start_date: '',
    end_date: '',
  })

  // 统计数据
  const [stats, setStats] = useState({
    total: 0,
    audioCount: 0,
    pending: 0,
    approved: 0,
  })

  // 加载字典数据
  useEffect(() => {
    Promise.all([
      dictApi.partNames.list(),
      dictApi.noiseTypes.list(),
      dictApi.roadTypes.list(),
      audioApi.list(1, 1000),
    ]).then(([partRes, noiseRes, roadRes, audioRes]) => {
      setPartNames(partRes.data)
      setNoiseTypes(noiseRes.data)
      setRoadTypes(roadRes.data)
      setStats(prev => ({ ...prev, audioCount: audioRes.data.total }))
    }).catch(() => {})
  }, [])

  // 加载标注数据
  const loadAnnotations = async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = {
        page: currentPage,
        page_size: pageSize,
        ...filters,
      }
      // 移除空值
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === undefined) {
          delete params[key]
        }
      })

      const res = await api.get<Annotation[]>('/annotations', { params })
      const annotationsData = res.data || []

      // 统计计算
      const allRes = await api.get<Annotation[]>('/annotations', { params: { page_size: 10000 } })
      const allAnnotations = allRes.data || []

      const uniqueAudios = new Set(allAnnotations.map(a => a.audio_id))
      const pendingCount = allAnnotations.filter(a => a.status === 'submitted').length
      const approvedCount = allAnnotations.filter(a => a.status === 'approved').length

      setStats({
        total: allAnnotations.length,
        audioCount: uniqueAudios.size,
        pending: pendingCount,
        approved: approvedCount,
      })

      setAnnotations(annotationsData)
      setTotal(annotationsData.length)
    } catch (error) {
      toast.error('加载标注数据失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAnnotations()
  }, [currentPage, filters])

  const handleFilterChange = (key: keyof FilterParams, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  // 导出功能
  const handleExportCSV = async () => {
    setLoading(true)
    try {
      const response = await api.get('/export/annotations/csv', {
        responseType: 'blob',
        params: filters,
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'annotations.csv')
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('导出成功')
    } catch (error: any) {
      toast.error('导出失败')
    } finally {
      setLoading(false)
    }
  }

  const handleExportJSON = async () => {
    setLoading(true)
    try {
      const response = await api.get('/export/annotations/json', { params: filters })
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'annotations.json')
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('导出成功')
    } catch (error: any) {
      toast.error('导出失败')
    } finally {
      setLoading(false)
    }
  }

  const handleExportZIP = async () => {
    setLoading(true)
    try {
      const response = await api.get('/export/annotations/zip', {
        responseType: 'blob',
        params: filters,
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'annotations_export.zip')
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success('导出成功')
    } catch (error: any) {
      toast.error('导出失败')
    } finally {
      setLoading(false)
    }
  }

  const columns = [
    { key: 'audio', label: '音频' },
    { key: 'time', label: '时间段' },
    { key: 'part_name', label: '零部件' },
    { key: 'noise_type', label: '异响类型' },
    { key: 'road_type', label: '路面类型' },
    { key: 'speed', label: '车速' },
    { key: 'temperature', label: '温度' },
    { key: 'test_mode', label: '测试模式' },
    { key: 'reason', label: '异响原因' },
    { key: 'solution', label: '解决方案' },
    { key: 'status', label: '状态' },
    { key: 'annotator', label: '标注人' },
    { key: 'created_at', label: '创建时间' },
    { key: 'actions', label: '操作' },
  ]

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '32px 24px', animation: 'fadeIn 0.4s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.02em',
            margin: 0,
          }}>标注总览</h1>
          <p style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            查看和管理所有标注数据
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleExportCSV}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'all var(--transition-fast)',
            }}
          >
            <FileText size={16} />
            导出 CSV
          </button>
          <button
            onClick={handleExportJSON}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'all var(--transition-fast)',
            }}
          >
            <FileJson size={16} />
            导出 JSON
          </button>
          <button
            onClick={handleExportZIP}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              background: 'var(--color-accent)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontSize: '14px',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              transition: 'all var(--transition-fast)',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
            }}
          >
            <Archive size={16} />
            导出 ZIP
          </button>
        </div>
      </div>

      {/* 统计数据栏 */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '16px',
        marginBottom: '24px',
      }}>
        <div style={{
          background: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: '0 1px 3px var(--color-shadow)',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>总数</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>{stats.total}</div>
        </div>
        <div style={{
          background: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: '0 1px 3px var(--color-shadow)',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>音频数</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>{stats.audioCount}</div>
        </div>
        <div style={{
          background: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: '0 1px 3px var(--color-shadow)',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>待审核</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-warning)', fontFamily: 'var(--font-display)' }}>{stats.pending}</div>
        </div>
        <div style={{
          background: 'var(--color-bg-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px 24px',
          border: '1px solid var(--color-border-subtle)',
          boxShadow: '0 1px 3px var(--color-shadow)',
        }}>
          <div style={{ fontSize: '12px', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>已通过</div>
          <div style={{ fontSize: '32px', fontWeight: 700, color: 'var(--color-success)', fontFamily: 'var(--font-display)' }}>{stats.approved}</div>
        </div>
      </div>

      {/* 表格 */}
      <div style={{
        background: 'var(--color-bg-card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 1px 3px var(--color-shadow), 0 1px 2px var(--color-shadow-md)',
        border: '1px solid var(--color-border-subtle)',
        overflow: 'hidden',
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '1280px' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-secondary)', borderBottom: '2px solid var(--color-border)' }}>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{
                      padding: '14px 16px',
                      fontSize: '11px',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: 'var(--color-text-secondary)',
                      borderBottom: '2px solid var(--color-border)',
                      textAlign: 'left',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col.key === 'part_name' ? (
                      <HeaderFilterDropdown
                        label={col.label}
                        options={partNames}
                        value={filters.part_name || ''}
                        onChange={(val) => handleFilterChange('part_name', val)}
                      />
                    ) : col.key === 'noise_type' ? (
                      <HeaderFilterDropdown
                        label={col.label}
                        options={noiseTypes}
                        value={filters.noise_type || ''}
                        onChange={(val) => handleFilterChange('noise_type', val)}
                      />
                    ) : col.key === 'road_type' ? (
                      <HeaderFilterDropdown
                        label={col.label}
                        options={roadTypes}
                        value={filters.road_type || ''}
                        onChange={(val) => handleFilterChange('road_type', val)}
                      />
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={14} style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    加载中...
                  </td>
                </tr>
              ) : annotations.length === 0 ? (
                <tr>
                  <td colSpan={14} style={{ padding: '80px', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                    暂无标注数据
                  </td>
                </tr>
              ) : (
                annotations.map((ann, idx) => (
                  <tr
                    key={ann.id}
                    style={{
                      borderBottom: '1px solid var(--color-border-subtle)',
                      transition: 'background var(--transition-fast)',
                      animation: `fadeIn 0.3s ease-out ${idx * 30}ms both`,
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-secondary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <td style={{ padding: '14px 16px', fontSize: '14px', color: 'var(--color-accent)' }}>
                      {ann.audio_filename || ann.audio_id}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', fontFamily: 'var(--font-display)', fontVariantNumeric: 'tabular-nums' }}>
                      {formatTime(ann.start_time)} - {formatTime(ann.end_time)}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>{ann.part_name || '-'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>{ann.noise_type || '-'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>{ann.road_type || '-'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>{ann.speed !== null ? `${ann.speed} km/h` : '-'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>{ann.temperature !== null ? `${ann.temperature}°C` : '-'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>{ann.test_mode || '-'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ann.reason || ''}>
                      {ann.reason || '-'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={ann.solution || ''}>
                      {ann.solution || '-'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>
                      <StatusBadge status={ann.status} />
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>{ann.annotator_name || '-'}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                      {new Date(ann.created_at).toLocaleString()}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>
                      <button
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          color: 'var(--color-accent)',
                          background: 'var(--color-accent-soft)',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                        }}
                        onClick={() => {}}
                      >
                        查看
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分页 */}
      {!loading && annotations.length > 0 && (
        <Pagination current={currentPage} total={total} pageSize={pageSize} onPageChange={setCurrentPage} />
      )}
    </div>
  )
}

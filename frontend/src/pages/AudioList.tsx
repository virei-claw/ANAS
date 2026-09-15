import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { audioApi, AudioFile } from '@/lib/api'
import { formatDuration, formatFileSize } from '@/lib/utils'
import { AudioTableSkeleton } from '@/components/Skeleton'
import { Upload, Search, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

// 筛选状态
type FilterStatus = 'all' | 'annotated' | 'unannotated' | 'reviewing'

// 分页组件
function Pagination({ current, total, pageSize, onPageChange }: { current: number; total: number; pageSize: number; onPageChange: (page: number) => void }) {
  const totalPages = Math.ceil(total / pageSize)
  const pages: (number | string)[] = []

  // 构建页码数组，显示首尾和相邻页
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
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(current - 1)}
        disabled={current === 1}
        className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronLeft size={20} />
      </button>
      {pages.map((page, idx) =>
        typeof page === 'number' ? (
          <button
            key={idx}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 rounded-lg border ${
              current === page ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-gray-50'
            }`}
          >
            {page}
          </button>
        ) : (
          <span key={idx} className="px-2">...</span>
        )
      )}
      <button
        onClick={() => onPageChange(current + 1)}
        disabled={current === totalPages}
        className="p-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}

export default function AudioList() {
  const [audios, setAudios] = useState<AudioFile[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 10

  // 筛选标签
  const filters: { key: FilterStatus; label: string; icon: typeof CheckCircle }[] = [
    { key: 'all', label: '全部', icon: Clock },
    { key: 'annotated', label: '已标注', icon: CheckCircle },
    { key: 'unannotated', label: '未标注', icon: XCircle },
    { key: 'reviewing', label: '审核中', icon: Clock },
  ]

  const loadAudios = async () => {
    setLoading(true)
    try {
      const res = await audioApi.list(currentPage, pageSize, search || undefined)
      setAudios(res.data.items)
      setTotal(res.data.total)
    } catch (error) {
      toast.error('加载音频列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAudios()
  }, [search, currentPage, filter])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setUploadProgress(0)
    try {
      await audioApi.upload(file, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(percent)
        },
      })
      toast.success('音频上传成功')
      setUploadProgress(null)
      await loadAudios()
    } catch (error: any) {
      toast.error(error?.message || '上传失败')
      setUploadProgress(null)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除吗？')) return
    try {
      await audioApi.delete(id)
      toast.success('删除成功')
      loadAudios()
    } catch (error: any) {
      toast.error(error?.message || '删除失败')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">音频文件</h1>
        <div className="flex gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索文件名..."
              className="pl-10 pr-4 py-2 border rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700 flex items-center gap-2">
            {uploading ? '上传中...' : <><Upload size={20} /> 上传音频</>}
            <input type="file" accept=".wav,.mp3,.flac,.ogg" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      {/* 上传进度条 */}
      {uploadProgress !== null && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>上传中...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* 筛选标签 */}
      <div className="flex gap-2 mb-6">
        {filters.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              filter === key
                ? 'bg-indigo-600 text-white'
                : 'bg-white border hover:bg-gray-50'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {/* 表格 */}
      {loading ? (
        <AudioTableSkeleton />
      ) : audios.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">暂无音频文件</h3>
          <p className="text-gray-500 mt-1">点击上方按钮上传第一个音频</p>
        </div>
      ) : (
        <>
          <table className="w-full bg-white rounded-lg shadow">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left px-4 py-3 font-medium text-gray-600">文件名</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">时长</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">大小</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">上传时间</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {audios.map((audio) => (
                <tr key={audio.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/audio/${audio.id}`} className="text-indigo-600 hover:underline">
                      {audio.filename}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{formatDuration(audio.duration)}</td>
                  <td className="px-4 py-3">{formatFileSize(audio.file_size)}</td>
                  <td className="px-4 py-3">{new Date(audio.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Link to={`/audio/${audio.id}`} className="text-indigo-600 hover:underline mr-4">查看</Link>
                    <button onClick={() => handleDelete(audio.id)} className="text-red-600 hover:underline">删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination current={currentPage} total={total} pageSize={pageSize} onPageChange={setCurrentPage} />
        </>
      )}
    </div>
  )
}

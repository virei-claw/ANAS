import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { audioApi, AudioFile } from '@/lib/api'
import { formatDuration, formatFileSize } from '@/lib/utils'

export default function AudioList() {
  const [audios, setAudios] = useState<AudioFile[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [uploading, setUploading] = useState(false)

  const loadAudios = async () => {
    setLoading(true)
    try {
      const res = await audioApi.list(1, 100, search || undefined)
      setAudios(res.data.items)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAudios()
  }, [search])

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      await audioApi.upload(file)
      await loadAudios()
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除吗？')) return
    await audioApi.delete(id)
    loadAudios()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">音频文件</h1>
        <div className="flex gap-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索文件名..."
            className="px-3 py-2 border rounded-lg w-64"
          />
          <label className="px-4 py-2 bg-indigo-600 text-white rounded-lg cursor-pointer hover:bg-indigo-700">
            {uploading ? '上传中...' : '上传音频'}
            <input type="file" accept=".wav,.mp3,.flac,.ogg" onChange={handleUpload} className="hidden" disabled={uploading} />
          </label>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : audios.length === 0 ? (
        <div className="text-center py-8 text-gray-500">暂无音频文件</div>
      ) : (
        <table className="w-full bg-white rounded-lg shadow">
          <thead>
            <tr className="border-b">
              <th className="text-left px-4 py-3">文件名</th>
              <th className="text-left px-4 py-3">时长</th>
              <th className="text-left px-4 py-3">大小</th>
              <th className="text-left px-4 py-3">上传时间</th>
              <th className="text-left px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {audios.map((audio) => (
              <tr key={audio.id} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{audio.filename}</td>
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
      )}
    </div>
  )
}

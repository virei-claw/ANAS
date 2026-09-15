import { useState } from 'react'
import { Download, FileText, FileJson } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'

export default function Export() {
  const [loading, setLoading] = useState(false)

  const handleExportCSV = async () => {
    setLoading(true)
    try {
      const response = await api.get('/export/annotations/csv', {
        responseType: 'blob',
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
      const response = await api.get('/export/annotations/json')
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">数据导出</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">标注数据</h2>
        <p className="text-gray-600 mb-6">
          导出现有系统中所有音频标注数据，支持 CSV 和 JSON 格式。
        </p>

        <div className="flex gap-4">
          <button
            onClick={handleExportCSV}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <FileText size={20} />
            导出 CSV
          </button>

          <button
            onClick={handleExportJSON}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            <FileJson size={20} />
            导出 JSON
          </button>
        </div>
      </div>
    </div>
  )
}

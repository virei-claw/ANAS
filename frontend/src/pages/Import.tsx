import { useState, useRef } from 'react'
import { Upload, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { annotationApi, ImportResult } from '@/lib/api'

export default function Import() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        setError('只支持 CSV 格式文件')
        return
      }
      setFile(selectedFile)
      setResult(null)
      setError(null)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files?.[0]
    if (droppedFile) {
      if (!droppedFile.name.endsWith('.csv')) {
        setError('只支持 CSV 格式文件')
        return
      }
      setFile(droppedFile)
      setResult(null)
      setError(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleImport = async () => {
    if (!file) return

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await annotationApi.import(file)
      setResult(response.data)
    } catch (err: any) {
      setError(err.response?.data?.detail || '导入失败')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">标注批量导入</h1>

      {/* 上传区域 */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center mb-6 ${
          file ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          {file ? (
            <div className="flex items-center justify-center gap-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <span className="text-indigo-600 font-medium">{file.name}</span>
              <span className="text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-2">点击上传或拖拽 CSV 文件到此处</p>
              <p className="text-sm text-gray-400">支持 .csv 格式</p>
            </>
          )}
        </label>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={handleImport}
          disabled={!file || loading}
          className={`px-6 py-2 rounded-lg font-medium ${
            !file || loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {loading ? '导入中...' : '开始导入'}
        </button>
        {file && (
          <button
            onClick={handleReset}
            disabled={loading}
            className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            重置
          </button>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="flex items-center gap-2 p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* 导入结果 */}
      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">导入结果</h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{result.total}</div>
              <div className="text-sm text-gray-500">总行数</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
                <CheckCircle className="h-5 w-5" />
                {result.success}
              </div>
              <div className="text-sm text-gray-500">成功</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600 flex items-center justify-center gap-1">
                <XCircle className="h-5 w-5" />
                {result.failed}
              </div>
              <div className="text-sm text-gray-500">失败</div>
            </div>
          </div>

          {/* 错误详情 */}
          {result.errors.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-700 mb-2">错误详情</h3>
              <div className="max-h-60 overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">行号</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600">错误信息</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {result.errors.map((err, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-gray-500">{err.row}</td>
                        <td className="px-4 py-2 text-red-600">{err.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* CSV 格式说明 */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">CSV 格式说明</h3>
            <p className="text-sm text-blue-700 mb-2">
              必填字段: <code className="bg-blue-100 px-1 rounded">audio_id</code>,{' '}
              <code className="bg-blue-100 px-1 rounded">start_time</code>,{' '}
              <code className="bg-blue-100 px-1 rounded">end_time</code>
            </p>
            <p className="text-sm text-blue-700">
              可选字段: <code className="bg-blue-100 px-1 rounded">part_name</code>,{' '}
              <code className="bg-blue-100 px-1 rounded">noise_type</code>,{' '}
              <code className="bg-blue-100 px-1 rounded">road_type</code>,{' '}
              <code className="bg-blue-100 px-1 rounded">speed</code>,{' '}
              <code className="bg-blue-100 px-1 rounded">temperature</code>,{' '}
              <code className="bg-blue-100 px-1 rounded">test_mode</code>,{' '}
              <code className="bg-blue-100 px-1 rounded">reason</code>,{' '}
              <code className="bg-blue-100 px-1 rounded">solution</code>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

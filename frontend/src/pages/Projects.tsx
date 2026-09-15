import { useEffect, useState } from 'react'
import { Plus, Folder, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'

interface Project {
  id: string
  name: string
  description?: string
  created_at: string
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const loadProjects = async () => {
    setLoading(true)
    try {
      const resp = await api.get('/projects')
      setProjects(resp.data)
    } catch (error: any) {
      toast.error('加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadProjects() }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    try {
      await api.post('/projects', { name: newName, description: newDesc })
      toast.success('创建成功')
      setShowForm(false)
      setNewName('')
      setNewDesc('')
      loadProjects()
    } catch (error: any) {
      toast.error('创建失败')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除?')) return
    try {
      await api.delete(`/projects/${id}`)
      toast.success('删除成功')
      loadProjects()
    } catch (error: any) {
      toast.error('删除失败')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">项目管理</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          <Plus size={18} />
          新建项目
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">新建项目</h3>
          <div className="space-y-4">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="项目名称"
              className="w-full px-4 py-2 border rounded-lg"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="项目描述（选填）"
              className="w-full px-4 py-2 border rounded-lg h-20"
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 rounded-lg">取消</button>
              <button onClick={handleCreate} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">创建</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">加载中...</div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <Folder size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">暂无项目，点击新建开始</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <h3 className="font-semibold text-lg">{project.name}</h3>
                <button onClick={() => handleDelete(project.id)} className="text-gray-400 hover:text-red-600">
                  <Trash2 size={18} />
                </button>
              </div>
              <p className="text-gray-500 text-sm mt-2">{project.description || '无描述'}</p>
              <p className="text-gray-400 text-xs mt-4">
                创建于 {new Date(project.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

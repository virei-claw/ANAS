import { useEffect, useState } from 'react'
import { dictApi, userApi, DictItem, User, Role } from '@/lib/api'

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'dict' | 'users'>('dict')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      const admin = userData.roles?.some((r: { name: string }) => r.name === 'admin')
      setIsAdmin(admin)
    }
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">设置</h1>

      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('dict')}
          className={`px-4 py-2 ${activeTab === 'dict' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
        >
          字典管理
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 ${activeTab === 'users' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-gray-500'}`}
          >
            用户管理
          </button>
        )}
      </div>

      {activeTab === 'dict' && <DictManagement />}
      {activeTab === 'users' && isAdmin && <UserManagement />}
    </div>
  )
}

function DictManagement() {
  const [partNames, setPartNames] = useState<DictItem[]>([])
  const [noiseTypes, setNoiseTypes] = useState<DictItem[]>([])
  const [roadTypes, setRoadTypes] = useState<DictItem[]>([])
  const [newPart, setNewPart] = useState('')
  const [newNoise, setNewNoise] = useState('')
  const [newRoad, setNewRoad] = useState('')

  const loadAll = async () => {
    const [p, n, r] = await Promise.all([
      dictApi.partNames.list(),
      dictApi.noiseTypes.list(),
      dictApi.roadTypes.list(),
    ])
    setPartNames(p.data)
    setNoiseTypes(n.data)
    setRoadTypes(r.data)
  }

  useEffect(() => { loadAll() }, [])

  const handleAddPart = async () => {
    if (!newPart.trim()) return
    await dictApi.partNames.create(newPart)
    setNewPart('')
    loadAll()
  }

  const handleAddNoise = async () => {
    if (!newNoise.trim()) return
    await dictApi.noiseTypes.create(newNoise)
    setNewNoise('')
    loadAll()
  }

  const handleAddRoad = async () => {
    if (!newRoad.trim()) return
    await dictApi.roadTypes.create(newRoad)
    setNewRoad('')
    loadAll()
  }

  const handleDeletePart = async (itemId: string) => {
    if (!confirm('确定删除?')) return
    await dictApi.partNames.delete(itemId)
    loadAll()
  }

  const handleDeleteNoise = async (itemId: string) => {
    if (!confirm('确定删除?')) return
    await dictApi.noiseTypes.delete(itemId)
    loadAll()
  }

  const handleDeleteRoad = async (itemId: string) => {
    if (!confirm('确定删除?')) return
    await dictApi.roadTypes.delete(itemId)
    loadAll()
  }

  return (
    <div className="grid grid-cols-3 gap-6">
      {/* 零部件名称 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">零部件名称</h2>
        <div className="flex gap-2 mb-4">
          <input
            value={newPart}
            onChange={(e) => setNewPart(e.target.value)}
            placeholder="输入名称"
            className="flex-1 border rounded px-2 py-1"
          />
          <button onClick={handleAddPart} className="px-3 py-1 bg-indigo-600 text-white rounded">添加</button>
        </div>
        <ul className="space-y-2">
          {partNames.map((p) => (
            <li key={p.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>{p.name}</span>
              <button onClick={() => handleDeletePart(p.id)} className="text-red-600 text-sm hover:underline">删除</button>
            </li>
          ))}
        </ul>
      </div>

      {/* 异响类型 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">异响类型</h2>
        <div className="flex gap-2 mb-4">
          <input
            value={newNoise}
            onChange={(e) => setNewNoise(e.target.value)}
            placeholder="输入类型"
            className="flex-1 border rounded px-2 py-1"
          />
          <button onClick={handleAddNoise} className="px-3 py-1 bg-indigo-600 text-white rounded">添加</button>
        </div>
        <ul className="space-y-2">
          {noiseTypes.map((n) => (
            <li key={n.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>{n.name}</span>
              <button onClick={() => handleDeleteNoise(n.id)} className="text-red-600 text-sm hover:underline">删除</button>
            </li>
          ))}
        </ul>
      </div>

      {/* 路面类型 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">路面类型</h2>
        <div className="flex gap-2 mb-4">
          <input
            value={newRoad}
            onChange={(e) => setNewRoad(e.target.value)}
            placeholder="输入类型"
            className="flex-1 border rounded px-2 py-1"
          />
          <button onClick={handleAddRoad} className="px-3 py-1 bg-indigo-600 text-white rounded">添加</button>
        </div>
        <ul className="space-y-2">
          {roadTypes.map((r) => (
            <li key={r.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>{r.name}</span>
              <button onClick={() => handleDeleteRoad(r.id)} className="text-red-600 text-sm hover:underline">删除</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  const loadUsers = async () => {
    try {
      const resp = await userApi.list(page, 20, search || undefined)
      setUsers(resp.data.items)
      setTotal(resp.data.total)
    } catch (err) {
      alert('加载用户失败')
    }
  }

  const loadRoles = async () => {
    try {
      const resp = await userApi.listRoles()
      setRoles(resp.data)
    } catch (err) {
      console.error('Failed to load roles:', err)
    }
  }

  useEffect(() => { loadUsers() }, [page, search])
  useEffect(() => { loadRoles() }, [])

  const handleDelete = async (userId: string) => {
    if (!confirm('确定删除该用户?')) return
    try {
      await userApi.delete(userId)
      loadUsers()
    } catch (err: any) {
      alert(err.response?.data?.detail || '删除失败')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">用户列表</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="搜索用户..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="border rounded px-3 py-1"
          />
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3 py-1 bg-indigo-600 text-white rounded"
          >
            创建用户
          </button>
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-2">用户名</th>
            <th className="text-left py-2 px-2">邮箱</th>
            <th className="text-left py-2 px-2">姓名</th>
            <th className="text-left py-2 px-2">角色</th>
            <th className="text-left py-2 px-2">状态</th>
            <th className="text-left py-2 px-2">操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b hover:bg-gray-50">
              <td className="py-2 px-2">{user.username}</td>
              <td className="py-2 px-2">{user.email}</td>
              <td className="py-2 px-2">{user.full_name || '-'}</td>
              <td className="py-2 px-2">
                <div className="flex flex-wrap gap-1">
                  {user.roles?.map((r) => (
                    <span key={r.id} className="text-xs bg-gray-200 rounded px-1">{r.name}</span>
                  ))}
                </div>
              </td>
              <td className="py-2 px-2">
                <span className={`text-xs ${user.is_active !== false ? 'text-green-600' : 'text-red-600'}`}>
                  {user.is_active !== false ? '启用' : '禁用'}
                </span>
              </td>
              <td className="py-2 px-2">
                <button
                  onClick={() => setEditingUser(user)}
                  className="text-indigo-600 text-sm hover:underline mr-2"
                >
                  编辑
                </button>
                <button
                  onClick={() => handleDelete(user.id)}
                  className="text-red-600 text-sm hover:underline"
                >
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <span className="text-sm text-gray-500">共 {total} 条</span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            上一页
          </button>
          <span className="px-3 py-1">第 {page} 页</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={users.length < 20}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            下一页
          </button>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <CreateUserModal
          roles={roles}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); loadUsers() }}
        />
      )}

      {/* Edit Modal */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          roles={roles}
          onClose={() => setEditingUser(null)}
          onSuccess={() => { setEditingUser(null); loadUsers() }}
        />
      )}
    </div>
  )
}

function CreateUserModal({ roles, onClose, onSuccess }: { roles: Role[]; onClose: () => void; onSuccess: () => void }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['annotator'])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!username || !email || !password) {
      alert('请填写必填项')
      return
    }
    setLoading(true)
    try {
      await userApi.create({ username, email, password, full_name: fullName || undefined })
      onSuccess()
    } catch (err: any) {
      alert(err.response?.data?.detail || '创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">创建用户</h3>
        <div className="space-y-3">
          <input
            placeholder="用户名 *"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border rounded px-3 py-1"
          />
          <input
            placeholder="邮箱 *"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-1"
          />
          <input
            placeholder="密码 *"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border rounded px-3 py-1"
          />
          <input
            placeholder="姓名"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border rounded px-3 py-1"
          />
          <div>
            <label className="text-sm text-gray-600">分配角色</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {roles.map((role) => (
                <label key={role.id} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRoles([...selectedRoles, role.name])
                      } else {
                        setSelectedRoles(selectedRoles.filter(r => r !== role.name))
                      }
                    }}
                  />
                  {role.name}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1 border rounded">取消</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-3 py-1 bg-indigo-600 text-white rounded disabled:opacity-50"
          >
            {loading ? '创建中...' : '创建'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditUserModal({ user, roles, onClose, onSuccess }: { user: User; roles: Role[]; onClose: () => void; onSuccess: () => void }) {
  const [email, setEmail] = useState(user.email)
  const [fullName, setFullName] = useState(user.full_name || '')
  const [isActive, setIsActive] = useState(user.is_active !== false)
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles?.map(r => r.name) || [])
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await userApi.update(user.id, {
        email,
        full_name: fullName || undefined,
        is_active: isActive
      })
      await userApi.assignRoles(user.id, selectedRoles)
      onSuccess()
    } catch (err: any) {
      alert(err.response?.data?.detail || '更新失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96">
        <h3 className="text-lg font-semibold mb-4">编辑用户: {user.username}</h3>
        <div className="space-y-3">
          <input
            placeholder="邮箱"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border rounded px-3 py-1"
          />
          <input
            placeholder="姓名"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full border rounded px-3 py-1"
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            启用用户
          </label>
          <div>
            <label className="text-sm text-gray-600">分配角色</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {roles.map((role) => (
                <label key={role.id} className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role.name)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRoles([...selectedRoles, role.name])
                      } else {
                        setSelectedRoles(selectedRoles.filter(r => r !== role.name))
                      }
                    }}
                  />
                  {role.name}
                </label>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-3 py-1 border rounded">取消</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-3 py-1 bg-indigo-600 text-white rounded disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}

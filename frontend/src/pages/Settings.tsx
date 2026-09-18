import { useEffect, useState } from 'react'
import { dictApi, userApi, DictItem, User, DictType, DictTypeItem } from '@/lib/api'
import { Plus, Users, BookOpen, X } from 'lucide-react'

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
        }}>设置</h1>
        <p style={{ fontSize: '14px', color: '#6B7280', marginTop: '4px' }}>管理系统字典和用户配置</p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '28px',
        borderBottom: '1px solid #E5E7EB',
        paddingBottom: '0'
      }}>
        <button
          onClick={() => setActiveTab('dict')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 20px',
            border: 'none',
            background: 'transparent',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            color: activeTab === 'dict' ? '#2563EB' : '#6B7280',
            borderBottom: activeTab === 'dict' ? '2px solid #2563EB' : '2px solid transparent',
            marginBottom: '-1px',
            transition: 'all 0.2s ease'
          }}
        >
          <BookOpen size={18} />
          字典管理
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              color: activeTab === 'users' ? '#2563EB' : '#6B7280',
              borderBottom: activeTab === 'users' ? '2px solid #2563EB' : '2px solid transparent',
              marginBottom: '-1px',
              transition: 'all 0.2s ease'
            }}
          >
            <Users size={18} />
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
  const [customTypes, setCustomTypes] = useState<DictType[]>([])
  const [customTypeItems, setCustomTypeItems] = useState<Record<string, DictTypeItem[]>>({})
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newTypeName, setNewTypeName] = useState('')
  const [newTypeCode, setNewTypeCode] = useState('')
  const [newItemValues, setNewItemValues] = useState<Record<string, string>>({})

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

  const loadCustomTypes = async () => {
    const resp = await dictApi.types.list()
    setCustomTypes(resp.data)
    // load items for each type
    const itemsMap: Record<string, DictTypeItem[]> = {}
    await Promise.all(
      resp.data.map(async (type) => {
        const itemsResp = await dictApi.types.items.list(type.id)
        itemsMap[type.id] = itemsResp.data
      })
    )
    setCustomTypeItems(itemsMap)
  }

  useEffect(() => { loadAll(); loadCustomTypes(); }, [])

  const handleCreateType = async () => {
    if (!newTypeName.trim() || !newTypeCode.trim()) return
    await dictApi.types.create({ type_name: newTypeName.trim(), type_code: newTypeCode.trim() })
    setNewTypeName('')
    setNewTypeCode('')
    setShowCreateDialog(false)
    loadCustomTypes()
  }

  const handleDeleteType = async (typeId: string) => {
    if (!confirm('确定删除该字典类型？')) return
    await dictApi.types.delete(typeId)
    loadCustomTypes()
  }

  const handleAddTypeItem = async (typeId: string) => {
    const name = newItemValues[typeId] || ''
    if (!name.trim()) return
    await dictApi.types.items.create(typeId, name.trim())
    setNewItemValues(prev => ({ ...prev, [typeId]: '' }))
    const itemsResp = await dictApi.types.items.list(typeId)
    setCustomTypeItems(prev => ({ ...prev, [typeId]: itemsResp.data }))
  }

  const handleDeleteTypeItem = async (typeId: string, itemId: string) => {
    if (!confirm('确定删除该条目？')) return
    await dictApi.types.items.delete(typeId, itemId)
    const itemsResp = await dictApi.types.items.list(typeId)
    setCustomTypeItems(prev => ({ ...prev, [typeId]: itemsResp.data }))
  }

  const isAdmin = (() => {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      const userData = JSON.parse(userStr)
      return userData.roles?.some((r: { name: string }) => r.name === 'admin')
    }
    return false
  })()

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
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {/* 零部件名称 */}
        <DictTable
          title="零部件名称"
          items={partNames}
          newValue={newPart}
          onChange={setNewPart}
          onAdd={handleAddPart}
          onDelete={handleDeletePart}
        />

        {/* 异响类型 */}
        <DictTable
          title="异响类型"
          items={noiseTypes}
          newValue={newNoise}
          onChange={setNewNoise}
          onAdd={handleAddNoise}
          onDelete={handleDeleteNoise}
        />

        {/* 路面类型 */}
        <DictTable
          title="路面类型"
          items={roadTypes}
          newValue={newRoad}
          onChange={setNewRoad}
          onAdd={handleAddRoad}
          onDelete={handleDeleteRoad}
        />
      </div>

      {/* Custom types section */}
      <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #E5E7EB' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#111827',
            fontFamily: 'var(--font-display)',
            margin: 0
          }}>自定义字典类型</h2>
          {isAdmin && (
            <button
              onClick={() => setShowCreateDialog(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 500,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(37,99,235,0.3)'
              }}
            >
              <Plus size={16} />
              新增字典类型
            </button>
          )}
        </div>

        {customTypes.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '32px',
            color: '#9CA3AF',
            fontSize: '14px',
            background: '#F9FAFB',
            borderRadius: '12px',
            border: '1px dashed #E5E7EB'
          }}>
            暂无自定义字典类型
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {customTypes.map(type => (
              <DictTypeTable
                key={type.id}
                type={type}
                items={customTypeItems[type.id] || []}
                newValue={newItemValues[type.id] || ''}
                onChange={(val) => setNewItemValues(prev => ({ ...prev, [type.id]: val }))}
                onAdd={() => handleAddTypeItem(type.id)}
                onDeleteItem={(itemId) => handleDeleteTypeItem(type.id, itemId)}
                onDeleteType={isAdmin ? () => handleDeleteType(type.id) : undefined}
                isAdmin={isAdmin}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create type dialog */}
      {showCreateDialog && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowCreateDialog(false) }}
        >
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '24px',
            width: '420px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#111827', margin: 0 }}>新增字典类型</h3>
              <button onClick={() => setShowCreateDialog(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#6B7280' }}>
                <X size={20} />
              </button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>类型名称</label>
              <input
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateType()}
                placeholder="例如：测试场景"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '6px' }}>类型代码</label>
              <input
                value={newTypeCode}
                onChange={(e) => setNewTypeCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateType()}
                placeholder="例如：test_scenario"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  fontSize: '14px',
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCreateDialog(false)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  background: '#F3F4F6',
                  color: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                取消
              </button>
              <button
                onClick={handleCreateType}
                disabled={!newTypeName.trim() || !newTypeCode.trim()}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: 500,
                  background: (!newTypeName.trim() || !newTypeCode.trim()) ? '#E5E7EB' : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (!newTypeName.trim() || !newTypeCode.trim()) ? 'not-allowed' : 'pointer',
                  boxShadow: (!newTypeName.trim() || !newTypeCode.trim()) ? 'none' : '0 2px 8px rgba(37,99,235,0.3)'
                }}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface DictTableProps {
  title: string
  items: DictItem[]
  newValue: string
  onChange: (value: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
}

function DictTable({ title, items, newValue, onChange, onAdd, onDelete }: DictTableProps) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
      border: '1px solid #F3F4F6'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h2 style={{
          fontSize: '14px',
          fontWeight: 600,
          color: '#111827',
          fontFamily: 'var(--font-display)',
          margin: 0
        }}>{title}</h2>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            value={newValue}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onAdd()}
            placeholder="输入名称"
            style={{
              padding: '6px 10px',
              fontSize: '13px',
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              outline: 'none',
              width: '120px'
            }}
            onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
            onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
          />
          <button
            onClick={onAdd}
            disabled={!newValue.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 12px',
              background: newValue.trim() ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : '#E5E7EB',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: newValue.trim() ? 'pointer' : 'not-allowed',
              boxShadow: newValue.trim() ? '0 2px 6px rgba(37,99,235,0.3)' : 'none'
            }}
          >
            <Plus size={14} />
            添加
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto', maxHeight: '240px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>序号</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>名称</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '24px 12px', color: '#9CA3AF', fontSize: '13px' }}>
                  暂无数据
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.id} style={{ transition: 'background 0.15s ease', borderBottom: '1px solid #F3F4F6' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                  <td style={{ padding: '10px 12px', fontSize: '13px', color: '#6B7280' }}>{idx + 1}</td>
                  <td style={{ padding: '10px 12px', fontSize: '13px', color: '#374151', fontWeight: 500 }}>{item.name}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <button
                      onClick={() => onDelete(item.id)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: '#FEF2F2',
                        color: '#DC2626',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface DictTypeTableProps {
  type: DictType
  items: DictTypeItem[]
  newValue: string
  onChange: (value: string) => void
  onAdd: () => void
  onDeleteItem: (id: string) => void
  onDeleteType?: () => void
  isAdmin: boolean
}

function DictTypeTable({ type, items, newValue, onChange, onAdd, onDeleteItem, onDeleteType, isAdmin }: DictTypeTableProps) {
  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
      border: '1px solid #F3F4F6'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div>
          <h2 style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#111827',
            fontFamily: 'var(--font-display)',
            margin: 0
          }}>{type.type_name}</h2>
          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{type.type_code}</span>
        </div>
        {isAdmin && onDeleteType && (
          <button
            onClick={onDeleteType}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              fontWeight: 500,
              background: '#FEF2F2',
              color: '#DC2626',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            删除类型
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
        <input
          value={newValue}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onAdd()}
          placeholder="输入名称"
          style={{
            padding: '6px 10px',
            fontSize: '13px',
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '6px',
            outline: 'none',
            flex: 1
          }}
          onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
          onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
        />
        <button
          onClick={onAdd}
          disabled={!newValue.trim()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 12px',
            background: newValue.trim() ? 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)' : '#E5E7EB',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            cursor: newValue.trim() ? 'pointer' : 'not-allowed',
            boxShadow: newValue.trim() ? '0 2px 6px rgba(37,99,235,0.3)' : 'none'
          }}
        >
          <Plus size={14} />
          添加
        </button>
      </div>

      <div style={{ overflowX: 'auto', maxHeight: '200px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>序号</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>名称</th>
              <th style={{ textAlign: 'left', padding: '8px 12px', fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '24px 12px', color: '#9CA3AF', fontSize: '13px' }}>
                  暂无数据
                </td>
              </tr>
            ) : (
              items.map((item, idx) => (
                <tr key={item.id} style={{ transition: 'background 0.15s ease', borderBottom: '1px solid #F3F4F6' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                  <td style={{ padding: '10px 12px', fontSize: '13px', color: '#6B7280' }}>{idx + 1}</td>
                  <td style={{ padding: '10px 12px', fontSize: '13px', color: '#374151', fontWeight: 500 }}>{item.name}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        fontWeight: 500,
                        background: '#FEF2F2',
                        color: '#DC2626',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [, setShowCreateModal] = useState(false)
  const [, setEditingUser] = useState<User | null>(null)

  const loadUsers = async () => {
    try {
      const resp = await userApi.list(page, 20, search || undefined)
      setUsers(resp.data.items)
      setTotal(resp.data.total)
    } catch (err) {
      console.error('Failed to load users')
    }
  }

  useEffect(() => { loadUsers() }, [page, search])

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
    <div style={{
      background: 'white',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
      border: '1px solid #F3F4F6'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{
          fontSize: '16px',
          fontWeight: 600,
          color: '#111827',
          fontFamily: 'var(--font-display)',
          margin: 0
        }}>用户列表</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="搜索用户..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{
              padding: '10px 14px',
              fontSize: '14px',
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              borderRadius: '10px',
              outline: 'none',
              width: '200px'
            }}
            onFocus={(e) => { e.target.style.borderColor = '#2563EB'; }}
            onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; }}
          />
          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(37,99,235,0.3)'
            }}
          >
            <Plus size={18} />
            创建用户
          </button>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>用户名</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>邮箱</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>姓名</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>角色</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>状态</th>
              <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: '12px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} style={{ transition: 'background 0.15s ease', borderBottom: '1px solid #F3F4F6' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#F9FAFB' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#374151', fontWeight: 500 }}>{user.username}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6B7280' }}>{user.email}</td>
                <td style={{ padding: '14px 16px', fontSize: '14px', color: '#6B7280' }}>{user.full_name || '-'}</td>
                <td style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {user.roles?.map((r) => (
                      <span
                        key={r.id}
                        style={{
                          padding: '4px 10px',
                          fontSize: '12px',
                          fontWeight: 500,
                          background: r.name === 'admin' ? '#EFF6FF' : '#F3F4F6',
                          color: r.name === 'admin' ? '#2563EB' : '#6B7280',
                          borderRadius: '9999px'
                        }}
                      >
                        {r.name}
                      </span>
                    ))}
                  </div>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    padding: '4px 10px',
                    fontSize: '12px',
                    fontWeight: 500,
                    background: user.is_active !== false ? '#D1FAE5' : '#FEE2E2',
                    color: user.is_active !== false ? '#059669' : '#DC2626',
                    borderRadius: '9999px'
                  }}>
                    {user.is_active !== false ? '启用' : '禁用'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <button
                    onClick={() => setEditingUser(user)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: 500,
                      background: '#EFF6FF',
                      color: '#2563EB',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginRight: '8px'
                    }}
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '13px',
                      fontWeight: 500,
                      background: '#FEF2F2',
                      color: '#DC2626',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #E5E7EB' }}>
        <span style={{ fontSize: '14px', color: '#6B7280' }}>共 {total} 条</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page <= 1}
            style={{
              padding: '8px 14px',
              fontSize: '14px',
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              cursor: page <= 1 ? 'not-allowed' : 'pointer',
              color: page <= 1 ? '#D1D5DB' : '#374151'
            }}
          >
            上一页
          </button>
          <span style={{ padding: '8px 14px', fontSize: '14px', color: '#374151' }}>第 {page} 页</span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={users.length < 20}
            style={{
              padding: '8px 14px',
              fontSize: '14px',
              background: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              cursor: users.length < 20 ? 'not-allowed' : 'pointer',
              color: users.length < 20 ? '#D1D5DB' : '#374151'
            }}
          >
            下一页
          </button>
        </div>
      </div>

      {/* Modals would go here - simplified for brevity */}
    </div>
  )
}

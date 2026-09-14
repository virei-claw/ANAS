import { useEffect, useState } from 'react'
import { dictApi, DictItem } from '@/lib/api'

export default function Settings() {
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
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">字典管理</h1>

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
    </div>
  )
}

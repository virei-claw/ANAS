import { useState, useEffect } from 'react'
import { annotationApi, dictApi, audioApi, DictItem } from '@/lib/api'
import { useAnnotationTemplate, AnnotationTemplate } from '@/hooks/useAnnotationTemplate'
import toast from 'react-hot-toast'

interface AnnotationFormProps {
  audioId: string
  startTime: number
  endTime: number
  onSuccess: () => void
  onCancel: () => void
}

export default function AnnotationForm({ audioId, startTime, endTime, onSuccess, onCancel }: AnnotationFormProps) {
  const [partNames, setPartNames] = useState<DictItem[]>([])
  const [noiseTypes, setNoiseTypes] = useState<DictItem[]>([])
  const [roadTypes, setRoadTypes] = useState<DictItem[]>([])
  const [newPartName, setNewPartName] = useState('')
  const [newNoiseType, setNewNoiseType] = useState('')
  const [newRoadType, setNewRoadType] = useState('')
  const [showAddPart, setShowAddPart] = useState(false)
  const [showAddNoise, setShowAddNoise] = useState(false)
  const [showAddRoad, setShowAddRoad] = useState(false)

  const { templates, create: createTemplate } = useAnnotationTemplate()
  const [templateName, setTemplateName] = useState('')
  const [showSaveTemplate, setShowSaveTemplate] = useState(false)

  const [form, setForm] = useState({
    part_name_id: '',
    noise_type_id: '',
    road_type_id: '',
    speed: '',
    temperature: '',
    test_mode: 'dynamic',
    reason: '',
    solution: '',
  })

  useEffect(() => {
    loadDict()
  }, [])

  const loadDict = async () => {
    const [parts, noises, roads] = await Promise.all([
      dictApi.partNames.list(),
      dictApi.noiseTypes.list(),
      dictApi.roadTypes.list(),
    ])
    setPartNames(parts.data)
    setNoiseTypes(noises.data)
    setRoadTypes(roads.data)
  }

  const applyTemplate = (template: AnnotationTemplate) => {
    // Find IDs from dict items by name match
    const partItem = partNames.find(p => p.name === template.part_name)
    const noiseItem = noiseTypes.find(n => n.name === template.noise_type)
    const roadItem = roadTypes.find(r => r.name === template.road_type)
    setForm({
      ...form,
      part_name_id: partItem?.id || '',
      noise_type_id: noiseItem?.id || '',
      road_type_id: roadItem?.id || '',
      speed: template.speed != null ? String(template.speed) : '',
      temperature: template.temperature != null ? String(template.temperature) : '',
      test_mode: template.test_mode || 'dynamic',
    })
  }

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return
    const partItem = partNames.find(p => p.id === form.part_name_id)
    const noiseItem = noiseTypes.find(n => n.id === form.noise_type_id)
    const roadItem = roadTypes.find(r => r.id === form.road_type_id)
    await createTemplate({
      name: templateName,
      part_name: partItem?.name || null,
      noise_type: noiseItem?.name || null,
      road_type: roadItem?.name || null,
      speed: form.speed ? Number(form.speed) : null,
      temperature: form.temperature ? Number(form.temperature) : null,
      test_mode: form.test_mode,
    })
    setTemplateName('')
    setShowSaveTemplate(false)
  }

  const handleAddPart = async () => {
    if (!newPartName.trim()) return
    await dictApi.partNames.create(newPartName)
    setNewPartName('')
    setShowAddPart(false)
    loadDict()
  }

  const handleAddNoise = async () => {
    if (!newNoiseType.trim()) return
    await dictApi.noiseTypes.create(newNoiseType)
    setNewNoiseType('')
    setShowAddNoise(false)
    loadDict()
  }

  const handleAddRoad = async () => {
    if (!newRoadType.trim()) return
    await dictApi.roadTypes.create(newRoadType)
    setNewRoadType('')
    setShowAddRoad(false)
    loadDict()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // 1. 先裁剪音频片段
      const clipResult = await audioApi.clip(audioId, startTime, endTime)

      // 2. 创建标注，包含裁剪后的文件路径
      await annotationApi.create({
        audio_id: audioId,
        start_time: startTime,
        end_time: endTime,
        part_name_id: form.part_name_id || null,
        noise_type_id: form.noise_type_id || null,
        road_type_id: form.road_type_id || null,
        speed: form.speed ? Number(form.speed) : null,
        temperature: form.temperature ? Number(form.temperature) : null,
        test_mode: form.test_mode,
        reason: form.reason || null,
        solution: form.solution || null,
        clip_filepath: clipResult.data.clip_filepath,
      })
      onSuccess()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || '保存失败')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-lg shadow">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">新建标注</h3>
        <div className="flex gap-2 items-center">
          {templates.length > 0 && (
            <select
              onChange={(e) => {
                const t = templates.find(tpl => tpl.id === e.target.value)
                if (t) applyTemplate(t)
              }}
              className="border rounded px-2 py-1 text-sm"
              defaultValue=""
            >
              <option value="" disabled>应用模板...</option>
              {templates.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}
          {showSaveTemplate ? (
            <div className="flex gap-1">
              <input
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="border rounded px-2 py-1 text-sm w-28"
                placeholder="模板名称"
              />
              <button type="button" onClick={handleSaveTemplate} className="px-2 py-1 bg-green-500 text-white rounded text-sm">保存</button>
              <button type="button" onClick={() => setShowSaveTemplate(false)} className="px-2 py-1 bg-gray-200 rounded text-sm">取消</button>
            </div>
          ) : (
            <button type="button" onClick={() => setShowSaveTemplate(true)} className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded text-sm">保存为模板</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 零部件名称 */}
        <div>
          <label className="block text-sm font-medium mb-1">零部件名称</label>
          {showAddPart ? (
            <div className="flex gap-2">
              <input
                value={newPartName}
                onChange={(e) => setNewPartName(e.target.value)}
                className="flex-1 border rounded px-2 py-1"
                placeholder="输入名称"
              />
              <button type="button" onClick={handleAddPart} className="px-2 py-1 bg-green-500 text-white rounded text-sm">添加</button>
              <button type="button" onClick={() => setShowAddPart(false)} className="px-2 py-1 bg-gray-200 rounded text-sm">取消</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={form.part_name_id}
                onChange={(e) => setForm({ ...form, part_name_id: e.target.value })}
                className="flex-1 border rounded px-2 py-1"
              >
                <option value="">请选择</option>
                {partNames.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => setShowAddPart(true)} className="px-2 py-1 bg-blue-500 text-white rounded text-sm">+</button>
            </div>
          )}
        </div>

        {/* 异响类型 */}
        <div>
          <label className="block text-sm font-medium mb-1">异响类型</label>
          {showAddNoise ? (
            <div className="flex gap-2">
              <input
                value={newNoiseType}
                onChange={(e) => setNewNoiseType(e.target.value)}
                className="flex-1 border rounded px-2 py-1"
                placeholder="输入类型"
              />
              <button type="button" onClick={handleAddNoise} className="px-2 py-1 bg-green-500 text-white rounded text-sm">添加</button>
              <button type="button" onClick={() => setShowAddNoise(false)} className="px-2 py-1 bg-gray-200 rounded text-sm">取消</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={form.noise_type_id}
                onChange={(e) => setForm({ ...form, noise_type_id: e.target.value })}
                className="flex-1 border rounded px-2 py-1"
              >
                <option value="">请选择</option>
                {noiseTypes.map((n) => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => setShowAddNoise(true)} className="px-2 py-1 bg-blue-500 text-white rounded text-sm">+</button>
            </div>
          )}
        </div>

        {/* 路面类型 */}
        <div>
          <label className="block text-sm font-medium mb-1">路面类型</label>
          {showAddRoad ? (
            <div className="flex gap-2">
              <input
                value={newRoadType}
                onChange={(e) => setNewRoadType(e.target.value)}
                className="flex-1 border rounded px-2 py-1"
                placeholder="输入类型"
              />
              <button type="button" onClick={handleAddRoad} className="px-2 py-1 bg-green-500 text-white rounded text-sm">添加</button>
              <button type="button" onClick={() => setShowAddRoad(false)} className="px-2 py-1 bg-gray-200 rounded text-sm">取消</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <select
                value={form.road_type_id}
                onChange={(e) => setForm({ ...form, road_type_id: e.target.value })}
                className="flex-1 border rounded px-2 py-1"
              >
                <option value="">请选择</option>
                {roadTypes.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
              <button type="button" onClick={() => setShowAddRoad(true)} className="px-2 py-1 bg-blue-500 text-white rounded text-sm">+</button>
            </div>
          )}
        </div>

        {/* 车速 */}
        <div>
          <label className="block text-sm font-medium mb-1">车速 (km/h)</label>
          <input
            type="number"
            value={form.speed}
            onChange={(e) => setForm({ ...form, speed: e.target.value })}
            className="w-full border rounded px-2 py-1"
            min="0"
            max="300"
          />
        </div>

        {/* 温度 */}
        <div>
          <label className="block text-sm font-medium mb-1">温度 (℃)</label>
          <input
            type="number"
            value={form.temperature}
            onChange={(e) => setForm({ ...form, temperature: e.target.value })}
            className="w-full border rounded px-2 py-1"
            min="-40"
            max="100"
          />
        </div>

        {/* 测试场景 */}
        <div>
          <label className="block text-sm font-medium mb-1">测试场景</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="test_mode"
                value="dynamic"
                checked={form.test_mode === 'dynamic'}
                onChange={(e) => setForm({ ...form, test_mode: e.target.value })}
              />
              动态
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="test_mode"
                value="static"
                checked={form.test_mode === 'static'}
                onChange={(e) => setForm({ ...form, test_mode: e.target.value })}
              />
              静态
            </label>
          </div>
        </div>
      </div>

      {/* 原因 */}
      <div>
        <label className="block text-sm font-medium mb-1">原因</label>
        <textarea
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
          className="w-full border rounded px-2 py-1 h-20"
          placeholder="描述异响原因..."
        />
      </div>

      {/* 解决方案 */}
      <div>
        <label className="block text-sm font-medium mb-1">解决方案</label>
        <textarea
          value={form.solution}
          onChange={(e) => setForm({ ...form, solution: e.target.value })}
          className="w-full border rounded px-2 py-1 h-20"
          placeholder="描述处理方案..."
        />
      </div>

      {/* 时间信息 */}
      <div className="text-sm text-gray-600">
        异响时间段: {startTime.toFixed(2)}s - {endTime.toFixed(2)}s
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">取消</button>
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">保存</button>
      </div>
    </form>
  )
}

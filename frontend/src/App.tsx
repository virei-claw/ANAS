import { Routes, Route } from 'react-router-dom'
import AudioList from './pages/AudioList'
import AudioDetail from './pages/AudioDetail'
import Settings from './pages/Settings'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <span className="text-xl font-bold">异音检测数据标注系统</span>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<AudioList />} />
        <Route path="/audio/:id" element={<AudioDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </div>
  )
}

export default App

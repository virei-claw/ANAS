import { Routes, Route, Link, useLocation } from 'react-router-dom'
import { Home, Settings, BarChart3, User, Menu, X } from 'lucide-react'
import { useState } from 'react'
import Toast from './components/Toast'
import AudioList from './pages/AudioList'
import AudioDetail from './pages/AudioDetail'

// 导航栏组件
function NavBar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  const navItems = [
    { path: '/', label: '音频管理', icon: Home },
    { path: '/tasks', label: '标注任务', icon: User },
    { path: '/dashboard', label: '统计分析', icon: BarChart3 },
    { path: '/settings', label: '设置', icon: Settings },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">AN</span>
            </div>
            <span className="text-xl font-bold text-gray-900">ANAS</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive(path)
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
              <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">Z</span>
              </div>
              <span className="text-sm text-gray-700">张三</span>
            </div>
            <button
              className="p-2 hover:bg-gray-100 rounded-lg md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(path)
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
            <div className="flex items-center gap-2 px-4 py-3 mt-2 border-t border-gray-200">
              <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">Z</span>
              </div>
              <span className="text-sm text-gray-700">张三</span>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

function App() {
  return (
    <>
      <Toast />
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <Routes>
          <Route path="/" element={<AudioList />} />
          <Route path="/audio/:id" element={<AudioDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </>
  )
}

export default App

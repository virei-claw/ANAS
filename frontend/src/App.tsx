import { Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom'
import { Home, Settings as SettingsIcon, BarChart3, User, Menu, X, LogOut, Download, FolderOpen, Upload } from 'lucide-react'
import { useState, useEffect } from 'react'
import Toast from './components/Toast'
import ProtectedRoute from './components/ProtectedRoute'
import AudioList from './pages/AudioList'
import AudioDetail from './pages/AudioDetail'
import Login from './pages/Login'
import Settings from './pages/Settings'
import ReviewQueue from './pages/ReviewQueue'
import Export from './pages/Export'
import Projects from './pages/Projects'
import Dashboard from './pages/Dashboard'
import MyCenter from './pages/MyCenter'
import Import from './pages/Import'
import { annotationApi } from './lib/api'

// 导航栏组件
interface NavBarProps {
  user?: { username: string; full_name?: string; roles?: { name: string }[] } | null
  onLogout?: () => void
  pendingCount?: number
}

function NavBar({ user, onLogout, pendingCount = 0 }: NavBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // 判断是否为管理员
  const isAdmin = user?.roles?.some(r => r.name === 'admin') || false

  const navItems = [
    { path: '/', label: '音频管理', icon: Home },
    { path: '/projects', label: '项目管理', icon: FolderOpen },
    // 仅管理员显示审核队列
    ...(isAdmin ? [{ path: '/review', label: '审核队列', icon: User, badge: pendingCount }] : []),
    { path: '/dashboard', label: '统计分析', icon: BarChart3 },
    { path: '/export', label: '标注总览', icon: Download },
    { path: '/import', label: '批量导入', icon: Upload },
    // 仅管理员显示设置中的用户管理
    { path: '/settings', label: '设置', icon: SettingsIcon },
    { path: '/my', label: '我的', icon: User },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav style={{
      background: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--color-border)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div className="max-w-7xl mx-auto px-6">
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '64px'
        }}>
          {/* Logo */}
          <Link to="/" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none'
          }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
            }}>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '14px', fontFamily: 'var(--font-display)' }}>AN</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="hidden md:flex">
            {navItems.map(({ path, label, icon: Icon, badge }) => (
              <Link
                key={path}
                to={path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)',
                  background: isActive(path) ? 'var(--color-accent-soft)' : 'transparent',
                  color: isActive(path) ? 'var(--color-accent)' : 'var(--color-text-secondary)'
                }}
                onMouseEnter={(e) => {
                  if (!isActive(path)) {
                    e.currentTarget.style.background = 'var(--color-bg-secondary)';
                    e.currentTarget.style.color = 'var(--color-text-primary)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive(path)) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'var(--color-text-secondary)';
                  }
                }}
              >
                <Icon size={18} />
                {label}
                {badge !== undefined && badge > 0 && (
                  <span style={{
                    marginLeft: '6px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: '#EF4444',
                    color: 'white',
                    borderRadius: '9999px',
                    minWidth: '20px',
                    textAlign: 'center'
                  }}>
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* User Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user ? (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '6px 14px 6px 6px',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: '9999px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                    borderRadius: '9999px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                  }}>
                    <span style={{ color: 'white', fontWeight: 600, fontSize: '13px' }}>{user.username[0].toUpperCase()}</span>
                  </div>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>{user.username}</span>
                </div>
                <button
                  onClick={onLogout}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--color-text-secondary)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                  title="退出登录"
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg-secondary)'; e.currentTarget.style.color = 'var(--color-error)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
                >
                  <LogOut size={18} />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                style={{
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                  color: 'white',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                  transition: 'all var(--transition-fast)'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(37, 99, 235, 0.4)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(37, 99, 235, 0.3)'; }}
              >
                登录
              </Link>
            )}
            <button
              style={{
                padding: '8px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
                display: 'none'
              }}
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div style={{ paddingBottom: '16px', borderTop: '1px solid var(--color-border)', marginTop: '8px' }} className="md:hidden">
            {navItems.map(({ path, label, icon: Icon, badge }) => (
              <Link
                key={path}
                to={path}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  marginTop: '4px',
                  background: isActive(path) ? 'var(--color-accent-soft)' : 'transparent',
                  color: isActive(path) ? 'var(--color-accent)' : 'var(--color-text-secondary)'
                }}
              >
                <Icon size={18} />
                {label}
                {badge !== undefined && badge > 0 && (
                  <span style={{
                    marginLeft: 'auto',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 600,
                    background: '#EF4444',
                    color: 'white',
                    borderRadius: '9999px'
                  }}>
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            ))}
            {user ? (
              <div className="flex items-center gap-2 px-4 py-3 mt-2 border-t border-gray-200">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{user.username[0].toUpperCase()}</span>
                </div>
                <span className="text-sm text-gray-700">{user.username}</span>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-2 px-4 py-3 mt-2 border-t border-gray-200 text-indigo-600 font-medium"
              >
                登录
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

function App() {
  const [user, setUser] = useState<{ username: string; full_name?: string; roles?: { name: string }[] } | null>(null)
  const [pendingCount, setPendingCount] = useState(0)
  const navigate = useNavigate()
  const location = useLocation()

  // 获取待审核数量
  const fetchPendingCount = async () => {
    try {
      const res = await annotationApi.listPending()
      setPendingCount(res.data.length)
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    // 检查登录状态
    const userStr = localStorage.getItem('user')
    if (userStr) {
      setUser(JSON.parse(userStr))
      fetchPendingCount()
    }
  }, [location.pathname])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }

  return (
    <>
      <Toast />
      <div className="min-h-screen bg-gray-50">
        <NavBar user={user} onLogout={handleLogout} pendingCount={pendingCount} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><AudioList /></ProtectedRoute>} />
          <Route path="/audio/:id" element={<ProtectedRoute><AudioDetail /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/review" element={<ProtectedRoute><ReviewQueue /></ProtectedRoute>} />
          <Route path="/export" element={<ProtectedRoute><Export /></ProtectedRoute>} />
          <Route path="/import" element={<ProtectedRoute><Import /></ProtectedRoute>} />
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/my" element={<ProtectedRoute><MyCenter /></ProtectedRoute>} />
        </Routes>
      </div>
    </>
  )
}

export default App

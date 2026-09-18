import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, User, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '@/lib/api'

interface LoginForm {
  username: string
  password: string
}

interface RegisterForm {
  username: string
  email: string
  password: string
  full_name: string
}

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const navigate = useNavigate()

  const [loginForm, setLoginForm] = useState<LoginForm>({
    username: '',
    password: '',
  })

  const [registerForm, setRegisterForm] = useState<RegisterForm>({
    username: '',
    email: '',
    password: '',
    full_name: '',
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const formData = new URLSearchParams()
      formData.append('username', loginForm.username)
      formData.append('password', loginForm.password)

      const response = await api.post('/auth/login', formData.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })

      localStorage.setItem('token', response.data.access_token)
      localStorage.setItem('user', JSON.stringify(response.data.user))

      toast.success('登录成功')
      navigate('/')
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/auth/register', registerForm)
      toast.success('注册成功，请登录')
      setActiveTab('login')
      setLoginForm({ username: registerForm.username, password: '' })
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #6B8DD6 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 50%)',
        pointerEvents: 'none'
      }} />

      {/* Floating shapes */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '10%',
        width: '300px',
        height: '300px',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '50%',
        filter: 'blur(60px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '15%',
        width: '250px',
        height: '250px',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '50%',
        filter: 'blur(50px)',
        pointerEvents: 'none'
      }} />

      {/* Login Card */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255,255,255,0.1)',
        padding: '40px',
        position: 'relative',
        zIndex: 10,
        animation: 'scaleIn 0.5s ease-out'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '56px',
            height: '56px',
            background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
            borderRadius: '16px',
            marginBottom: '16px',
            boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)'
          }}>
            <span style={{ color: 'white', fontWeight: 700, fontSize: '20px', fontFamily: 'var(--font-display)' }}>AN</span>
          </div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#111827',
            fontFamily: 'var(--font-display)',
            letterSpacing: '-0.02em',
            margin: 0
          }}>ANAS</h1>
          <p style={{
            fontSize: '14px',
            color: '#6B7280',
            marginTop: '4px'
          }}>异音检测数据标注系统</p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: '#F3F4F6',
          borderRadius: '12px',
          padding: '4px',
          marginBottom: '28px'
        }}>
          <button
            onClick={() => { setActiveTab('login'); }}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'login' ? 'white' : 'transparent',
              color: activeTab === 'login' ? '#111827' : '#6B7280',
              boxShadow: activeTab === 'login' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            登录
          </button>
          <button
            onClick={() => { setActiveTab('register'); }}
            style={{
              flex: 1,
              padding: '10px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: activeTab === 'register' ? 'white' : 'transparent',
              color: activeTab === 'register' ? '#111827' : '#6B7280',
              boxShadow: activeTab === 'register' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            注册
          </button>
        </div>

        {activeTab === 'login' ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                用户名
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 44px',
                    fontSize: '14px',
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                  placeholder="请输入用户名"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                密码
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 44px',
                    fontSize: '14px',
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                  placeholder="请输入密码"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#93C5FD' : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: 'white',
                borderRadius: '10px',
                border: 'none',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(37,99,235,0.35)'
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.4)'; }}}
              onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.35)'; }}}
            >
              {loading ? '登录中...' : '登录'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                用户名
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input
                  type="text"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 44px',
                    fontSize: '14px',
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                  placeholder="请输入用户名"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                邮箱
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 44px',
                    fontSize: '14px',
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                  placeholder="请输入邮箱"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                姓名
              </label>
              <div style={{ position: 'relative' }}>
                <User size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input
                  type="text"
                  value={registerForm.full_name}
                  onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 44px',
                    fontSize: '14px',
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                  placeholder="请输入真实姓名（选填）"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 500, color: '#374151', marginBottom: '8px' }}>
                密码
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                <input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 44px',
                    fontSize: '14px',
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    borderRadius: '10px',
                    outline: 'none',
                    transition: 'all 0.2s ease',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#2563EB'; e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#E5E7EB'; e.target.style.boxShadow = 'none'; }}
                  placeholder="请输入密码"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#93C5FD' : 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                color: 'white',
                borderRadius: '10px',
                border: 'none',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                boxShadow: loading ? 'none' : '0 4px 14px rgba(37,99,235,0.35)',
                marginTop: '4px'
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(37,99,235,0.4)'; }}}
              onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,99,235,0.35)'; }}}
            >
              {loading ? '注册中...' : '注册'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

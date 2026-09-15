import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('token')
  const location = useLocation()

  if (!token) {
    // 未登录，重定向到登录页
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

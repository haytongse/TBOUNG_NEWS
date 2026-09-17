import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const ALLOWED_ROLES = ['superAdmin', 'admin', 'editor']

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const storedUser = (() => {
    try { const s = localStorage.getItem('auth_user'); return s ? JSON.parse(s) : null } catch { return null }
  })()
  const effectiveUser = user ?? storedUser
  const hasToken = !!localStorage.getItem('auth_token')

  if (!effectiveUser || !hasToken) return <Navigate to="/auth/login" replace />
  if (!ALLOWED_ROLES.includes(effectiveUser.role)) {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
    return <Navigate to="/auth/login" replace />
  }
  return <>{children}</>
}

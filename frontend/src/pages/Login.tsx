import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faEyeSlash, faSpinner, faCircleExclamation } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../contexts/AuthContext'

const ALLOWED_ROLES = ['superAdmin', 'admin', 'editor']

export default function Login() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user && ALLOWED_ROLES.includes(user.role)) return <Navigate to="/auth/admin" replace />

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const loggedIn = await login(email, password)
      if (!ALLOWED_ROLES.includes(loggedIn.role)) {
        setError('Your account does not have admin access.')
        return
      }
      navigate('/auth/admin')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 bg-gold-400 rounded-full flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 64 64" className="w-10 h-10 fill-primary-900">
              <path d="M32 4L8 16v16c0 13 10.4 24.5 24 27 13.6-2.5 24-14 24-27V16L32 4z"/>
              <path d="M32 10L12 20v12c0 10 8 19 20 21 12-2 20-11 20-21V20L32 10z" fill="#d97706"/>
              <text x="32" y="36" textAnchor="middle" fontSize="13" fontWeight="bold" fill="#1e3a6e">NP</text>
            </svg>
          </div>
          <div>
            <p className="text-gold-400 font-bold text-lg font-battambang">នគរបាលជាតិ</p>
            <p className="text-gray-400 text-xs">Cambodia National Police</p>
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-white text-3xl font-bold leading-snug mb-3 font-battambang">
            គ្រប់គ្រងព័ត៌មាន<br />
            <span className="text-gray-400">នៅក្នុងកន្លែងតែមួយ</span>
          </p>
          <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
            Publish articles, manage categories, control sliders — all from a single secure admin panel.
          </p>
        </div>

        <p className="text-gray-600 text-xs relative z-10">
          © {new Date().getFullYear()} Cambodia National Police. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-8 lg:hidden">
            <div className="w-10 h-10 bg-gold-400 rounded-full flex items-center justify-center">
              <svg viewBox="0 0 64 64" className="w-8 h-8 fill-primary-900">
                <path d="M32 4L8 16v16c0 13 10.4 24.5 24 27 13.6-2.5 24-14 24-27V16L32 4z"/>
                <path d="M32 10L12 20v12c0 10 8 19 20 21 12-2 20-11 20-21V20L32 10z" fill="#d97706"/>
              </svg>
            </div>
            <p className="text-primary-800 font-bold font-battambang">នគរបាលជាតិ</p>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
            <p className="text-sm text-gray-500">Sign in to your admin account</p>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 px-4 py-3 bg-red-50 border border-red-200 rounded-lg">
              <FontAwesomeIcon icon={faCircleExclamation} className="text-red-500 mt-0.5 shrink-0 text-sm" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
              <input
                type="email" required autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@police.gov.kh"
                className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400
                           focus:outline-none focus:bg-white focus:border-primary-700 focus:ring-2 focus:ring-primary-700/10 transition-all"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <span className="text-xs text-primary-600 cursor-pointer hover:text-primary-800">Forgot password?</span>
              </div>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-11 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400
                             focus:outline-none focus:bg-white focus:border-primary-700 focus:ring-2 focus:ring-primary-700/10 transition-all"
                />
                <button type="button" tabIndex={-1} onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
                  <FontAwesomeIcon icon={showPw ? faEyeSlash : faEye} className="text-sm" />
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary-800 text-white font-semibold text-sm py-3 rounded-lg
                         hover:bg-primary-700 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {loading ? <><FontAwesomeIcon icon={faSpinner} className="animate-spin" /> Signing in…</> : 'Sign in'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            © {new Date().getFullYear()} Cambodia National Police
          </p>
        </div>
      </div>
    </div>
  )
}

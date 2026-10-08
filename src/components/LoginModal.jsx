import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function LoginModal({ isOpen, onClose }) {
  const { login, loading, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    setSuccessMessage('')
    clearError()

    if (!email.trim()) {
      setLocalError('Please enter your teacher email.')
      return
    }
    if (!password) {
      setLocalError('Please enter your password.')
      return
    }

    try {
      await login(email.trim(), password)
      setSuccessMessage('Successfully signed in!')
      setTimeout(() => {
        setSuccessMessage('')
        onClose()
      }, 700)
    } catch (err) {
      // Error is set in AuthContext and can also be displayed here
      setLocalError(err?.message || 'Login failed. Please verify your credentials.')
    }
  }

  const handleClose = () => {
    setLocalError('')
    clearError()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-math-red to-[#6b0f2a] p-6 text-white text-center relative">
          <button
            onClick={handleClose}
            type="button"
            className="absolute top-4 right-4 text-white/80 hover:text-white text-xl p-1 focus:outline-none"
            aria-label="Close"
          >
            &times;
          </button>
          <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-3 backdrop-blur-md border border-white/20 shadow-inner">
            <span className="font-bold text-2xl text-white">π</span>
          </div>
          <h2 className="text-xl font-bold tracking-tight">Teacher Portal Login</h2>
          <p className="text-xs text-white/80 mt-1">
            mathshouse.net backend authentication
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          <div className="mb-4 bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-xs text-gray-600 flex items-center gap-2">
            <span className="font-mono text-[11px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded">POST</span>
            <span className="font-mono text-[11px] text-gray-800 truncate">/api/teacher/auth/login</span>
          </div>

          {(localError || error) && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-math-red text-red-700 text-xs rounded-r">
              <div className="font-semibold">Authentication Error</div>
              <div>{localError || error}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 text-xs rounded-r">
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teacher@mathshouse.net"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-math-red focus:border-transparent transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-gray-500 hover:text-math-red focus:outline-none"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-math-red focus:border-transparent transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 bg-math-red hover:bg-math-red-hover active:scale-[0.99] text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    ></path>
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In as Teacher</span>
              )}
            </button>
          </form>
        </div>



      </div>
    </div>
  )
}

import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { login, loading, error, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    clearError()

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      setLocalError('Please enter your teacher email.')
      return
    }
    if (!password) {
      setLocalError('Please enter your password.')
      return
    }

    try {
      await login(trimmedEmail, password)
    } catch (err) {
      setLocalError(err?.message || 'Invalid email or password. Please try again.')
    }
  }

  const activeError = localError || error

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center relative overflow-hidden selection:bg-math-red selection:text-white">
      {/* Background Decorative Gradient Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45rem] h-[45rem] rounded-full bg-math-red/20 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45rem] h-[45rem] rounded-full bg-indigo-900/30 blur-[140px] pointer-events-none" />

      {/* Subtle Math Ambient Watermark */}
      <div className="absolute inset-0 flex items-center justify-around pointer-events-none opacity-[0.03] select-none text-8xl font-serif">
        <span>π</span>
        <span>∑</span>
        <span>∫</span>
        <span>√</span>
        <span>λ</span>
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md px-4 py-8">
        {/* Brand & Portal Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-math-red to-[#b31b48] text-white shadow-xl shadow-math-red/30 mb-4 ring-4 ring-white/10">
            <span className="font-serif font-bold text-3xl">π</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            MathHouse <span className="text-red-400 font-normal">Portal</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Teacher Authentication & Portal Dashboard
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/70 rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-700/60">
            <h2 className="text-base font-semibold text-slate-200">Teacher Sign In</h2>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium bg-slate-700/60 text-slate-300 px-2.5 py-1 rounded-full border border-slate-600/40">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Secure Auth
            </span>
          </div>

          {/* Error Message Box */}
          {activeError && (
            <div className="mb-5 p-3.5 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
              <i className="fa-solid fa-circle-exclamation text-red-400 text-sm mt-0.5 shrink-0"></i>
              <div className="flex-1 font-medium">{activeError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="teacher-email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2"
              >
                Teacher Email
              </label>
              <div className="relative">
                <input
                  id="teacher-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (activeError) setLocalError('')
                  }}
                  placeholder="teacher@mathshouse.net"
                  autoComplete="email"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-math-red focus:border-transparent transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="teacher-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-300"
                >
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-xs text-slate-400 hover:text-white transition-colors focus:outline-none"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <div className="relative">
                <input
                  id="teacher-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (activeError) setLocalError('')
                  }}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-slate-900/90 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-math-red focus:border-transparent transition-all disabled:opacity-50"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-math-red to-[#a31a44] hover:from-[#73112e] hover:to-[#8a1538] active:scale-[0.99] text-white font-semibold rounded-xl shadow-lg shadow-math-red/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-2"
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
                  <span>Signing In...</span>
                </>
              ) : (
                <span>Access Teacher Portal</span>
              )}
            </button>
          </form>



        </div>

        {/* Bottom Helper text */}
        <p className="text-center text-xs text-slate-500 mt-6">
          &copy; {new Date().getFullYear()} MathHouse. Protected teacher access.
        </p>
      </div>
    </div>
  )
}

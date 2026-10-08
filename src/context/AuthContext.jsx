import { createContext, useState, useEffect, useCallback } from 'react'
import authApi from '../api/authApi'

export const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authApi.getStoredUser())
  const [token, setToken] = useState(() => authApi.getToken())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const clearError = useCallback(() => setError(null), [])

  // Listen for global 401 unauthorized events
  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null)
      setToken(null)
    }
    window.addEventListener('auth:unauthorized', handleUnauthorized)
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized)
    }
  }, [])

  /**
   * Teacher Login
   * @param {string} email
   * @param {string} password
   */
  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const result = await authApi.login({ email, password })
      setToken(result.token)
      setUser(result.user)
      return result
    } catch (err) {
      const errMsg = err.message || 'Login failed. Please check your credentials.'
      setError(errMsg)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Teacher Logout
   */
  const logout = useCallback(async () => {
    setLoading(true)
    try {
      await authApi.logout()
    } finally {
      setToken(null)
      setUser(null)
      setLoading(false)
    }
  }, [])

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    loading,
    error,
    login,
    logout,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthContext

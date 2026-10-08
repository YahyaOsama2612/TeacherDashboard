import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

/**
 * Hook to access teacher authentication context
 * @returns {{
 *   user: Object|null,
 *   token: string|null,
 *   isAuthenticated: boolean,
 *   loading: boolean,
 *   error: string|null,
 *   login: (email: string, password: string) => Promise<any>,
 *   logout: () => Promise<void>,
 *   clearError: () => void
 * }}
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default useAuth

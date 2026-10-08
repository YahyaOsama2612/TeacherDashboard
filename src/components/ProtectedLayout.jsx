import { useAuth } from '../hooks/useAuth'
import LoginPage from './LoginPage'

/**
 * ProtectedLayout component:
 * Prevents unauthenticated users from seeing the dashboard/home views.
 * If not authenticated, renders the LoginPage.
 */
export default function ProtectedLayout({ children }) {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return <>{children}</>
}

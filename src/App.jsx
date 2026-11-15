import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { TeacherDataProvider, useTeacherData } from './context/TeacherDataContext.jsx'
import ProtectedLayout from './components/ProtectedLayout.jsx'
import AppShell from './components/layout/AppShell.jsx'
import { Spinner } from './components/ui.jsx'
import DashboardPage from './pages/DashboardPage.jsx'
import SessionsPage from './pages/SessionsPage.jsx'
import RatingsPage from './pages/RatingsPage.jsx'
import StudentsPage from './pages/StudentsPage.jsx'
import RequestsPage from './pages/RequestsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import WorkspacePage from './pages/WorkspacePage.jsx'

/** Shows a loader on first load and an error with retry if the API can't be reached. */
function Ready({ children }) {
  const { loading, error, refreshAll } = useTeacherData()
  if (loading) return <Spinner label="Loading your dashboard…" />
  if (error) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 p-8 text-center max-w-lg mx-auto mt-10">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-red-50 text-math-red flex items-center justify-center mb-3"><i className="fa-solid fa-plug-circle-exclamation"></i></div>
        <p className="font-bold text-gray-900">Could not load your dashboard</p>
        <p className="text-sm text-gray-500 mt-1">{error}</p>
        <button onClick={refreshAll} className="mt-4 px-5 py-2.5 text-sm font-bold text-white bg-math-red hover:bg-math-red-hover rounded-xl">Try again</button>
      </div>
    )
  }
  return children
}

const page = (el) => <Ready>{el}</Ready>

export default function App() {
  return (
    <AuthProvider>
      <ProtectedLayout>
        <TeacherDataProvider>
          <HashRouter>
            <Routes>
              <Route element={<AppShell />}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={page(<DashboardPage />)} />
                <Route path="sessions" element={page(<SessionsPage />)} />
                <Route path="students" element={page(<StudentsPage />)} />
                <Route path="ratings" element={page(<RatingsPage />)} />
                <Route path="requests" element={page(<RequestsPage />)} />
                <Route path="profile" element={page(<ProfilePage />)} />
                <Route path="workspace/:id" element={<WorkspacePage />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Routes>
          </HashRouter>
        </TeacherDataProvider>
      </ProtectedLayout>
    </AuthProvider>
  )
}

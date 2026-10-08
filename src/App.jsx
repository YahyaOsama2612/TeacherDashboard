import { useState } from 'react'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedLayout from './components/ProtectedLayout.jsx'
import Header from './components/Header.jsx'
import ScheduleView from './components/ScheduleView.jsx'
import StudentsView from './components/StudentsView.jsx'
import SessionsView from './components/SessionsView.jsx'
import FeedbackModal from './components/FeedbackModal.jsx'
import WorkspaceView from './components/WorkspaceView.jsx'

function Dashboard() {
  const [activeView, setActiveView] = useState('schedule')
  const [selectedSession, setSelectedSession] = useState(null)
  const [workspaceSession, setWorkspaceSession] = useState(null)

  const openFeedbackModal = (session) => setSelectedSession(session)
  const closeFeedbackModal = () => setSelectedSession(null)

  const openWorkspace = (session) => setWorkspaceSession(session)
  const closeWorkspace = () => setWorkspaceSession(null)

  // Workspace takes over the full screen
  if (workspaceSession) {
    return <WorkspaceView session={workspaceSession} onBack={closeWorkspace} />
  }

  return (
    <>
      <Header
        activeView={activeView}
        onNavigate={setActiveView}
      />

      <main className="flex-grow flex flex-col relative">
        {activeView === 'schedule' && <ScheduleView onOpenWorkspace={openWorkspace} />}
        {activeView === 'students' && <StudentsView />}
        {activeView === 'sessions' && <SessionsView onViewDetails={openFeedbackModal} onOpenWorkspace={openWorkspace} />}
      </main>

      <FeedbackModal
        isOpen={!!selectedSession}
        session={selectedSession}
        onClose={closeFeedbackModal}
        onOpenWorkspace={openWorkspace}
      />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ProtectedLayout>
        <Dashboard />
      </ProtectedLayout>
    </AuthProvider>
  )
}

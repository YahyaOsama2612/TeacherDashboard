import { useState, useEffect } from 'react'
import StudentCard from './StudentCard.jsx'
import { useSessions, useSessionStudents } from '../hooks/useSessions'

export default function StudentsView() {
  const { sessions, loading: sessionsLoading } = useSessions()
  const [selectedSessionId, setSelectedSessionId] = useState('')

  // Automatically select the first available session when sessions are loaded
  useEffect(() => {
    if (sessions && sessions.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id)
    }
  }, [sessions, selectedSessionId])

  // Call GET /api/teacher/sessions/:sessionId/students
  const {
    students,
    count,
    loading: studentsLoading,
    error,
    refetch,
  } = useSessionStudents(selectedSessionId)

  const selectedSession = sessions.find((s) => s.id === selectedSessionId)
  const sessionName =
    selectedSession?.name ||
    selectedSession?.title ||
    selectedSession?.lessons?.[0]?.name ||
    'Selected Session'

  const presentCount = students.filter((s) => s.attendance?.status === 'present').length

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-gray-900">Session Students</h1>
            {!studentsLoading && selectedSessionId && (
              <span className="bg-red-50 text-math-red text-xs font-semibold px-2.5 py-0.5 rounded-full border border-red-100">
                {count || students.length} Enrolled
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm">
            Enrolled students and attendance tracked by session.
          </p>
        </div>

        {/* Session Selector & Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {sessions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-semibold hidden sm:inline">
                Session:
              </span>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="bg-white border border-gray-200 text-xs font-medium text-gray-700 rounded-lg px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-math-red focus:border-transparent max-w-xs truncate cursor-pointer"
              >
                {sessions.map((s) => {
                  const name = s.name || s.title || s.lessons?.[0]?.name || 'Session'
                  const dateStr = s.sessionDate ? ` (${new Date(s.sessionDate).toLocaleDateString()})` : ''
                  return (
                    <option key={s.id} value={s.id}>
                      {name}{dateStr}
                    </option>
                  )
                })}
              </select>
            </div>
          )}

          <button
            onClick={() => refetch()}
            disabled={studentsLoading || !selectedSessionId}
            className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-math-red bg-white border border-gray-200 hover:border-math-red/30 px-3.5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
          >
            <i className={`fa-solid fa-arrows-rotate ${studentsLoading ? 'animate-spin' : ''}`}></i>
            <span>{studentsLoading ? 'Refreshing...' : 'Refresh Roster'}</span>
          </button>
        </div>
      </div>

      {/* Active Session Info Bar */}
      {selectedSession && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-700 uppercase tracking-wide">Session:</span>
            <span className="font-bold text-gray-900 text-sm">
              {sessionName}
            </span>
            {selectedSession.lessons?.[0]?.course?.name && (
              <span className="bg-red-50 text-math-red px-2.5 py-0.5 rounded font-bold border border-red-100">
                {selectedSession.lessons[0].course.name}
              </span>
            )}
            {selectedSession.sessionRelationalType && (
              <span className="bg-white border border-gray-200 px-2 py-0.5 rounded text-gray-600 font-medium">
                {selectedSession.sessionRelationalType}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-gray-500 shrink-0">
            <span>
              Attendance:{' '}
              <strong className="text-emerald-600">{presentCount}</strong> / {students.length} Present
            </span>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-math-red rounded-r text-xs text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-math-red text-sm"></i>
            <span>Failed to load session students: {error}</span>
          </div>
          <button
            onClick={() => refetch()}
            className="underline font-semibold hover:text-red-900 cursor-pointer ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading Skeletons */}
      {studentsLoading || sessionsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm animate-pulse h-48 flex flex-col justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                <div className="space-y-2 flex-1">
                  <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
                  <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="h-8 bg-gray-100 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : !selectedSessionId ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
            <i className="fa-solid fa-calendar-xmark"></i>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Active Sessions</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Please create or schedule a session first to view enrolled students.
          </p>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <div className="w-16 h-16 bg-red-50 text-math-red rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
            <i className="fa-solid fa-user-xmark"></i>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Students Enrolled</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            There are no students currently enrolled in "{sessionName}".
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-white border border-gray-200 hover:border-math-red text-gray-700 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Check Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {students.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      )}
    </div>
  )
}

import SessionHistoryItem from './SessionHistoryItem.jsx'
import { usePastSessions } from '../hooks/useSessions'

export default function SessionsView({ onViewDetails, onOpenWorkspace }) {
  const { sessions, loading, error, refetch, count } = usePastSessions()

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-gray-900">Past Sessions History</h1>
            {!loading && (
              <span className="bg-gray-100 text-gray-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-gray-200">
                {count || sessions.length} Total
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm">
            Completed teaching sessions and lesson history fetched live from your account.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-math-red bg-white border border-gray-200 hover:border-math-red/30 px-3.5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
        >
          <i className={`fa-solid fa-arrows-rotate ${loading ? 'animate-spin' : ''}`}></i>
          <span>{loading ? 'Refreshing...' : 'Refresh History'}</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-math-red rounded-r text-xs text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-math-red text-sm"></i>
            <span>Failed to load past sessions: {error}</span>
          </div>
          <button
            onClick={() => refetch()}
            className="underline font-semibold hover:text-red-900 cursor-pointer ml-4"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm animate-pulse h-36 flex flex-col justify-between"
            >
              <div className="w-1/3 h-5 bg-gray-200 rounded"></div>
              <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
              <div className="w-1/4 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Past Sessions</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            There are no completed or past sessions recorded on your teacher account yet.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-white border border-gray-200 hover:border-math-red text-gray-700 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Refresh
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {sessions.map((session) => (
            <SessionHistoryItem
              key={session.id}
              session={session}
              onViewDetails={() => onViewDetails(session)}
              onOpenWorkspace={() => onOpenWorkspace(session)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

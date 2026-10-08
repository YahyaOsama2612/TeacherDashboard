import ScheduleCard from './ScheduleCard.jsx'
import { useUpcomingSessions } from '../hooks/useSessions'

export default function ScheduleView({ onOpenWorkspace }) {
  const { sessions, loading, error, refetch, count } = useUpcomingSessions()

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-gray-900">Today's Schedule</h1>
            {!loading && (
              <span className="bg-red-50 text-math-red text-xs font-semibold px-2.5 py-0.5 rounded-full border border-red-100">
                {count || sessions.length} Upcoming
              </span>
            )}
          </div>
          <p className="text-gray-500 text-sm">
            Upcoming sessions fetched live from your teacher schedule.
          </p>
        </div>

        <button
          onClick={() => refetch()}
          disabled={loading}
          className="flex items-center gap-2 text-xs font-medium text-gray-600 hover:text-math-red bg-white border border-gray-200 hover:border-math-red/30 px-3.5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 shadow-sm"
        >
          <i className={`fa-solid fa-arrows-rotate ${loading ? 'animate-spin' : ''}`}></i>
          <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-math-red rounded-r text-xs text-red-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-math-red text-sm"></i>
            <span>Failed to load upcoming sessions: {error}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl p-6 shadow-card border border-gray-100 animate-pulse h-64 flex flex-col justify-between"
            >
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl bg-gray-200"></div>
                <div className="w-16 h-5 rounded bg-gray-200"></div>
              </div>
              <div className="space-y-2">
                <div className="w-3/4 h-5 rounded bg-gray-200"></div>
                <div className="w-1/2 h-4 rounded bg-gray-200"></div>
              </div>
              <div className="w-full h-12 rounded-xl bg-gray-200"></div>
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
          <div className="w-16 h-16 bg-red-50 text-math-red rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
            <i className="fa-regular fa-calendar-xmark"></i>
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">No Upcoming Sessions</h3>
          <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
            You do not have any upcoming sessions scheduled at the moment.
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
          {sessions.map((session) => (
            <ScheduleCard key={session.id} session={session} onOpenWorkspace={onOpenWorkspace} />
          ))}
        </div>
      )}
    </div>
  )
}

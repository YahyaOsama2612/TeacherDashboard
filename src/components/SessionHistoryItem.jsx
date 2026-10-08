import StarRating from './StarRating.jsx'
import { useSessionRatings, toSatisfaction, RATING_MAX } from '../hooks/useSessionRatings'

export default function SessionHistoryItem({ session, onViewDetails, onOpenWorkspace }) {
  const { ratings, loading: ratingsLoading, error: ratingsError } = useSessionRatings(session.id)

  const title = session.title || session.lessons?.[0]?.name || session.name || 'Math Session'
  const date =
    session.date ||
    (session.sessionDate
      ? new Date(session.sessionDate).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
      : 'Recent')

  const sessionType = session.type || session.sessionRelationalType || 'Session'
  const typeColor = session.typeColor || 'bg-red-50 text-math-red'

  // بيانات حقيقية من الـ API بدل القيم الثابتة
  const avgRating = ratings?.average ?? 0
  const reviewCount = ratings?.totalRated ?? 0
  const hasRatings = reviewCount > 0
  const satisfaction = toSatisfaction(avgRating)

  // الحضور = الطلاب اللي قيّموا (لو متاحين) وإلا اسم الجلسة
  const toInitials = (name = '') =>
    name
      .split(/[\s@]+/)
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'ST'

  const attendees =
    session.attendees ||
    (ratings?.students?.length
      ? ratings.students.map((s) => ({
        initials: toInitials(s.student?.name),
        name: s.student?.name,
        color: 'bg-red-100 text-math-red',
      }))
      : session.name
        ? [{ initials: toInitials(session.name), name: session.name, color: 'bg-red-100 text-math-red' }]
        : [])

  return (
    <div
      className={`bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col lg:flex-row gap-8 items-start lg:items-center ${session.dimmed ? 'opacity-80' : ''
        }`}
    >
      {/* Session Info */}
      <div className="w-full lg:w-1/3">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${typeColor}`}>
            {sessionType}
          </span>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded">
            <i className="fa-solid fa-check text-math-success mr-1"></i> Completed
          </span>
        </div>
        <h3 className="font-bold text-gray-900 text-xl leading-tight">{title}</h3>
        <p className="text-sm text-gray-500 mt-2 font-medium">
          <i className="fa-regular fa-calendar-check mr-1.5"></i> {date}
        </p>

        {attendees.length > 0 && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs font-bold text-gray-400 uppercase">Attendees ({attendees.length})</span>
            <div className="flex -space-x-2">
              {attendees.map((a, i) => (
                <div
                  key={i}
                  title={a.name}
                  className={`w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold ${a.color}`}
                >
                  {a.initials}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="hidden lg:block w-px h-24 bg-gray-200"></div>

      {/* Session Rating */}
      <div className="w-full lg:w-2/3 flex flex-col sm:flex-row gap-6 sm:items-center justify-between bg-gray-50 border border-gray-200 rounded-xl p-5">
        <div>
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <i className="fa-solid fa-chart-pie text-gray-400"></i> Session Average Rating
          </div>

          {ratingsLoading ? (
            <div className="flex items-center gap-4 animate-pulse">
              <div className="w-14 h-8 bg-gray-200 rounded"></div>
              <div className="w-24 h-4 bg-gray-200 rounded"></div>
            </div>
          ) : ratingsError ? (
            <div className="text-xs text-red-700">
              <i className="fa-solid fa-circle-exclamation mr-1"></i> Couldn't load ratings
            </div>
          ) : hasRatings ? (
            <div className="flex items-center gap-4">
              <div className="flex items-end gap-1">
                <span className="text-3xl font-black text-gray-900 leading-none">{avgRating.toFixed(1)}</span>
                <span className="text-sm font-medium text-gray-400 mb-1">/{RATING_MAX}</span>
              </div>
              <div>
                <StarRating value={avgRating} />
                <div className="text-xs font-bold text-math-success mt-1">{satisfaction}% Satisfaction</div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <StarRating value={0} />
              <span className="text-sm font-medium text-gray-500">No ratings yet</span>
            </div>
          )}
        </div>

        <div className="w-full sm:w-auto text-right flex flex-col gap-2">
          {hasRatings && (
            <div className="text-[10px] text-gray-400 font-medium mb-3">
              Calculated from {reviewCount} student review{reviewCount > 1 ? 's' : ''}
            </div>
          )}
          {session.detailsAvailable !== false ? (
            <button
              onClick={onViewDetails}
              className="w-full sm:w-auto px-5 py-2.5 bg-white border-2 border-math-red text-math-red hover:bg-math-red hover:text-white font-bold rounded-lg text-sm transition-colors shadow-sm flex justify-center items-center gap-2 cursor-pointer"
            >
              <i className="fa-solid fa-magnifying-glass"></i> View Details
            </button>
          ) : (
            <button
              disabled
              className="w-full sm:w-auto px-5 py-2.5 bg-gray-100 border-2 border-gray-200 text-gray-400 font-bold rounded-lg text-sm cursor-not-allowed"
            >
              View Details
            </button>
          )}
          <button
            onClick={onOpenWorkspace}
            className="w-full sm:w-auto px-5 py-2.5 bg-math-red text-white hover:bg-math-red-hover font-bold rounded-lg text-sm transition-colors shadow-sm flex justify-center items-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-desktop"></i> Open Workspace
          </button>
        </div>
      </div>
    </div>
  )
}
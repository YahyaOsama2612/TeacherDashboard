import { formatSessionTime } from '../utils/sessionTime.js'

function formatSessionDate(sessionDate) {
  if (!sessionDate) return ''
  if (typeof sessionDate === 'string' && /^\d{4}-\d{2}-\d{2}/.test(sessionDate)) {
    const [year, month, day] = sessionDate.slice(0, 10).split('-')
    return `${Number(month)}/${Number(day)}/${year}`
  }
  try {
    return new Date(sessionDate).toLocaleDateString()
  } catch {
    return ''
  }
}

export default function ScheduleCard({ session, onOpenWorkspace }) {
  const isPrimary = session.primary || Boolean(session.sessionLink)
  const isBlue = session.accent === 'blue' || session.sessionRelationalType === 'Review'
  const iconWrapClass = isBlue ? 'bg-blue-50 text-math-blue' : 'bg-red-50 text-math-red'
  const badgeClass = isBlue ? 'text-blue-600 bg-blue-50' : 'text-math-red bg-red-50'
  const cardHoverClass = isBlue ? 'hover:border-blue-300' : 'hover:border-red-300'

  const title =
    session.title ||
    session.lessons?.[0]?.name ||
    session.name ||
    'Session'

  const courseName = session.lessons?.[0]?.course?.name

  const sessionType =
    session.type ||
    session.sessionRelationalType ||
    session.scheduleType ||
    'Session'

  const handleEnterWorkspace = () => {
    if (onOpenWorkspace) {
      onOpenWorkspace(session)
    } else if (session.sessionLink) {
      window.open(session.sessionLink, '_blank', 'noopener,noreferrer')
    }
  }

  const formattedDate = formatSessionDate(session.sessionDate)

  return (
    <div
      className={`bg-white rounded-2xl p-6 shadow-card border border-gray-100 flex flex-col transition-all hover:shadow-md ${cardHoverClass}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${iconWrapClass}`}>
          <i className={session.icon || 'fa-solid fa-chalkboard-user'}></i>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider ${badgeClass}`}>
          {sessionType}
        </span>
      </div>

      <h2 className="text-lg font-bold text-gray-900 mb-1 leading-snug">{title}</h2>

      {courseName && (
        <span className="inline-block text-xs font-semibold text-math-red mb-2 bg-red-50 px-2 py-0.5 rounded w-fit">
          {courseName}
        </span>
      )}

      <p className="text-sm text-gray-500 mb-6 flex items-center gap-1.5 flex-wrap">
        <i className="fa-regular fa-clock"></i>
        <span>{formatSessionTime(session, ' - ', 'Upcoming')}</span>
        {formattedDate && (
          <span className="text-xs text-gray-400 ml-1">
            ({formattedDate})
          </span>
        )}
      </p>

      <div className="mt-auto pt-2">
        <button
          onClick={handleEnterWorkspace}
          className={
            isPrimary
              ? 'w-full bg-math-red hover:bg-math-red-hover text-white font-medium py-3 rounded-xl shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2'
              : 'w-full bg-white border-2 border-math-red text-math-red hover:bg-math-red hover:text-white font-medium py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2'
          }
        >
          <i className="fa-solid fa-desktop text-xs"></i>
          <span>Open Workspace</span>
        </button>
      </div>
    </div>
  )
}

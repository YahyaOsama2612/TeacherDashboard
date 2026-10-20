import { useState } from 'react'
import StarRating from './StarRating.jsx'
import { useSessionRatings, toSatisfaction, RATING_MAX } from '../hooks/useSessionRatings'
import { formatSessionTime } from '../utils/sessionTime.js'

const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    : ''

function StudentRatingCard({ entry }) {
  const [open, setOpen] = useState(true)
  const student = entry.student || {}
  const questions = entry.questionRatings || []
  const initials =
    (student.name || 'ST')
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  const wasEdited = entry.updatedAt && entry.createdAt && entry.updatedAt !== entry.createdAt

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full p-4 flex items-center justify-between gap-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          {student.avatar ? (
            <img src={student.avatar} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-red-100 text-math-red flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <div className="font-bold text-gray-900 text-sm truncate">{student.name || 'Student'}</div>
            <div className="text-[11px] text-gray-500 truncate">
              {formatDateTime(entry.updatedAt || entry.createdAt)}
              {wasEdited && ' (edited)'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <StarRating value={entry.overallRating} />
          <span className="text-sm font-bold text-gray-900">
            {Number(entry.overallRating || 0).toFixed(1)}
            <span className="text-xs font-medium text-gray-400"> / {RATING_MAX}</span>
          </span>
          <i className={`fa-solid fa-chevron-down text-gray-400 text-xs transition-transform ${open ? 'rotate-180' : ''}`}></i>
        </div>
      </button>

      {open && (
        <div className="p-4 space-y-3 border-t border-gray-200">
          {questions.length > 0 && (
            <div className="space-y-2">
              {questions.map((q) => (
                <div key={q.id} className="p-3 rounded-lg border border-gray-100 bg-gray-50/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-900 break-words" dir="auto">
                        {q.questionTitle}
                      </div>
                      {q.category && (
                        <span className="inline-block mt-1 text-[10px] font-semibold text-gray-500 bg-white border border-gray-200 px-1.5 py-0.5 rounded capitalize">
                          {q.category}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StarRating value={q.rating} size="text-xs" />
                      <span className="text-xs font-bold text-gray-700">
                        {Number(q.rating || 0)}/{RATING_MAX}
                      </span>
                    </div>
                  </div>
                  {q.comment && (
                    <p className="mt-2 text-xs text-gray-600 bg-white border border-gray-100 rounded p-2" dir="auto">
                      {q.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          <div>
            <div className="text-xs font-semibold text-gray-500 mb-1">General comment</div>
            {entry.generalComment ? (
              <p className="text-sm text-gray-700 bg-red-50/50 border border-red-100 rounded-lg p-3" dir="auto">
                {entry.generalComment}
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic">No comment left.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function FeedbackModal({ isOpen, session, onClose, onOpenWorkspace }) {
  const { ratings, loading, error, refetch } = useSessionRatings(session?.id, {
    enabled: Boolean(isOpen && session?.id),
  })

  if (!isOpen || !session) return null

  const title = session.title || session.lessons?.[0]?.name || session.name || 'Session Details'
  const courseName = session.lessons?.[0]?.course?.name

  // بيانات الجلسة من الـ ratings API لو موجودة
  const apiSession = ratings?.session || {}
  const timeFrom = session.timeFrom || apiSession.timeFrom
  const timeTo = session.timeTo || apiSession.timeTo
  const sessionDate = session.sessionDate || apiSession.sessionDate

  const formatTime = () =>
    formatSessionTime(
      { ...session, timeFrom, timeTo, sessionDate },
      ' - '
    )

  const avgRating = ratings?.average ?? 0
  const totalRated = ratings?.totalRated ?? 0
  const students = ratings?.students ?? []
  const satisfaction = toSatisfaction(avgRating)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 backdrop-blur-sm fade-in p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-floating w-full max-w-2xl overflow-hidden border border-gray-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-math-red to-[#6b0f2a] px-6 py-5 text-white flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded font-semibold">
                {session.sessionRelationalType || session.scheduleType || 'Session'}
              </span>
              {courseName && (
                <span className="text-xs bg-white text-math-red px-2 py-0.5 rounded font-bold">{courseName}</span>
              )}
            </div>
            <h3 className="text-xl font-bold mt-1 text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center rounded-full text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
          >
            <i className="fa-solid fa-xmark text-lg"></i>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 bg-white space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
            <div>
              <span className="text-gray-400 font-semibold block uppercase">Session</span>
              <span className="font-bold text-gray-900 text-sm truncate block">
                {session.name || apiSession.name || 'Student'}
              </span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold block uppercase">Timing</span>
              <span className="font-semibold text-gray-900">{formatTime()}</span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold block uppercase">Date</span>
              <span className="font-semibold text-gray-900">
                {sessionDate ? new Date(sessionDate).toLocaleDateString() : 'N/A'}
              </span>
            </div>
          </div>

          {/* Lessons Section */}
          {session.lessons && session.lessons.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Lesson Information</h4>
              <div className="space-y-2">
                {session.lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{lesson.name}</div>
                      {lesson.chapter?.name && (
                        <div className="text-xs text-gray-500 mt-0.5">Chapter: {lesson.chapter.name}</div>
                      )}
                    </div>
                    {lesson.course?.name && (
                      <span className="text-xs font-semibold bg-white border border-gray-200 px-2 py-1 rounded text-gray-700">
                        {lesson.course.name}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ratings */}
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-20 bg-gray-100 rounded-xl"></div>
              <div className="h-28 bg-gray-100 rounded-xl"></div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border-l-4 border-math-red rounded-r text-xs text-red-800 flex items-center justify-between">
              <span>
                <i className="fa-solid fa-circle-exclamation text-math-red mr-2"></i>
                Failed to load ratings: {error}
              </span>
              <button onClick={refetch} className="underline font-semibold cursor-pointer ml-4">
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Session Evaluation</div>
                  <div className="flex items-center gap-3">
                    <StarRating value={avgRating} />
                    <span className="text-sm font-bold text-gray-900">
                      {totalRated > 0 ? `${avgRating.toFixed(1)} / ${RATING_MAX}` : 'No ratings yet'}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-1">
                    {totalRated} student{totalRated === 1 ? '' : 's'} rated this session
                  </div>
                </div>
                {totalRated > 0 && (
                  <span className="text-xs font-bold text-math-success bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
                    {satisfaction}% Satisfaction
                  </span>
                )}
              </div>

              {/* Per-student ratings */}
              {students.length > 0 ? (
                <div>
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Student Feedback</h4>
                  <div className="space-y-3">
                    {students.map((entry) => (
                      <StudentRatingCard key={entry.id} entry={entry} />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center border border-dashed border-gray-300 rounded-xl text-sm text-gray-500">
                  Students haven't rated this session yet.
                </div>
              )}
            </>
          )}

          {/* Quick Links */}
          {(session.sessionLink || session.materialLink) && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  onClose()
                  if (onOpenWorkspace) onOpenWorkspace(session)
                }}
                className="flex-1 text-center py-2.5 px-4 bg-math-red hover:bg-math-red-hover text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <i className="fa-solid fa-desktop"></i> Open Workspace
              </button>
              {session.materialLink && (
                <a
                  href={session.materialLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center py-2.5 px-4 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <i className="fa-solid fa-book-open"></i> Materials
                </a>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold rounded-lg text-xs transition-colors shadow-sm cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
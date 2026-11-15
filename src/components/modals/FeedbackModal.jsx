import { avgRating, attCounts } from '../../lib/sessions'
import { fmtLongDate, fmtTime, plural } from '../../lib/format'
import { Modal, ModalHeader, ProgramBadge, Stars, TypeBadge } from '../ui'
import { AttendancePills } from './AttendanceModal'
import ReviewCard from '../ReviewCard'

/** Ratings & feedback for one completed session. */
export default function FeedbackModal({ session: s, onClose }) {
  const a = avgRating(s)
  const withComments = s.reviews.filter((r) => r.comment).length
  const sorted = [...s.reviews].sort((x, y) => (y.comment ? 1 : 0) - (x.comment ? 1 : 0))

  return (
    <Modal onClose={onClose} labelledBy="fb-title" maxWidth="max-w-4xl">
      <ModalHeader
        id="fb-title"
        title={s.lesson}
        meta={`${fmtLongDate(s.date)} • ${fmtTime(s.start)} — ${fmtTime(s.end)} • ${plural(s.studentCount, 'student')}`}
        onClose={onClose}
      >
        <div className="flex flex-wrap gap-2 mb-2">
          <ProgramBadge program={s.program} />
          <TypeBadge type={s.type} />
          <span className="bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Completed</span>
        </div>
      </ModalHeader>
      <div className="p-6 overflow-y-auto">
        {s.reviews.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-10">No ratings yet — students rate after class.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="md:col-span-2 space-y-4">
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Session Rating</div>
                <div className="flex items-center gap-3">
                  <span className="text-5xl font-extrabold text-gray-900">{a.toFixed(1)}</span>
                  <div>
                    <Stars value={a} className="text-base" />
                    <p className="text-xs text-gray-500 mt-1">
                      {s.reviews.length} of {plural(s.studentCount, 'student')} rated{withComments ? ` • ${plural(withComments, 'comment')}` : ''}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Rating Breakdown</div>
                {[5, 4, 3, 2, 1].map((n) => {
                  const c = s.reviews.filter((r) => Math.round(r.stars) === n).length
                  return (
                    <div key={n} className="flex items-center gap-3 py-1">
                      <span className="text-xs font-bold w-8 text-gray-700">{n} <i className="fa-solid fa-star text-yellow-400 text-[10px]"></i></span>
                      <span className="flex-grow h-2 bg-white rounded-full overflow-hidden border border-gray-100">
                        <span className="block h-full bg-yellow-400 rounded-full" style={{ width: `${(c / s.reviews.length) * 100}%` }}></span>
                      </span>
                      <span className="text-xs font-bold text-gray-500 w-4 text-right">{c}</span>
                    </div>
                  )
                })}
              </div>
              {attCounts(s).marked > 0 && (
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Attendance</div>
                  <div className="flex flex-wrap gap-1.5"><AttendancePills session={s} /></div>
                </div>
              )}
            </div>
            <div className="md:col-span-3">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Student Feedback ({s.reviews.length})</div>
              <div className="space-y-3">{sorted.map((r) => <ReviewCard key={r.id} review={r} />)}</div>
            </div>
          </div>
        )}
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
        <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-white bg-math-red hover:bg-math-red-hover rounded-xl shadow-sm">Done</button>
      </div>
    </Modal>
  )
}

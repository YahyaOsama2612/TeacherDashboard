import { useNavigate } from 'react-router-dom'
import { useTeacherData } from '../context/TeacherDataContext'
import { typeOf, avgRating, canTakeAttendance, attCounts, noBalanceStudents } from '../lib/sessions'
import { fmtDate, fmtTime, plural, todayISO } from '../lib/format'
import { SMALL_BTN, StatusBadge, Stars } from './ui'
import { ATT, AttendancePills } from './modals/AttendanceModal'

const timeRange = (s) => `${fmtTime(s.start)} — ${fmtTime(s.end)}`

function StudentChips({ s }) {
  const empty = new Set(noBalanceStudents(s).map((st) => st.id))
  // students with no sessions left are shown first, so they are never hidden behind "+N"
  const ordered = [...s.students].sort((a, b) => Number(empty.has(b.id)) - Number(empty.has(a.id)))
  const shown = ordered.slice(0, 4)
  const more = s.students.length - shown.length
  const solo = s.students.length === 1
  if (!s.students.length) return <p className="text-xs text-gray-400">No students assigned yet</p>
  return (
    <div className="flex flex-wrap gap-2">
      {shown.map((st) => {
        const k = ATT[st.attendance] ? st.attendance : null
        const none = empty.has(st.id)
        const cls = none ? 'bg-red-50 text-red-700 ring-1 ring-red-200 font-semibold' : k ? `${ATT[k].chip} font-semibold` : solo ? 'bg-math-red/10 text-math-red font-semibold' : 'bg-gray-100 text-gray-700 font-medium'
        return (
          <span key={st.id} className={`${cls} text-xs px-2.5 py-1 rounded-md`} title={none ? '0 live sessions left — not paid for this session' : k ? ATT[k].label : undefined}>
            {none ? <i className="fa-solid fa-triangle-exclamation mr-1 text-[10px]"></i> : k && <i className={`fa-solid ${ATT[k].icon} mr-1 text-[10px]`}></i>}{st.name}
          </span>
        )
      })}
      {more > 0 && <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2.5 py-1 rounded-md">+{more}</span>}
    </div>
  )
}

/** "2 students have 0 sessions left" — so the teacher can tell admin before class. */
export function BalanceWarning({ s, className = 'mt-2' }) {
  const list = noBalanceStudents(s)
  if (!list.length) return null
  const names = list.map((st) => st.name)
  return (
    <div className={`${className} rounded-lg bg-red-50 border border-red-100 px-3 py-2 text-[11px] text-red-800`} role="note">
      <p className="font-bold"><i className="fa-solid fa-triangle-exclamation mr-1"></i>{list.length === 1 ? '1 student has' : `${list.length} students have`} 0 sessions left</p>
      <p className="mt-0.5">{names.slice(0, 3).join(', ')}{names.length > 3 ? ` +${names.length - 3} more` : ''} — they can&apos;t join by themselves. Ask the admin to renew before class; if they attend anyway, mark them attended and it&apos;s saved as Not paid.</p>
    </div>
  )
}

export function AttendanceLine({ s }) {
  if (s.status === 'cancelled') return null
  if (!canTakeAttendance(s)) return <p className="text-[11px] text-gray-400 mt-2"><i className="fa-regular fa-clock mr-1"></i>Attendance opens on the session day</p>
  if (!attCounts(s).marked) {
    return s.status === 'completed'
      ? <p className="text-[11px] font-semibold text-amber-600 mt-2"><i className="fa-solid fa-triangle-exclamation mr-1"></i>Attendance not taken yet</p>
      : <p className="text-[11px] font-semibold text-gray-400 mt-2"><i className="fa-solid fa-clipboard-list mr-1"></i>Attendance not marked yet</p>
  }
  return <div className="flex flex-wrap gap-1.5 mt-2"><AttendancePills session={s} /></div>
}

function MeetingBlock({ s }) {
  const { openModal } = useTeacherData()
  if (s.meeting) {
    return (
      <>
        <div className="flex items-center gap-2">
          <a href={s.meeting} target="_blank" rel="noopener noreferrer" className="flex-grow bg-blue-50 text-math-blue border border-blue-200 hover:bg-blue-100 font-semibold py-2.5 rounded-xl transition-colors flex justify-center items-center gap-2 text-sm">
            <i className="fa-solid fa-video"></i> Start Meeting
          </a>
          <button onClick={() => openModal('link', s.id)} className="w-10 h-10 shrink-0 rounded-xl border border-gray-200 text-gray-500 hover:text-math-blue hover:border-math-blue transition-colors" title="Change meeting link" aria-label="Change meeting link">
            <i className="fa-solid fa-pen text-xs"></i>
          </button>
        </div>
        <div className="text-[10px] text-math-success mt-1 text-center font-medium"><i className="fa-solid fa-check-circle mr-1"></i> Published to Student</div>
      </>
    )
  }
  return (
    <button onClick={() => openModal('link', s.id)} className="w-full border-2 border-dashed border-gray-300 text-gray-500 hover:text-math-blue hover:border-math-blue hover:bg-blue-50 font-medium py-2.5 rounded-xl transition-all flex justify-center items-center gap-2 text-sm group">
      <i className="fa-solid fa-link group-hover:scale-110 transition-transform"></i> Add Meeting Link
    </button>
  )
}

export function CancelRow({ s }) {
  const { cancelRequests, openModal } = useTeacherData()
  const c = cancelRequests.get(s.id)
  if (c && c.status === 'pending') {
    return <p className="text-[11px] text-amber-700 font-bold text-center mb-2"><i className="fa-solid fa-hourglass-half mr-1"></i> Cancellation requested — waiting for admin</p>
  }
  return (
    <>
      {c && c.status === 'rejected' && (
        <p className="text-[11px] text-gray-500 text-center mb-1"><i className="fa-solid fa-circle-info mr-1"></i> Admin kept this session{c.adminReply ? `: ${c.adminReply}` : ''}</p>
      )}
      <button onClick={() => openModal('cancel', s.id)} className="w-full text-xs font-bold text-gray-400 hover:text-red-600 mb-1 py-2.5 rounded-lg hover:bg-red-50">
        <i className="fa-solid fa-ban mr-1"></i> Request cancellation
      </button>
    </>
  )
}

function CardActions({ s }) {
  const { openModal } = useTeacherData()
  // PDFs and lesson videos stay open after class too (the After class panel sits below)
  return (
    <div className="grid grid-cols-2 gap-2 mb-3">
      <button onClick={() => openModal('attendance', s.id)} disabled={!canTakeAttendance(s)} title={canTakeAttendance(s) ? undefined : 'Attendance opens on the session day'} className={SMALL_BTN}>
        <i className="fa-solid fa-clipboard-user"></i> Attendance
      </button>
      <button onClick={() => openModal('materials', s.id)} className={SMALL_BTN}>
        <i className="fa-regular fa-eye"></i> Materials <span className="text-gray-400">{s.docs.length}</span>
      </button>
    </div>
  )
}

/** Completed sessions: what the teacher shared after class (handwritten PDF + recording), one line each. */
function AfterClassPanel({ s }) {
  const { openModal } = useTeacherData()
  const items = [
    ['fa-solid fa-file-pen', 'Notes PDF', !!s.raw.teacher_explanation_pdf],
    ['fa-solid fa-circle-play', 'Recording', !!s.raw.recordingLink],
  ]
  const shared = items.filter((x) => x[2]).length
  const done = shared === items.length
  return (
    <button
      type="button"
      onClick={() => openModal('afterclass', s.id)}
      className={`w-full text-left bg-white rounded-xl border ${done ? 'border-green-100' : 'border-amber-200'} p-3 mb-3 hover:border-math-red hover:shadow-sm transition-all group`}
      title="Share your handwritten PDF and the class recording"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5 min-w-0">
          <i className="fa-solid fa-flag-checkered"></i><span className="truncate">After class</span>
        </span>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${done ? 'bg-green-50 text-math-success' : 'bg-amber-50 text-amber-700'}`}>{shared}/{items.length} shared</span>
      </div>
      <div className="space-y-1.5">
        {items.map(([icon, label, ok]) => (
          <div key={label} className="flex items-center gap-2 text-sm min-w-0">
            <i className={`${icon} w-4 text-center ${ok ? 'text-math-success' : 'text-gray-300'}`}></i>
            <span className="font-medium text-gray-700 flex-grow min-w-0 truncate">{label}</span>
            <span className={`text-[11px] font-bold shrink-0 ${ok ? 'text-math-success' : 'text-amber-600'}`}>
              {ok ? <><i className="fa-solid fa-check mr-1"></i>Shared</> : 'Missing'}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2.5 pt-2.5 border-t border-gray-100 text-xs font-bold text-math-red flex items-center justify-center gap-1.5">
        <i className={`fa-solid ${done ? 'fa-pen' : 'fa-cloud-arrow-up'}`}></i>
        {done ? 'Edit notes & recording' : shared ? 'Add the missing one' : 'Add notes & recording'}
        <i className="fa-solid fa-arrow-right text-[10px] group-hover:translate-x-0.5 transition-transform"></i>
      </div>
    </button>
  )
}

export default function SessionCard({ s }) {
  const { nextSession, openModal } = useTeacherData()
  const navigate = useNavigate()
  const T = typeOf(s.type)
  const muted = s.status !== 'upcoming'
  const isNext = nextSession?.id === s.id

  const head = (
    <>
      <div className="flex justify-between items-start mb-3 gap-2">
        <div className={`w-11 h-11 rounded-xl ${T.iconBox} flex items-center justify-center text-xl shrink-0`}><i className={`fa-solid ${T.icon}`}></i></div>
        <StatusBadge s={s} isNext={isNext} />
      </div>
      <h2 className={`text-lg font-bold leading-snug ${muted ? 'text-gray-700' : 'text-gray-900'} mb-1`}>{T.label}</h2>
      <p className="text-sm text-gray-500 mb-4 flex items-center gap-2"><i className="fa-regular fa-clock"></i> {s.date === todayISO() ? '' : `${fmtDate(s.date)} • `}{timeRange(s)}</p>
      <div className={`${muted ? 'bg-white' : 'bg-gray-50'} rounded-xl p-3 mb-4 border border-gray-100`}>
        <div className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">{s.type === 'Exam' ? 'Assessment' : 'Lesson'}</div>
        <div className={`text-sm font-medium ${muted ? 'text-gray-700' : 'text-gray-900'} flex items-start gap-2`}>
          <i className="fa-regular fa-circle-check text-math-success mt-0.5"></i>
          <div>{s.lesson}<div className="text-xs text-gray-500 font-normal">{s.program} • {s.unit}</div></div>
        </div>
      </div>
    </>
  )
  const students = (
    <>
      <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Assigned {s.studentCount === 1 ? 'Student' : 'Students'} ({s.studentCount})</div>
      <StudentChips s={s} />
      <BalanceWarning s={s} />
      <AttendanceLine s={s} />
    </>
  )

  if (s.status === 'upcoming') {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100 flex flex-col hover:shadow-md transition-shadow">
        {head}
        <div className="mb-4 flex-grow">{students}<div className="mt-4"><MeetingBlock s={s} /></div></div>
        <CardActions s={s} />
        <CancelRow s={s} />
        <button
          onClick={() => navigate(`/workspace/${s.id}`)}
          className={`${isNext ? 'bg-math-red hover:bg-math-red-hover text-white py-3 shadow-sm' : `bg-white border-2 ${T.btn} hover:text-white py-2.5`} w-full font-medium rounded-xl transition-colors flex justify-center items-center gap-2 group`}
        >
          Enter Workspace <i className="fa-solid fa-arrow-right transform group-hover:translate-x-1 transition-transform"></i>
        </button>
      </div>
    )
  }

  if (s.status === 'completed') {
    const n = s.reviews.length
    const a = avgRating(s)
    return (
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 flex flex-col">
        {head}
        <div className="mb-4 flex-grow">{students}</div>
        <div className="bg-white rounded-xl p-3 mb-3 border border-gray-100 flex items-center justify-between gap-2">
          {n ? (
            <>
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Student Rating</div>
                <div className="flex items-center gap-2"><Stars value={a} className="text-sm" /><span className="text-sm font-bold text-gray-900">{a.toFixed(1)}</span></div>
              </div>
              <span className="text-xs text-gray-500">{plural(n, 'rating')}</span>
            </>
          ) : <span className="text-xs text-gray-500">No ratings yet — students rate after class.</span>}
        </div>
        <AfterClassPanel s={s} />
        <CardActions s={s} />
        {n > 0 && (
          <button onClick={() => openModal('feedback', s.id)} className="w-full bg-white border-2 border-math-success text-math-success hover:bg-math-success hover:text-white font-medium py-2.5 rounded-xl transition-colors flex justify-center items-center gap-2 mb-2">
            <i className="fa-solid fa-star"></i> View Ratings &amp; Feedback
          </button>
        )}
        <button
          onClick={() => navigate(`/workspace/${s.id}`)}
          className={`w-full bg-white border-2 ${T.btn} hover:text-white font-medium py-2.5 rounded-xl transition-colors flex justify-center items-center gap-2 group`}
        >
          Open Session <i className="fa-solid fa-arrow-right transform group-hover:translate-x-1 transition-transform"></i>
        </button>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200 flex flex-col opacity-90">
      {head}
      <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 text-xs text-red-800">
        <div className="font-bold mb-0.5 flex items-center gap-1.5"><i className="fa-solid fa-circle-info"></i> Cancelled by {s.cancel?.by}</div>
        {s.cancel?.reason}
      </div>
      <div className="mb-4 flex-grow">{students}</div>
      <button disabled className="w-full bg-gray-200 text-gray-500 font-medium py-3 rounded-xl cursor-not-allowed">Session Cancelled</button>
    </div>
  )
}

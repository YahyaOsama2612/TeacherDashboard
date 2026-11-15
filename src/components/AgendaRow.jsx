import { useNavigate } from 'react-router-dom'
import { useTeacherData } from '../context/TeacherDataContext'
import { typeOf, avgRating, canTakeAttendance, durMin } from '../lib/sessions'
import { fmtDur, fmtTime, plural } from '../lib/format'
import { ProgramBadge, StatusBadge, Stars, TypeBadge } from './ui'

/** One compact row of the dashboard's day schedule. */
export default function AgendaRow({ s }) {
  const { nextSession, cancelRequests, openModal } = useTeacherData()
  const navigate = useNavigate()
  const T = typeOf(s.type)
  const off = s.status === 'cancelled'
  const n = s.reviews.length
  const a = avgRating(s)
  const pendingCancel = cancelRequests.get(s.id)?.status === 'pending'

  let actions = null
  if (s.status === 'upcoming') {
    actions = (
      <>
        {s.meeting
          ? <a href={s.meeting} target="_blank" rel="noopener noreferrer" className="t-ico" title="Start meeting" aria-label="Start meeting"><i className="fa-solid fa-video"></i></a>
          : <button onClick={() => openModal('link', s.id)} className="t-ico" title="Add meeting link" aria-label="Add meeting link"><i className="fa-solid fa-link"></i></button>}
        <button onClick={() => openModal('materials', s.id)} className="t-ico" title={`Materials (${s.docs.length})`} aria-label="Materials"><i className="fa-regular fa-eye"></i></button>
        <button onClick={() => openModal('attendance', s.id)} disabled={!canTakeAttendance(s)} className="t-ico" title={canTakeAttendance(s) ? 'Attendance' : 'Attendance opens on the session day'} aria-label="Attendance"><i className="fa-solid fa-clipboard-user"></i></button>
        {pendingCancel
          ? <span className="t-ico" title="Cancellation requested — waiting for admin" style={{ color: '#b45309', borderColor: '#fde68a', background: '#fffbeb' }}><i className="fa-solid fa-hourglass-half"></i></span>
          : <button onClick={() => openModal('cancel', s.id)} className="t-ico" title="Request cancellation" aria-label="Request cancellation"><i className="fa-solid fa-ban"></i></button>}
        <button onClick={() => navigate(`/workspace/${s.id}`)} className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[10px] bg-math-red hover:bg-math-red-hover text-white text-xs font-bold">Open <i className="fa-solid fa-arrow-right text-[10px]"></i></button>
      </>
    )
  } else if (s.status === 'completed') {
    actions = (
      <>
        {n > 0 && <span className="hidden sm:flex items-center gap-1.5 mr-1"><Stars value={a} /><b className="text-sm text-gray-900">{a.toFixed(1)}</b></span>}
        <button onClick={() => openModal('attendance', s.id)} className="t-ico" title="Attendance" aria-label="Attendance"><i className="fa-solid fa-clipboard-user"></i></button>
        <button onClick={() => openModal('materials', s.id)} className="t-ico" title="Materials" aria-label="Materials"><i className="fa-regular fa-eye"></i></button>
        {n > 0 && <button onClick={() => openModal('feedback', s.id)} className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-[10px] border border-green-200 bg-green-50 text-math-success text-xs font-bold hover:bg-green-100"><i className="fa-solid fa-star text-[10px]"></i> Feedback</button>}
      </>
    )
  }

  return (
    <div className={`t-row flex flex-wrap sm:flex-nowrap items-start sm:items-center gap-x-4 gap-y-3 px-5 py-4 border-t border-gray-100 first:border-0 ${off ? 'bg-gray-50/60' : ''}`}>
      <div className="w-[72px] shrink-0 sm:text-right">
        <div className={`text-sm font-bold ${off ? 'text-gray-400' : 'text-gray-900'}`}>{fmtTime(s.start)}</div>
        <div className="text-[11px] text-gray-400">{fmtDur(durMin(s))}</div>
      </div>
      <span className={`w-1 self-stretch rounded-full ${off ? 'bg-gray-300' : T.bar} shrink-0 hidden sm:block`}></span>
      <div className="min-w-0 flex-1 basis-[180px]">
        <div className="flex flex-wrap items-center gap-1.5 mb-1">
          <ProgramBadge program={s.program} /><TypeBadge type={s.type} /><StatusBadge s={s} isNext={nextSession?.id === s.id} />
        </div>
        <p className={`font-bold ${off ? 'text-gray-400 line-through' : 'text-gray-900'} truncate`}>{s.lesson}</p>
        <p className="text-xs text-gray-500 truncate">
          {s.unit} · {plural(s.studentCount, 'student')}
          {off && s.cancel && <> · <span className="text-red-600">Cancelled by {s.cancel.by}{s.cancel.reason ? `: ${s.cancel.reason}` : ''}</span></>}
        </p>
      </div>
      {actions && <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto pl-[88px] sm:pl-0">{actions}</div>}
    </div>
  )
}

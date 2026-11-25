import { useState } from 'react'
import { useTeacherData } from '../../context/TeacherDataContext'
import { attCounts } from '../../lib/sessions'
import { plural, relDay, fmtTime } from '../../lib/format'
import { Avatar, Modal, ModalHeader } from '../ui'

export const ATT = {
  present: { label: 'Attended', icon: 'fa-check', on: 'bg-math-success text-white border-math-success', chip: 'bg-green-50 text-green-700' },
  absent: { label: 'Absent', icon: 'fa-xmark', on: 'bg-red-600 text-white border-red-600', chip: 'bg-red-50 text-red-700' },
}
const ATT_KEYS = Object.keys(ATT)

export function AttendancePills({ session, record }) {
  const c = attCounts(session, record)
  return (
    <>
      {ATT_KEYS.filter((k) => c[k]).map((k) => (
        <span key={k} className={`${ATT[k].chip} text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap`}>
          <i className={`fa-solid ${ATT[k].icon} mr-1`}></i>{c[k]} {ATT[k].label}
        </span>
      ))}
      {c.marked < session.students.length && (
        <span className="bg-gray-100 text-gray-500 text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap">{session.students.length - c.marked} not marked</span>
      )}
    </>
  )
}

export default function AttendanceModal({ session, onClose }) {
  const { saveAttendance, showToast } = useTeacherData()
  const [draft, setDraft] = useState(() =>
    Object.fromEntries(session.students.filter((s) => ATT[s.attendance]).map((s) => [s.id, s.attendance])),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const set = (id, k) => setDraft((d) => {
    const next = { ...d }
    if (next[id] === k) delete next[id]
    else next[id] = k
    return next
  })
  const markAll = (k) => setDraft(Object.fromEntries(session.students.map((s) => [s.id, k])))

  const save = async () => {
    if (!Object.keys(draft).length) { setError('Mark at least one student.'); return }
    setSaving(true)
    setError('')
    try {
      const { unpaidCount } = await saveAttendance(session.id, draft)
      const c = attCounts(session, draft)
      showToast(`Attendance saved — ${c.present} attended, ${c.absent} absent${unpaidCount ? ` (${unpaidCount} not paid: no sessions left)` : ''}`)
      onClose()
    } catch (err) {
      setError(err?.message || 'Could not save attendance.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="att-title" maxWidth="max-w-2xl" z="z-[110]">
      <ModalHeader
        id="att-title"
        title="Mark Attendance"
        icon="fa-solid fa-clipboard-user"
        meta={`${session.lesson} • ${relDay(session.date)}, ${fmtTime(session.start)} — ${fmtTime(session.end)} • ${plural(session.students.length, 'student')}`}
        onClose={onClose}
      />
      <div className="px-6 py-3 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap gap-1.5"><AttendancePills session={session} record={draft} /></div>
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
          Mark all:
          <button onClick={() => markAll('present')} className="px-2.5 py-1 rounded-lg border border-gray-200 hover:border-math-success hover:text-math-success">Attended</button>
          <button onClick={() => markAll('absent')} className="px-2.5 py-1 rounded-lg border border-gray-200 hover:border-red-600 hover:text-red-600">Absent</button>
        </div>
      </div>
      <div className="p-4 sm:p-6 overflow-y-auto space-y-2">
        {session.students.length === 0 && <p className="text-sm text-gray-500 text-center py-6">No students are assigned to this session yet.</p>}
        {session.students.map((st) => {
          const v = draft[st.id]
          return (
            <div key={st.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border border-gray-100 ${v ? 'bg-white' : 'bg-gray-50/60'}`}>
              <div className="flex items-center gap-3 min-w-0">
                <Avatar name={st.name} />
                <span className="text-sm font-bold text-gray-900 truncate">{st.name}</span>
                {st.chargeStatus === 'unpaid' && (
                  <span className="shrink-0 bg-amber-50 text-amber-700 text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap" title="Marked attended while the student had no live sessions left">
                    <i className="fa-solid fa-circle-exclamation mr-1"></i>Not paid
                  </span>
                )}
                {!st.chargeStatus && st.liveBalance === 0 && (
                  <span className="shrink-0 bg-red-50 text-red-700 text-[11px] font-bold px-2 py-0.5 rounded-md whitespace-nowrap" title="This student has no live sessions left. You can still mark them attended — it will be recorded as Not paid. Tell the admin so they can renew.">
                    <i className="fa-solid fa-triangle-exclamation mr-1"></i>0 sessions left
                  </span>
                )}
              </div>
              <div className="flex gap-1.5" role="group" aria-label={`Attendance for ${st.name}`}>
                {ATT_KEYS.map((k) => (
                  <button
                    key={k}
                    onClick={() => set(st.id, k)}
                    aria-pressed={v === k}
                    className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 ${v === k ? ATT[k].on : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'}`}
                  >
                    <i className={`fa-solid ${ATT[k].icon}`}></i>{ATT[k].label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
        <p className="text-[11px] text-gray-400 pt-2">
          <i className="fa-solid fa-circle-info mr-1"></i>
          Marking a student as attended uses one live session from their package (once per session) and unlocks the lesson content for them.
          A student with no sessions left is still marked attended, flagged as “Not paid”.
        </p>
        {error && <p className="text-xs font-semibold text-red-600" role="alert">{error}</p>}
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
        <button onClick={onClose} className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-xl">Cancel</button>
        <button onClick={save} disabled={saving} className="px-5 py-2.5 text-sm font-bold text-white bg-math-red hover:bg-math-red-hover rounded-xl shadow-sm flex items-center gap-2 disabled:opacity-60">
          <i className={`fa-solid ${saving ? 'fa-circle-notch animate-spin' : 'fa-check'}`}></i> Save Attendance
        </button>
      </div>
    </Modal>
  )
}

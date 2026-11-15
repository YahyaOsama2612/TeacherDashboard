import { useState } from 'react'
import { useTeacherData } from '../../context/TeacherDataContext'
import { fmtDate, fmtTime, plural } from '../../lib/format'
import { FIELD, Modal } from '../ui'

/** Ask admin to cancel one session. Admin answers it from the admin dashboard. */
export default function CancelRequestModal({ session: s, onClose }) {
  const { requestCancellation, showToast } = useTeacherData()
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const who = s.students.length > 4 ? plural(s.students.length, 'student') : s.students.map((x) => x.name).join(', ') || 'No students yet'

  const send = async () => {
    if (reason.trim().length < 3) { setError('Add a reason so the admin can review it.'); return }
    setSending(true)
    try {
      await requestCancellation(s.id, reason.trim())
      showToast('Cancellation request sent to admin', 'fa-paper-plane')
      onClose()
    } catch (err) {
      setError(err?.message || 'Could not send the request.')
    } finally {
      setSending(false)
    }
  }

  return (
    <Modal onClose={onClose} labelledBy="tc-title" maxWidth="max-w-md" z="z-[130]">
      <div className="p-6 overflow-y-auto">
        <h3 id="tc-title" className="text-lg font-bold text-gray-900 flex items-center gap-2"><i className="fa-solid fa-ban text-red-600"></i> Request cancellation</h3>
        <p className="text-sm text-gray-500 mt-1">{s.lesson} · {fmtDate(s.date)}, {fmtTime(s.start)} — {fmtTime(s.end)}</p>
        <p className="text-xs text-gray-500 mt-1">Students: <b className="text-gray-700">{who}</b></p>
        <label className="block mt-4">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</span>
          <textarea autoFocus rows={3} value={reason} onChange={(e) => { setReason(e.target.value); setError('') }} placeholder="Why should this session be cancelled?" className={FIELD}></textarea>
        </label>
        {error && <p className="text-xs font-semibold text-red-600 mt-2" role="alert">{error}</p>}
        <p className="text-[11px] text-gray-400 mt-2">The session stays booked until the admin approves.</p>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-600">Keep session</button>
          <button onClick={send} disabled={sending} className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60">
            {sending ? 'Sending…' : 'Send to admin'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

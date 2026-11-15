import { useState } from 'react'
import { useTeacherData } from '../context/TeacherDataContext'
import { FIELD, PillBadge } from '../components/ui'
import { fmtLongDate, fmtStamp, fmtTime, minutes, TIME_SLOTS, todayISO } from '../lib/format'

const REQ_STYLE = {
  accepted: { label: 'ACCEPTED', badge: 'text-math-success bg-green-50 border-green-100', icon: 'fa-solid fa-check text-[10px]', border: 'border-l-math-success' },
  rejected: { label: 'DECLINED', badge: 'text-red-600 bg-red-50 border-red-100', icon: 'fa-solid fa-xmark text-[10px]', border: 'border-l-red-500' },
  pending: { label: 'IN PROCESS', badge: 'text-yellow-600 bg-yellow-50 border-yellow-100', icon: 'fa-solid fa-hourglass-half text-[10px]', border: 'border-l-yellow-400' },
}

function RequestCard({ r }) {
  const { withdrawRequest, showToast } = useTeacherData()
  const st = REQ_STYLE[r.status] || REQ_STYLE.pending
  const date = r.type === 'cancellation' ? r.sessionDate : r.requestDate
  const from = r.type === 'cancellation' ? r.sessionTimeFrom : r.timeFrom
  const to = r.type === 'cancellation' ? r.sessionTimeTo : r.timeTo

  const withdraw = async () => {
    try {
      await withdrawRequest(r.id)
      showToast('Request withdrawn', 'fa-rotate-left')
    } catch (err) {
      showToast(err?.message || 'Could not withdraw the request', 'fa-circle-exclamation')
    }
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 border-l-4 ${st.border} shadow-card p-5`}>
      {r.type === 'cancellation'
        ? <p className="text-[11px] font-extrabold uppercase tracking-wider text-red-600 mb-1"><i className="fa-solid fa-ban mr-1"></i> Cancel session · {r.sessionName || 'Session'}</p>
        : <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-400 mb-1">Cover request</p>}
      <div className="flex justify-between items-start gap-3 flex-wrap mb-2">
        <div className="font-bold text-gray-900 flex items-center gap-2"><i className="fa-regular fa-calendar text-math-red"></i> {date ? fmtLongDate(date) : '—'}</div>
        <PillBadge cls={st.badge} icon={st.icon}>{st.label}</PillBadge>
      </div>
      <p className="text-sm text-gray-600 flex items-center gap-2"><i className="fa-regular fa-clock text-gray-400"></i> {from ? fmtTime(from) : '—'} — {to ? fmtTime(to) : '—'}</p>
      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 mt-3 break-words">{r.reason}</p>
      {r.status !== 'pending' && (r.adminReply || r.coverTeacherName) && (
        <div className={`mt-3 rounded-lg border ${r.status === 'accepted' ? 'border-green-100 bg-green-50/60' : 'border-red-100 bg-red-50/60'} px-3 py-2 text-sm`}>
          <p className={`text-[10px] font-extrabold uppercase tracking-wider ${r.status === 'accepted' ? 'text-math-success' : 'text-red-600'} mb-0.5`}>Admin reply</p>
          {r.coverTeacherName && <p className="text-gray-800"><i className="fa-solid fa-user-check text-math-success mr-1"></i> Cover teacher: <b>{r.coverTeacherName}</b></p>}
          {r.adminReply && <p className="text-gray-600">{r.adminReply}</p>}
        </div>
      )}
      <div className="flex items-center justify-between gap-3 mt-2">
        <p className="text-[11px] text-gray-400">Submitted {fmtStamp(r.createdAt)}{r.respondedAt ? ` · answered ${fmtStamp(r.respondedAt)}` : ''}</p>
        {r.status === 'pending' && <button onClick={withdraw} className="text-[11px] font-bold text-gray-400 hover:text-red-600">Withdraw</button>}
      </div>
    </div>
  )
}

export default function RequestsPage() {
  const { requests, requestCover, showToast } = useTeacherData()
  const [date, setDate] = useState('')
  const [from, setFrom] = useState('17:00')
  const [to, setTo] = useState('18:30')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const fromSlots = TIME_SLOTS.slice(0, -1)
  const toSlots = TIME_SLOTS.filter((t) => minutes(t) > minutes(from))

  const changeFrom = (value) => {
    setFrom(value)
    if (minutes(to) <= minutes(value)) setTo(TIME_SLOTS.find((t) => minutes(t) > minutes(value)) || '24:00')
  }

  const submit = async () => {
    if (!date) return setError('Pick the date you need cover for.')
    if (date < todayISO()) return setError('Pick today or a future date.')
    if (reason.trim().length < 3) return setError('Add a reason so admin can review the request.')
    setError('')
    setSending(true)
    try {
      // The backend stores TIME values; midnight is sent as 23:59.
      await requestCover({ requestDate: date, timeFrom: from, timeTo: to === '24:00' ? '23:59' : to, reason: reason.trim() })
      setReason('')
      showToast('Cover request sent to admin', 'fa-paper-plane')
    } catch (err) {
      setError(err?.message || 'Could not send the request.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section>
      <div className="mb-5">
        <h1 className="t-h1">Cover Requests</h1>
        <p className="t-sub">Need someone to cover a slot — for example an absence from 5–6:30 PM? Send it to admin and track the decision here.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-gray-200 shadow-card lg:sticky lg:top-24">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><i className="fa-solid fa-paper-plane text-math-red"></i> New Request</h3>
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Date</span>
              <input type="date" value={date} min={todayISO()} onChange={(e) => setDate(e.target.value)} className={FIELD} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">From</span>
                <select value={from} onChange={(e) => changeFrom(e.target.value)} className={FIELD.replace('px-4', 'px-3')}>
                  {fromSlots.map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">To</span>
                <select value={to} onChange={(e) => setTo(e.target.value)} className={FIELD.replace('px-4', 'px-3')}>
                  {toSlots.map((t) => <option key={t} value={t}>{fmtTime(t)}</option>)}
                </select>
              </label>
            </div>
            <label className="block">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reason</span>
              <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why do you need cover for this slot?" className={`${FIELD} resize-y`}></textarea>
            </label>
            {error && <p className="text-xs font-semibold text-red-600" role="alert">{error}</p>}
            <button onClick={submit} disabled={sending} className="w-full bg-math-red hover:bg-math-red-hover text-white font-bold py-3 rounded-xl shadow-sm flex justify-center items-center gap-2 transition-colors disabled:opacity-60">
              <i className={`fa-solid ${sending ? 'fa-circle-notch animate-spin' : 'fa-paper-plane'}`}></i> Send Request
            </button>
          </div>
        </div>
        <div className="lg:col-span-3">
          <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wider">Your Requests</h3>
          <div className="space-y-3">
            {requests.length
              ? requests.map((r) => <RequestCard key={r.id} r={r} />)
              : <p className="text-sm text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">No requests yet. Cover and cancellation requests you send appear here with the admin's answer.</p>}
          </div>
        </div>
      </div>
    </section>
  )
}

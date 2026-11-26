import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTeacherData } from '../context/TeacherDataContext'
import { typeOf, avgOf, canTakeAttendance, durMin, byKey } from '../lib/sessions'
import {
  addDays, DOW, firstName, fmtDate, fmtDur, fmtLongDate, fmtTime, initials, iso, parseISO, plural, relDay,
  startOfToday, todayISO, tomorrowISO,
} from '../lib/format'
import { Avatar, SMALL_BTN, Stars } from '../components/ui'
import AgendaRow from '../components/AgendaRow'
import { BalanceWarning } from '../components/SessionCard'

function AvatarStack({ names, max = 4 }) {
  const shown = names.slice(0, max)
  const more = names.length - shown.length
  return (
    <span className="flex -space-x-2">
      {shown.map((n, i) => (
        <span key={i} className="w-8 h-8 rounded-full bg-white text-math-red text-[11px] font-extrabold flex items-center justify-center ring-2 ring-[#9f1414]" title={n}>{initials(n)}</span>
      ))}
      {more > 0 && <span className="w-8 h-8 rounded-full bg-white/20 text-white text-[11px] font-bold flex items-center justify-center ring-2 ring-[#9f1414]">+{more}</span>}
    </span>
  )
}

function NextUp({ dayISO, dayLabel }) {
  const { sessions, openModal } = useTeacherData()
  const navigate = useNavigate()
  const up = sessions.filter((s) => s.status === 'upcoming' && s.date === dayISO).sort(byKey)[0]

  if (!up) {
    const later = sessions.filter((s) => s.status === 'upcoming' && s.date > dayISO).sort(byKey)[0]
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-card p-5 flex flex-wrap items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-green-50 text-math-success flex items-center justify-center text-lg shrink-0"><i className="fa-solid fa-mug-hot"></i></div>
        <div className="flex-grow min-w-0">
          <p className="font-bold text-gray-900">No more sessions {dayLabel}</p>
          <p className="text-sm text-gray-500">
            {later ? <>Next: <b className="text-gray-700">{later.lesson}</b> · {relDay(later.date)}, {fmtTime(later.start)}</> : 'Nothing else is scheduled yet.'}
          </p>
        </div>
        {later && <button onClick={() => navigate(`/workspace/${later.id}`)} className={SMALL_BTN}>Prepare <i className="fa-solid fa-arrow-right"></i></button>}
      </div>
    )
  }

  const T = typeOf(up.type)
  const n = up.studentCount
  const who = n === 1 && up.students[0] ? up.students[0].name : plural(n, 'student')
  return (
    <div className="t-hero rounded-2xl text-white shadow-xl relative overflow-hidden">
      <div className="absolute -right-10 -top-16 w-64 h-64 rounded-full bg-white/10"></div>
      <div className="absolute right-10 -bottom-20 w-44 h-44 rounded-full bg-white/5"></div>
      <div className="relative p-5 sm:p-6 flex flex-col md:flex-row gap-5 md:items-center">
        <div className="flex-grow min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 bg-white text-math-red text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-math-red animate-pulse"></span> Up next</span>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/15 px-2 py-1 rounded-md">{up.program}</span>
            <span className="text-[11px] font-bold uppercase tracking-wider bg-white/15 px-2 py-1 rounded-md"><i className={`fa-solid ${T.icon} mr-1`}></i>{T.label}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold leading-tight">{up.lesson}</h2>
          <p className="text-white/75 text-sm mt-1">{up.unit} · {who}</p>
          <div className="flex items-center gap-3 mt-4">
            {up.students.length > 0 && <AvatarStack names={up.students.map((s) => s.name)} />}
            <span className="text-xs text-white/80">
              {up.meeting
                ? <><i className="fa-solid fa-circle-check mr-1"></i>Meeting link sent to students</>
                : <><i className="fa-solid fa-triangle-exclamation mr-1"></i>No meeting link yet</>}
            </span>
          </div>
          <BalanceWarning s={up} className="mt-4" />
          <div className="flex flex-wrap gap-2 mt-5">
            <button onClick={() => navigate(`/workspace/${up.id}`)} className="t-hero-btn solid">Enter Workspace <i className="fa-solid fa-arrow-right"></i></button>
            {up.meeting
              ? <a href={up.meeting} target="_blank" rel="noopener noreferrer" className="t-hero-btn ghost"><i className="fa-solid fa-video"></i> Start meeting</a>
              : <button onClick={() => openModal('link', up.id)} className="t-hero-btn ghost"><i className="fa-solid fa-link"></i> Add meeting link</button>}
            <button onClick={() => openModal('materials', up.id)} className="t-hero-btn ghost"><i className="fa-regular fa-eye"></i> Materials ({up.docs.length})</button>
            <button onClick={() => openModal('attendance', up.id)} disabled={!canTakeAttendance(up)} title={canTakeAttendance(up) ? undefined : 'Attendance opens on the session day'} className="t-hero-btn ghost"><i className="fa-solid fa-clipboard-user"></i> Attendance</button>
          </div>
        </div>
        <div className="order-first md:order-none flex md:block items-baseline gap-2 md:text-right shrink-0 md:pl-6 md:border-l border-white/20">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">{relDay(up.date)}</p>
          <p className="text-3xl sm:text-4xl font-extrabold leading-none mt-1">{fmtTime(up.start)}</p>
          <p className="text-sm text-white/75 mt-1">until {fmtTime(up.end)} · {fmtDur(durMin(up))}</p>
        </div>
      </div>
    </div>
  )
}

function WeekChart({ sessions }) {
  const today = startOfToday()
  const todayStr = todayISO()
  const start = addDays(today, -today.getDay())
  const days = [...Array(7)].map((_, i) => iso(addDays(start, i)))
  const counts = days.map((d) => sessions.filter((s) => s.date === d && s.status !== 'cancelled').length)
  const max = Math.max(1, ...counts)
  return (
    <>
      <div className="flex items-end justify-between gap-2 h-40" role="img" aria-label={days.map((d, i) => `${DOW[parseISO(d).getDay()]} ${counts[i]}`).join(', ')}>
        {days.map((d, i) => (
          <div key={d} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
            <span className={`text-xs font-bold ${d === todayStr ? 'text-math-red' : 'text-gray-700'}`}>{counts[i]}</span>
            <div className={`w-full max-w-[36px] rounded-t-lg ${d === todayStr ? 'bg-math-red' : d < todayStr ? 'bg-gray-300' : 'bg-math-red/30'}`} style={{ height: `${Math.round((counts[i] / max) * 96) + 4}px` }}></div>
            <span className={`text-[11px] font-semibold ${d === todayStr ? 'text-math-red' : 'text-gray-400'}`}>{DOW[parseISO(d).getDay()]}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-5 text-[11px] text-gray-500 font-medium">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-gray-300"></span>Done</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-math-red"></span>Today</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-math-red/30"></span>Coming up</span>
      </div>
    </>
  )
}

export default function DashboardPage() {
  const { sessions, profile, pendingRequests, openModal } = useTeacherData()
  const navigate = useNavigate()
  const [day, setDay] = useState('today')
  const dayISO = day === 'today' ? todayISO() : tomorrowISO()
  const active = (d) => sessions.filter((s) => s.date === d && s.status !== 'cancelled').length
  const list = sessions.filter((s) => s.date === dayISO)
  const allReviews = sessions.flatMap((s) => s.reviews)
  const weekAhead = iso(addDays(startOfToday(), 7))
  const month = todayISO().slice(0, 7)

  const stats = [
    { icon: 'fa-calendar-day', box: 'bg-red-50 text-math-red', n: active(todayISO()), label: "Today's sessions", go: '/sessions?status=upcoming&when=today' },
    { icon: 'fa-calendar-week', box: 'bg-blue-50 text-math-blue', n: sessions.filter((s) => s.status === 'upcoming' && s.date <= weekAhead).length, label: 'Upcoming, next 7 days', go: '/sessions?status=upcoming&when=all' },
    { icon: 'fa-circle-check', box: 'bg-green-50 text-math-success', n: sessions.filter((s) => s.status === 'completed' && s.date.slice(0, 7) === month).length, label: 'Completed this month', go: '/sessions?status=completed&when=all' },
    { icon: 'fa-star', box: 'bg-yellow-50 text-yellow-500', n: avgOf(allReviews).toFixed(1), label: `Avg rating · ${plural(allReviews.length, 'review')}`, go: '/ratings' },
    { icon: 'fa-envelope-open-text', box: 'bg-orange-50 text-math-orange', n: pendingRequests, label: 'Pending requests', go: '/requests' },
  ]

  const latest = sessions
    .filter((s) => s.status === 'completed')
    .slice()
    .reverse()
    .flatMap((s) => s.reviews.filter((r) => r.comment).map((r) => ({ s, r })))
    .slice(0, 4)

  return (
    <section>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-5 gap-4">
        <div>
          <p className="text-sm font-semibold text-math-red mb-1">
            Welcome back, {firstName(profile?.name || 'Teacher')} <span className="text-gray-400 font-medium lg:hidden">· {fmtDate(todayISO())}</span>
          </p>
          <h1 className="t-h1">{day === 'today' ? "Today's Teaching Schedule" : "Tomorrow's Teaching Schedule"}</h1>
          <p className="t-sub">You have {plural(active(dayISO), 'session')} {day}, {fmtDate(dayISO)}.</p>
        </div>
        <div className="bg-white rounded-lg p-1 border border-gray-200 shadow-sm flex" role="group" aria-label="Schedule day">
          {[['today', todayISO(), 'Today'], ['tomorrow', tomorrowISO(), 'Tomorrow']].map(([key, d, label]) => (
            <button key={key} onClick={() => setDay(key)} aria-pressed={day === key} className={`px-4 py-2 text-sm font-medium rounded-md ${day === key ? 'bg-math-red text-white shadow' : 'text-gray-600 hover:bg-gray-50'}`}>
              {label} ({active(d)})
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 mb-5 [&>*:last-child]:col-span-2 md:[&>*:last-child]:col-span-1">
        {stats.map((s) => (
          <button key={s.label} onClick={() => navigate(s.go)} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-card text-left hover:border-math-red hover:shadow-md transition-all group min-w-0">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl ${s.box} flex items-center justify-center shrink-0`}><i className={`fa-solid ${s.icon}`}></i></div>
              <div className="min-w-0">
                <div className="text-2xl font-extrabold text-gray-900 leading-none">{s.n}</div>
                <div className="text-xs text-gray-500 font-medium mt-1 leading-snug group-hover:text-math-red">{s.label}</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5 min-w-0">
          <NextUp dayISO={dayISO} dayLabel={day} />
          <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><i className="fa-regular fa-calendar-days text-math-red"></i> {day === 'today' ? "Today's schedule" : "Tomorrow's schedule"}</h3>
                <p className="text-xs text-gray-400">{fmtLongDate(dayISO)} · {plural(list.length, 'session')}</p>
              </div>
              <button onClick={() => navigate('/sessions')} className="text-xs font-bold text-math-red hover:underline">All sessions <i className="fa-solid fa-arrow-right ml-1"></i></button>
            </div>
            {list.length ? list.map((s) => <AgendaRow key={s.id} s={s} />) : (
              <div className="py-12 text-center">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mb-3"><i className="fa-regular fa-calendar-xmark"></i></div>
                <p className="font-bold text-gray-800">No sessions {day}</p>
                <p className="text-sm text-gray-500">Sessions the admin assigns to you show up here.</p>
              </div>
            )}
          </div>
        </div>
        <div className="space-y-5 min-w-0">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-card">
            <h3 className="text-base font-bold text-gray-900 mb-0.5 flex items-center gap-2"><i className="fa-solid fa-chart-column text-math-red"></i> This Week</h3>
            <p className="text-xs text-gray-400 mb-5">Sessions per day, cancelled excluded</p>
            <WeekChart sessions={sessions} />
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-card">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2"><i className="fa-solid fa-comment-dots text-math-red"></i> Latest Feedback</h3>
              <button onClick={() => navigate('/ratings')} className="text-xs font-bold text-math-red hover:underline">View all <i className="fa-solid fa-arrow-right ml-1"></i></button>
            </div>
            {latest.length ? latest.map(({ s, r }) => (
              <div key={r.id} className="flex gap-3 py-3 border-t border-gray-100 first:border-0 first:pt-0">
                <Avatar name={r.student} size="w-9 h-9" />
                <div className="min-w-0 flex-grow">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-gray-900">{r.student}</span>
                    <Stars value={r.stars} />
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">“{r.comment}”</p>
                  <button onClick={() => openModal('feedback', s.id)} className="text-xs text-gray-400 hover:text-math-red mt-1 text-left">{s.lesson} • {relDay(s.date)}</button>
                </div>
              </div>
            )) : <p className="text-sm text-gray-500">No feedback yet.</p>}
          </div>
        </div>
      </div>
    </section>
  )
}

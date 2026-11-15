import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTeacherData } from '../context/TeacherDataContext'
import { byKey } from '../lib/sessions'
import { fmtTime, plural, relDay } from '../lib/format'
import { Avatar, Chip, EmptyState, ProgramBadge, SELECT, TypeBadge } from '../components/ui'

/* My Students — every student in this teacher's sessions, built from GET /api/teacher/sessions
   (each session already lists its students with their attendance). No extra API call. */

const LOW_ATTENDANCE = 70 // % — below this a student is flagged "Needs attention"

function buildStudents(sessions) {
  const map = new Map()
  sessions.forEach((s) => {
    if (s.status === 'cancelled') return
    s.students.forEach((st) => {
      if (!st?.id) return
      let row = map.get(st.id)
      if (!row) {
        row = { id: st.id, name: st.name || 'Student', avatar: st.avatar, sessions: [], programs: new Set() }
        map.set(st.id, row)
      }
      row.sessions.push({ s, attendance: st.attendance })
      if (s.program) row.programs.add(s.program)
    })
  })
  return [...map.values()].map((r) => {
    const list = r.sessions.sort((a, b) => byKey(a.s, b.s))
    const done = list.filter((x) => x.s.status === 'completed')
    const present = list.filter((x) => x.attendance === 'present').length
    const absent = list.filter((x) => x.attendance === 'absent').length
    const marked = present + absent
    const rate = marked ? Math.round((present / marked) * 100) : null
    const next = list.find((x) => x.s.status === 'upcoming')?.s || null
    const last = [...done].reverse()[0]?.s || null
    return {
      ...r,
      programs: [...r.programs].sort(),
      total: list.length,
      done: done.length,
      upcoming: list.filter((x) => x.s.status === 'upcoming').length,
      present, absent, marked, rate, next, last,
      history: [...list].reverse(),
      attention: rate != null && (rate < LOW_ATTENDANCE || absent >= 2),
    }
  })
}

const ATT = {
  present: ['Present', 'bg-green-50 text-emerald-700 border-green-200'],
  absent: ['Absent', 'bg-red-50 text-red-700 border-red-200'],
}

function StudentCard({ st, open, onToggle, onOpenSession }) {
  const barColor = st.rate == null ? 'bg-gray-300' : st.rate >= 85 ? 'bg-emerald-500' : st.rate >= LOW_ATTENDANCE ? 'bg-amber-400' : 'bg-math-red'
  return (
    <article className="bg-white rounded-2xl border border-gray-200 shadow-card flex flex-col overflow-hidden">
      <div className="p-5 flex-grow">
        <div className="flex items-start gap-3 mb-4">
          {st.avatar
            ? <img src={st.avatar} alt="" className="w-11 h-11 rounded-full object-cover border border-gray-200 shrink-0" />
            : <Avatar name={st.name} size="w-11 h-11" />}
          <div className="min-w-0 flex-grow">
            <h3 className="font-bold text-gray-900 truncate" title={st.name}>{st.name}</h3>
            <div className="flex flex-wrap gap-1 mt-1">{st.programs.slice(0, 3).map((p) => <ProgramBadge key={p} program={p} />)}</div>
          </div>
          {st.attention && (
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-red-50 text-math-red border border-red-100 whitespace-nowrap">Needs attention</span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[['Sessions', st.total], ['Attended', st.present], ['Absent', st.absent]].map(([l, v]) => (
            <div key={l} className="bg-gray-50 rounded-xl p-2.5 border border-gray-100 text-center">
              <div className="text-lg font-extrabold text-gray-900 leading-none">{v}</div>
              <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{l}</div>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-semibold text-gray-500">Attendance</span>
            <span className="font-bold text-gray-900">{st.rate == null ? 'Not marked yet' : `${st.rate}%`}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <span className={`block h-full rounded-full ${barColor}`} style={{ width: `${st.rate ?? 0}%` }}></span>
          </div>
          {st.marked > 0 && <p className="text-[11px] text-gray-400 mt-1">{st.present} of {plural(st.marked, 'marked session')}</p>}
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <i className="fa-regular fa-calendar-check text-math-red mt-0.5 w-4"></i>
            {st.next
              ? <button onClick={() => onOpenSession(st.next)} className="text-left min-w-0 hover:text-math-red">
                  <span className="font-bold text-gray-900">Next: {relDay(st.next.date)} • {fmtTime(st.next.start)}</span>
                  <span className="block text-gray-500 truncate">{st.next.lesson}</span>
                </button>
              : <span className="text-gray-400">No upcoming session</span>}
          </div>
          <div className="flex items-start gap-2">
            <i className="fa-solid fa-clock-rotate-left text-gray-400 mt-0.5 w-4"></i>
            {st.last
              ? <span className="min-w-0"><span className="font-semibold text-gray-700">Last: {relDay(st.last.date)}</span><span className="block text-gray-500 truncate">{st.last.lesson}</span></span>
              : <span className="text-gray-400">No finished session yet</span>}
          </div>
        </div>
      </div>

      <button onClick={onToggle} aria-expanded={open} className="w-full py-3 text-xs font-bold text-math-red hover:bg-red-50 border-t border-gray-100 transition-colors">
        {open ? 'Hide sessions' : `Show all ${plural(st.total, 'session')}`} <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'} ml-1`}></i>
      </button>
      {open && (
        <ul className="border-t border-gray-100 bg-gray-50/60 divide-y divide-gray-100 max-h-72 overflow-y-auto">
          {st.history.map(({ s, attendance }) => {
            const [label, cls] = ATT[attendance] || (s.status === 'upcoming' ? ['Upcoming', 'bg-blue-50 text-math-blue border-blue-100'] : ['Not marked', 'bg-amber-50 text-amber-700 border-amber-200'])
            return (
              <li key={s.id}>
                <button onClick={() => onOpenSession(s)} className="w-full px-5 py-2.5 flex items-center gap-3 text-left hover:bg-white transition-colors">
                  <div className="min-w-0 flex-grow">
                    <p className="text-xs font-bold text-gray-900 truncate">{s.lesson}</p>
                    <p className="text-[11px] text-gray-500 flex items-center gap-1.5 flex-wrap">{relDay(s.date)} • {fmtTime(s.start)} <TypeBadge type={s.type} /></p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${cls}`}>{label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </article>
  )
}

export default function StudentsPage() {
  const { sessions } = useTeacherData()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [program, setProgram] = useState('ALL')
  const [view, setView] = useState('all')
  const [sort, setSort] = useState('name')
  const [expanded, setExpanded] = useState(() => new Set())

  const students = useMemo(() => buildStudents(sessions), [sessions])
  const programs = useMemo(() => [...new Set(students.flatMap((s) => s.programs))].sort(), [students])
  const counts = {
    all: students.length,
    upcoming: students.filter((s) => s.next).length,
    attention: students.filter((s) => s.attention).length,
  }
  const marked = students.reduce((n, s) => n + s.marked, 0)
  const overall = marked ? Math.round((students.reduce((n, s) => n + s.present, 0) / marked) * 100) : null

  const ql = q.trim().toLowerCase()
  const list = students.filter((s) =>
    (!ql || s.name.toLowerCase().includes(ql))
    && (program === 'ALL' || s.programs.includes(program))
    && (view === 'all' || (view === 'upcoming' ? s.next : s.attention)))
  if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
  else if (sort === 'sessions') list.sort((a, b) => b.total - a.total)
  else if (sort === 'attendance') list.sort((a, b) => (a.rate ?? 101) - (b.rate ?? 101))
  else if (sort === 'next') list.sort((a, b) => (a.next ? a.next.date + a.next.start : '9') .localeCompare(b.next ? b.next.date + b.next.start : '9'))

  const openSession = (s) => navigate(`/workspace/${s.id}`)
  const kpi = (label, value, sub, icon, box) => (
    <div className="bg-white rounded-2xl p-3.5 sm:p-5 border border-gray-200 shadow-card flex items-center gap-3 sm:gap-4 min-w-0">
      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center sm:text-lg shrink-0 ${box}`}><i className={icon}></i></div>
      <div className="min-w-0">
        <div className="text-[10px] sm:text-[11px] font-bold text-gray-400 uppercase tracking-wider truncate">{label}</div>
        <div className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">{value}</div>
        <div className="text-[11px] sm:text-xs text-gray-500 truncate">{sub}</div>
      </div>
    </div>
  )

  return (
    <section>
      <div className="mb-5">
        <h1 className="t-h1">My Students</h1>
        <p className="t-sub">Everyone in your sessions — their attendance, next session and session history.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 mb-5">
        {kpi('Students', counts.all, `Across ${plural(programs.length, 'program')}`, 'fa-solid fa-user-graduate', 'bg-red-50 text-math-red')}
        {kpi('Attendance', overall == null ? '—' : `${overall}%`, `${plural(marked, 'marked seat')}`, 'fa-solid fa-clipboard-check', 'bg-green-50 text-emerald-600')}
        {kpi('With a next session', counts.upcoming, 'Booked in your schedule', 'fa-regular fa-calendar-check', 'bg-blue-50 text-math-blue')}
        {kpi('Need attention', counts.attention, `Below ${LOW_ATTENDANCE}% or 2+ absences`, 'fa-solid fa-triangle-exclamation', 'bg-orange-50 text-math-orange')}
      </div>

      <div className="bg-white rounded-2xl p-3 border border-gray-200 shadow-card mb-5 flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative flex-grow min-w-0">
          <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs"></i>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students…" aria-label="Search students" className={`${SELECT} w-full pl-8`} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip on={view === 'all'} onClick={() => setView('all')} count={counts.all}>All</Chip>
          <Chip on={view === 'upcoming'} onClick={() => setView('upcoming')} count={counts.upcoming}>Has next session</Chip>
          <Chip on={view === 'attention'} onClick={() => setView('attention')} count={counts.attention}>Needs attention</Chip>
        </div>
        <div className="grid grid-cols-2 gap-2 lg:flex">
          <select value={program} onChange={(e) => setProgram(e.target.value)} aria-label="Filter by program" className={SELECT}>
            <option value="ALL">All programs</option>
            {programs.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort students" className={SELECT}>
            <option value="name">Name A–Z</option>
            <option value="next">Next session first</option>
            <option value="sessions">Most sessions</option>
            <option value="attendance">Lowest attendance</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-5 items-start">
        {list.length
          ? list.map((st) => (
            <StudentCard
              key={st.id}
              st={st}
              open={expanded.has(st.id)}
              onToggle={() => setExpanded((e) => { const n = new Set(e); if (n.has(st.id)) n.delete(st.id); else n.add(st.id); return n })}
              onOpenSession={openSession}
            />
          ))
          : <EmptyState icon="fa-solid fa-user-graduate"
              title={students.length ? 'No students match' : 'No students yet'}
              text={students.length ? 'Try another search, program or filter.' : 'Students appear here once they are added to your sessions.'} />}
      </div>
    </section>
  )
}

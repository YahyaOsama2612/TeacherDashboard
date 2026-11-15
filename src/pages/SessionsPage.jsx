import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTeacherData } from '../context/TeacherDataContext'
import { TYPES, TYPE_KEYS, typeOf, dateMatch, byKey } from '../lib/sessions'
import {
  addDays, DOW_LONG, fmtDate, fmtLongDate, fmtTime, hourLabel, iso, MON3, minutes, parseISO, plural, relDay,
  startOfToday, todayISO, tomorrowISO, yesterdayISO,
} from '../lib/format'
import { Chip, EmptyState, SELECT } from '../components/ui'
import SessionCard from '../components/SessionCard'

const STATUS_TABS = {
  upcoming: ['fa-regular fa-clock', 'Upcoming'],
  completed: ['fa-solid fa-circle-check', 'Completed'],
  cancelled: ['fa-solid fa-ban', 'Cancelled'],
}
const DATE_CHIPS = {
  upcoming: [['today', 'Today'], ['tomorrow', 'Tomorrow'], ['all', 'All upcoming'], ['range', 'Date range']],
  completed: [['all', 'All previous'], ['today', 'Today'], ['yesterday', 'Yesterday'], ['week', 'Last 7 days']],
  cancelled: [['all', 'All'], ['upcoming', 'Upcoming'], ['past', 'Past']],
}
const DEFAULT_WHEN = { upcoming: 'today', completed: 'all', cancelled: 'all' }

function Timetable({ list, days }) {
  const { openModal } = useTeacherData()
  const navigate = useNavigate()
  const HOUR = 56
  const PAD = 10
  const startH = Math.floor(Math.min(...list.map((s) => minutes(s.start))) / 60)
  const endH = Math.ceil(Math.max(...list.map((s) => minutes(s.end))) / 60)
  const h0 = Math.max(0, Math.min(startH, 14) - 1)
  const h1 = Math.min(24, Math.max(endH, 20) + 1)
  const height = (h1 - h0) * HOUR + PAD * 2
  const y = (t) => PAD + ((minutes(t) - h0 * 60) / 60) * HOUR
  const cols = `64px repeat(${days.length}, minmax(170px, 1fr))`
  const hours = []
  for (let h = h0; h <= h1; h++) hours.push(h)
  const today = todayISO()

  const click = (s) => {
    if (s.status === 'upcoming') navigate(`/workspace/${s.id}`)
    else if (s.status === 'completed' && s.reviews.length) openModal('feedback', s.id)
    else openModal('materials', s.id)
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-gray-100">
        <div className="text-sm font-bold text-gray-900">
          <i className="fa-solid fa-table-cells text-math-red mr-2"></i>
          {days.length === 1 ? fmtLongDate(days[0]) : `${fmtDate(days[0])} → ${fmtDate(days[days.length - 1])}`}
        </div>
        <div className="flex flex-wrap gap-3 text-[11px] font-semibold text-gray-500">
          {TYPE_KEYS.map((t) => <span key={t} className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-sm ${TYPES[t].bar}`}></span>{TYPES[t].label}</span>)}
        </div>
      </div>
      <div className="overflow-x-auto">
        <div style={{ minWidth: `${64 + days.length * 170}px` }}>
          <div className="grid border-b border-gray-200 bg-gray-50" style={{ gridTemplateColumns: cols }}>
            <div></div>
            {days.map((d) => {
              const n = list.filter((s) => s.date === d).length
              const rel = relDay(d)
              return (
                <div key={d} className={`px-3 py-2.5 border-l border-gray-200 ${d === today ? 'bg-red-50' : ''}`}>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${d === today ? 'text-math-red' : 'text-gray-400'}`}>
                    {['Today', 'Tomorrow', 'Yesterday'].includes(rel) ? rel : DOW_LONG[parseISO(d).getDay()]}
                  </div>
                  <div className="text-sm font-extrabold text-gray-900">{MON3[parseISO(d).getMonth()]} {parseISO(d).getDate()}</div>
                  <div className="text-[10px] text-gray-400 font-medium">{n ? plural(n, 'session') : 'Free'}</div>
                </div>
              )
            })}
          </div>
          <div className="grid" style={{ gridTemplateColumns: cols, height: `${height}px` }}>
            <div className="relative">
              {hours.map((h) => (
                <div key={h} className="absolute right-2 text-[10px] font-semibold text-gray-400 -translate-y-1/2 whitespace-nowrap" style={{ top: `${PAD + (h - h0) * HOUR}px` }}>{hourLabel(h)}</div>
              ))}
            </div>
            {days.map((d) => (
              <div key={d} className={`relative border-l border-gray-200 ${d === today ? 'bg-red-50/30' : ''}`}>
                {hours.map((h) => <div key={h} className="absolute left-0 right-0 border-t border-gray-100" style={{ top: `${PAD + (h - h0) * HOUR}px` }}></div>)}
                {list.filter((s) => s.date === d).map((s) => {
                  const T = typeOf(s.type)
                  const top = y(s.start)
                  const h = Math.max(36, y(s.end) - top - 3)
                  return (
                    <button
                      key={s.id}
                      onClick={() => click(s)}
                      className={`absolute left-1.5 right-1.5 rounded-lg border-l-4 ${T.block} ${s.status === 'cancelled' ? 'opacity-60 line-through' : ''} px-2 py-1.5 text-left overflow-hidden hover:shadow-md hover:z-10 transition-shadow`}
                      style={{ top: `${top}px`, height: `${h}px` }}
                      title={`${s.lesson} • ${fmtTime(s.start)} — ${fmtTime(s.end)}`}
                    >
                      <div className="text-[10px] font-bold opacity-80">{fmtTime(s.start)} – {fmtTime(s.end)}</div>
                      <div className="text-xs font-bold leading-tight truncate">{s.lesson}</div>
                      <div className="text-[10px] opacity-80 truncate">{s.program} • {T.label} • {plural(s.studentCount, 'student')}</div>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SessionsPage() {
  const { sessions } = useTeacherData()
  const [params, setParams] = useSearchParams()
  const status = STATUS_TABS[params.get('status')] ? params.get('status') : 'upcoming'
  const when = params.get('when') || DEFAULT_WHEN[status]
  const [search, setSearch] = useState('')
  const [type, setType] = useState('ALL')
  const [program, setProgram] = useState('ALL')
  const [layout, setLayout] = useState('cards')
  const [range, setRange] = useState(() => ({ from: todayISO(), to: iso(addDays(startOfToday(), 6)) }))
  const [picked, setPicked] = useState('')

  const programs = useMemo(() => [...new Set(sessions.map((s) => s.program))].sort(), [sessions])
  const setStatus = (st, w) => setParams({ status: st, when: w || DEFAULT_WHEN[st] })
  const setWhen = (w) => setParams({ status, when: w })

  const toolbarMatch = (s) => {
    const q = search.trim().toLowerCase()
    return (type === 'ALL' || s.type === type)
      && (program === 'ALL' || s.program === program)
      && (!q || [s.lesson, s.unit, s.program, typeOf(s.type).label, ...s.students.map((x) => x.name)].join(' ').toLowerCase().includes(q))
  }
  const ctx = { range, picked }
  const base = sessions.filter((s) => s.status === status && toolbarMatch(s))
  const list = base.filter((s) => dateMatch(s, when, ctx)).sort(byKey)
  if (status !== 'upcoming' && layout === 'cards') list.reverse()

  const changeRange = (which, value) => {
    if (!value) return
    setRange((r) => {
      const next = { ...r, [which]: value }
      if (next.to < next.from) { if (which === 'from') next.to = value; else next.from = value }
      return next
    })
    setWhen('range')
  }
  const pickDate = (value) => {
    setPicked(value)
    setWhen(value ? 'date' : 'all')
  }
  const clearToolbar = () => { setSearch(''); setType('ALL'); setProgram('ALL') }

  const timetableDays = () => {
    let from
    let to
    if (when === 'today') from = to = todayISO()
    else if (when === 'tomorrow') from = to = tomorrowISO()
    else if (when === 'yesterday') from = to = yesterdayISO()
    else if (when === 'date') from = to = picked
    else if (when === 'week') { from = iso(addDays(startOfToday(), -7)); to = todayISO() }
    else if (when === 'range') ({ from, to } = range)
    else { from = list[0].date; to = list[list.length - 1].date }
    const days = []
    for (let d = parseISO(from); iso(d) <= to && days.length < 31; d = addDays(d, 1)) days.push(iso(d))
    return days
  }

  let empty = null
  if (!list.length) {
    const toolbarOn = search || type !== 'ALL' || program !== 'ALL'
    let title = 'No sessions here'
    let text = 'Try another date or filter.'
    let action = null
    if (toolbarOn) {
      title = 'No sessions match your filters'
      action = <button onClick={clearToolbar} className="mt-4 px-5 py-2.5 text-sm font-bold text-math-red bg-red-50 hover:bg-red-100 rounded-xl">Clear search &amp; filters</button>
    } else if (status === 'upcoming' && when === 'today') {
      title = 'No more sessions today'
      text = 'You are free for the rest of the day.'
      action = <button onClick={() => setWhen('tomorrow')} className="mt-4 px-5 py-2.5 text-sm font-bold text-white bg-math-red hover:bg-math-red-hover rounded-xl">See tomorrow</button>
    } else if (status === 'upcoming' && when === 'range') {
      title = 'No sessions in this date range'
      text = `Nothing scheduled from ${fmtDate(range.from)} to ${fmtDate(range.to)}.`
    } else if (status === 'cancelled') {
      title = 'No cancelled sessions'
      text = 'Sessions cancelled by admin or approved cancellation requests show up here.'
    }
    empty = <EmptyState icon="fa-regular fa-calendar-xmark" title={title} text={text} action={action} />
  }

  const groups = []
  list.forEach((s) => {
    const g = groups[groups.length - 1]
    if (g && g.date === s.date) g.items.push(s)
    else groups.push({ date: s.date, items: [s] })
  })
  const dateInput = 'bg-transparent text-gray-900 text-xs font-semibold focus:outline-none'

  return (
    <section>
      <div className="mb-5">
        <h1 className="t-h1">Sessions</h1>
        <p className="t-sub">Every session the admin assigns to you, with its materials, attendance and meeting link.</p>
      </div>

      <div className="bg-white rounded-2xl p-3 border border-gray-200 shadow-card mb-5">
        <div className="grid grid-cols-2 md:flex md:flex-wrap md:items-center gap-2">
          <div className="relative col-span-2 md:flex-1 md:min-w-[220px]">
            <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            <input value={search} onChange={(e) => setSearch(e.target.value)} type="search" placeholder="Search lesson or student…" aria-label="Search sessions" className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-math-red" />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by session type" className={SELECT}>
            <option value="ALL">All types</option>
            {TYPE_KEYS.map((t) => <option key={t} value={t}>{TYPES[t].label}</option>)}
          </select>
          <select value={program} onChange={(e) => setProgram(e.target.value)} aria-label="Filter by program" className={SELECT}>
            <option value="ALL">All programs</option>
            {programs.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="col-span-2 md:ml-auto bg-gray-50 rounded-xl p-1 border border-gray-200 flex shrink-0" role="group" aria-label="Sessions layout">
            {[['cards', 'fa-grip', 'Cards'], ['timetable', 'fa-table-cells', 'Timetable']].map(([key, icon, label]) => (
              <button key={key} onClick={() => setLayout(key)} aria-pressed={layout === key} className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 ${layout === key ? 'bg-math-red text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}>
                <i className={`fa-solid ${icon}`}></i> {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200 mb-5 flex gap-2 sm:gap-6 overflow-x-auto no-scrollbar" role="tablist" aria-label="Session status">
        {Object.entries(STATUS_TABS).map(([key, [icon, label]]) => {
          const on = key === status
          const n = sessions.filter((s) => s.status === key && toolbarMatch(s)).length
          return (
            <button key={key} onClick={() => setStatus(key)} role="tab" aria-selected={on} className={`flex-1 sm:flex-none justify-center pb-3 -mb-px border-b-2 text-sm font-bold flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-colors ${on ? 'text-math-red border-math-red' : 'text-gray-500 border-transparent hover:text-gray-800'}`}>
              <i className={`${icon} hidden sm:inline`}></i> {label}
              <span className={`${on ? 'bg-math-red text-white' : 'bg-gray-100 text-gray-500'} text-[10px] px-2 py-0.5 rounded-full`}>{n}</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2 flex-wrap mb-6">
        {DATE_CHIPS[status].map(([key, label]) => (
          <Chip key={key} on={when === key} onClick={() => setWhen(key)} count={base.filter((s) => dateMatch(s, key, ctx)).length}>{label}</Chip>
        ))}
        {status === 'upcoming' ? (
          <div className={`w-full sm:w-auto sm:ml-auto grid grid-cols-2 sm:flex items-center gap-2 bg-white border ${when === 'range' ? 'border-math-red' : 'border-gray-200'} rounded-2xl sm:rounded-full px-4 py-2 sm:py-1`}>
            <label className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0">
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase sm:normal-case flex items-center gap-1.5"><i className="fa-regular fa-calendar"></i> From</span>
              <input type="date" value={range.from} min={todayISO()} onChange={(e) => changeRange('from', e.target.value)} className={`${dateInput} min-w-0`} />
            </label>
            <label className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 min-w-0">
              <span className="text-[10px] sm:text-xs font-bold text-gray-500 uppercase sm:normal-case">To</span>
              <input type="date" value={range.to} min={range.from} onChange={(e) => changeRange('to', e.target.value)} className={`${dateInput} min-w-0`} />
            </label>
          </div>
        ) : (
          <div className={`sm:ml-auto flex items-center gap-2 bg-white border ${when === 'date' ? 'border-math-red' : 'border-gray-200'} rounded-full pl-4 pr-2 py-1`}>
            <label htmlFor="date-pick" className="text-xs font-bold text-gray-500 flex items-center gap-1.5"><i className="fa-regular fa-calendar"></i> On date</label>
            <input id="date-pick" type="date" value={when === 'date' ? picked : ''} max={status === 'completed' ? todayISO() : undefined} onChange={(e) => pickDate(e.target.value)} className={dateInput} />
            {when === 'date' && <button onClick={() => pickDate('')} className="w-6 h-6 rounded-full hover:bg-gray-100 text-gray-400 hover:text-math-red" aria-label="Clear date"><i className="fa-solid fa-xmark text-xs"></i></button>}
          </div>
        )}
      </div>

      {empty || (layout === 'timetable' ? <Timetable list={list} days={timetableDays()} /> : groups.map((g) => {
        const rel = relDay(g.date)
        const named = ['Today', 'Tomorrow', 'Yesterday'].includes(rel)
        return (
          <div key={g.date} className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              {named && <span className={`text-sm font-extrabold ${rel === 'Today' ? 'text-math-red' : 'text-gray-900'}`}>{rel}</span>}
              <span className={`text-xs ${named ? 'text-gray-400 font-medium' : 'text-gray-900 font-extrabold'}`}>{fmtLongDate(g.date)}</span>
              <span className="flex-grow h-px bg-gray-200"></span>
              <span className="text-xs font-semibold text-gray-400">{plural(g.items.length, 'session')}</span>
            </div>
            <div className="grid gap-5 grid-cols-[repeat(auto-fill,minmax(min(100%,272px),1fr))]">
              {g.items.map((s) => <SessionCard key={s.id} s={s} />)}
            </div>
          </div>
        )
      }))}
    </section>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { useTeacherData } from '../context/TeacherDataContext'
import portalApi from '../api/portalApi'
import { TYPES, TYPE_KEYS, typeOf, avgOf, avgRating, byKey } from '../lib/sessions'
import { DOW_LONG, fmtHours, fmtStamp, fmtTime, hourLabel, initials, minutes, MON3, parseISO, plural, shortTime, startOfToday, TIME_SLOTS } from '../lib/format'
import { Chip, EmptyState, ProgramBadge, SELECT, Stars, TypeBadge } from '../components/ui'

/* ---------- Weekly availability (Saturday → Friday) ---------- */
const WEEK_DAYS = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const DAY_INDEX = Object.fromEntries(DOW_LONG.map((d, i) => [d, i])) // JS getDay(): Sunday = 0
const TL_START = 8 * 60
const TL_END = 24 * 60
const tlPct = (t) => ((minutes(t) - TL_START) / (TL_END - TL_START)) * 100
const TICKS = [8, 10, 12, 14, 16, 18, 20, 22, 24]
// The backend stores TIME values, so midnight travels as 23:59.
const toApi = (t) => (t === '24:00' ? '23:59' : t)
const fromApi = (t) => (t === '23:59' ? '24:00' : t)

const emptyWeek = () => Object.fromEntries(WEEK_DAYS.map((d) => [d, { on: false, slots: [['16:00', '22:00']] }]))
function fromSlots(slots) {
  const week = emptyWeek()
  slots.forEach((s) => {
    const day = DOW_LONG[s.dayOfWeek]
    if (!week[day].on) week[day] = { on: true, slots: [] }
    week[day].slots.push([s.timeFrom, fromApi(s.timeTo)])
  })
  return week
}
const toSlots = (week) => WEEK_DAYS.flatMap((d) => (week[d].on ? week[d].slots.map(([f, t]) => ({ dayOfWeek: DAY_INDEX[d], timeFrom: f, timeTo: toApi(t) })) : []))

function dayError(d) {
  if (!d.on) return ''
  if (!d.slots.length) return 'Add at least one time range.'
  const sorted = [...d.slots].sort((a, b) => minutes(a[0]) - minutes(b[0]))
  if (sorted.some(([f, t]) => minutes(t) <= minutes(f))) return 'End time must be after the start time.'
  for (let i = 1; i < sorted.length; i++) if (minutes(sorted[i][0]) < minutes(sorted[i - 1][1])) return 'These time ranges overlap.'
  return ''
}
const dayHours = (d) => (d.on ? d.slots.reduce((n, [f, t]) => n + Math.max(0, minutes(t) - minutes(f)), 0) / 60 : 0)

function Availability() {
  const { showToast } = useTeacherData()
  const [week, setWeek] = useState(emptyWeek)
  const [saved, setSaved] = useState(() => JSON.stringify(emptyWeek()))
  const [sharedAt, setSharedAt] = useState(null)
  const [openDay, setOpenDay] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    portalApi.getAvailability()
      .then((res) => {
        const w = fromSlots(res?.data?.slots || [])
        setWeek(w)
        setSaved(JSON.stringify(w))
        setSharedAt(res?.data?.sharedAt || null)
      })
      .catch(() => showToast('Could not load your availability', 'fa-circle-exclamation'))
      .finally(() => setLoading(false))
  }, [showToast])

  const update = (fn) => setWeek((w) => { const next = JSON.parse(JSON.stringify(w)); fn(next); return next })
  const toggleDay = (day) => update((w) => {
    w[day].on = !w[day].on
    if (w[day].on && !w[day].slots.length) w[day].slots.push(['16:00', '22:00'])
    setOpenDay(w[day].on ? day : openDay === day ? null : openDay)
  })
  const setSlot = (day, i, part, value) => update((w) => {
    const slot = w[day].slots[i]
    slot[part] = value
    if (part === 0 && minutes(slot[1]) <= minutes(value)) slot[1] = TIME_SLOTS.find((t) => minutes(t) >= minutes(value) + 60) || '24:00'
  })
  const addSlot = (day) => update((w) => {
    const slots = w[day].slots
    const lastEnd = slots.length ? slots[slots.length - 1][1] : '14:00'
    const from = minutes(lastEnd) >= minutes('23:00') ? '08:00' : lastEnd
    slots.push([from, TIME_SLOTS.find((t) => minutes(t) >= minutes(from) + 120) || '24:00'])
  })
  const removeSlot = (day, i) => update((w) => {
    w[day].slots.splice(i, 1)
    if (!w[day].slots.length) { w[day].on = false; w[day].slots.push(['16:00', '22:00']) }
  })
  const copyToAll = (day) => {
    update((w) => { WEEK_DAYS.forEach((d) => { if (d !== day) w[d] = { on: w[day].on, slots: w[day].slots.map((s) => [...s]) } }) })
    showToast(`${day}'s times copied to every day`, 'fa-copy')
  }

  const save = async () => {
    const bad = WEEK_DAYS.find((d) => dayError(week[d]))
    if (bad) { setOpenDay(bad); showToast(`Fix ${bad} before saving`, 'fa-circle-exclamation'); return }
    setSaving(true)
    try {
      const res = await portalApi.saveAvailability(toSlots(week))
      setSaved(JSON.stringify(week))
      setSharedAt(res?.data?.sharedAt || new Date().toISOString())
      setOpenDay(null)
      showToast('Availability saved and shared with admin', 'fa-paper-plane')
    } catch (err) {
      showToast(err?.message || 'Could not save availability', 'fa-circle-exclamation')
    } finally {
      setSaving(false)
    }
  }

  const todayName = DOW_LONG[startOfToday().getDay()]
  const onDays = WEEK_DAYS.filter((d) => week[d].on).length
  const total = WEEK_DAYS.reduce((n, d) => n + dayHours(week[d]), 0)
  const ranges = WEEK_DAYS.flatMap((d) => (week[d].on ? week[d].slots : []))
  const earliest = ranges.length ? ranges.reduce((a, r) => (minutes(r[0]) < minutes(a) ? r[0] : a), ranges[0][0]) : null
  const latest = ranges.length ? ranges.reduce((a, r) => (minutes(r[1]) > minutes(a) ? r[1] : a), ranges[0][1]) : null
  const dirty = JSON.stringify(week) !== saved
  const canSave = !loading && (dirty || !sharedAt)

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-card mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-2">
        <div>
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2"><i className="fa-regular fa-calendar-check text-math-red"></i> Weekly Availability</h3>
          <p className="text-xs text-gray-500">When you can teach, Saturday to Friday. Admin only assigns you sessions inside these times. Click a day to edit it.</p>
          <div className="mt-2">
            {dirty ? <span className="av-state warn"><i className="fa-solid fa-circle text-[6px]"></i> Unsaved changes</span>
              : sharedAt ? <span className="av-state ok"><i className="fa-solid fa-check"></i> Shared with admin · {fmtStamp(sharedAt)}</span>
                : <span className="av-state"><i className="fa-regular fa-clock"></i> Not shared with admin yet</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <button onClick={() => { setWeek(JSON.parse(saved)); setOpenDay(null) }} className="av-ghost">Discard</button>}
          <button onClick={save} disabled={!canSave || saving} className={`av-save ${canSave ? 'on' : ''}`}>
            {saving ? <><i className="fa-solid fa-circle-notch animate-spin"></i> Saving…</>
              : canSave ? <><i className="fa-solid fa-paper-plane"></i> Save &amp; share with admin</> : <><i className="fa-solid fa-check"></i> Up to date</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5 mt-4">
        <div className="av-stat"><span className="av-stat-label">Teaching days</span><span className="av-stat-value">{onDays}<span className="text-sm text-gray-400 font-semibold"> / 7</span></span></div>
        <div className="av-stat"><span className="av-stat-label">Hours per week</span><span className="av-stat-value">{fmtHours(total)}</span></div>
        <div className="av-stat"><span className="av-stat-label">Earliest – latest</span><span className="av-stat-value text-base sm:text-xl">{earliest ? `${shortTime(earliest)} – ${shortTime(latest)}` : '—'}</span></div>
      </div>
      <div className="av-week">
        <div className="av-row av-head">
          <span></span>
          <div className="av-scale">{TICKS.map((h) => <span key={h} style={{ left: `${((h * 60 - TL_START) / (TL_END - TL_START)) * 100}%` }}>{hourLabel(h)}</span>)}</div>
          <span className="text-right">Hours</span>
        </div>
        {WEEK_DAYS.map((day) => {
          const d = week[day]
          const err = dayError(d)
          const open = openDay === day
          return (
            <div key={day} className={`av-row ${d.on ? '' : 'is-off'} ${open ? 'is-open' : ''}`}>
              <div className="flex items-center gap-3 min-w-0">
                <button role="switch" aria-checked={d.on} aria-label={`${day} availability`} onClick={() => toggleDay(day)} className={`av-switch ${d.on ? 'on' : ''}`}><span></span></button>
                <button onClick={() => setOpenDay(open ? null : day)} className="text-left min-w-0">
                  <span className={`block text-sm font-bold ${d.on ? 'text-gray-900' : 'text-gray-400'}`}>{day}{day === todayName && <span className="av-today">Today</span>}</span>
                  <span className={`block text-[11px] ${err ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                    {err || (d.on ? d.slots.map(([f, t]) => `${shortTime(f)}–${shortTime(t)}`).join(', ') : 'Not available')}
                  </span>
                </button>
              </div>
              <button onClick={() => setOpenDay(open ? null : day)} className="av-track" aria-label={`Edit ${day}`}>
                {TICKS.map((h) => <span key={h} className="av-tick" style={{ left: `${((h * 60 - TL_START) / (TL_END - TL_START)) * 100}%` }}></span>)}
                {d.on && d.slots.map(([f, t], i) => (
                  <span key={i} className="av-bar" style={{ left: `${Math.max(0, tlPct(f))}%`, width: `${Math.max(1, tlPct(t) - Math.max(0, tlPct(f)))}%` }}>
                    {minutes(t) - minutes(f) >= 180 ? `${shortTime(f)} – ${shortTime(t)}` : ''}
                  </span>
                ))}
              </button>
              <span className={`text-right text-sm font-bold ${d.on ? 'text-gray-800' : 'text-gray-300'}`}>{d.on ? fmtHours(dayHours(d)) : '—'}</span>
              {open && (
                <div className="av-edit">
                  {d.on ? (
                    <>
                      {d.slots.map(([f, t], i) => (
                        <div key={i} className="flex flex-wrap items-center gap-2">
                          <select aria-label={`${day} from`} value={f} onChange={(e) => setSlot(day, i, 0, e.target.value)} className="av-select">
                            {TIME_SLOTS.slice(0, -1).map((x) => <option key={x} value={x}>{fmtTime(x)}</option>)}
                          </select>
                          <span className="text-xs font-semibold text-gray-400">to</span>
                          <select aria-label={`${day} to`} value={t} onChange={(e) => setSlot(day, i, 1, e.target.value)} className="av-select">
                            {TIME_SLOTS.filter((x) => minutes(x) > minutes(f)).map((x) => <option key={x} value={x}>{fmtTime(x)}</option>)}
                          </select>
                          <span className="text-xs text-gray-400 w-12">{fmtHours((minutes(t) - minutes(f)) / 60)}</span>
                          <button onClick={() => removeSlot(day, i)} className="w-8 h-8 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" aria-label={`Remove ${day} time ${i + 1}`}><i className="fa-regular fa-trash-can"></i></button>
                        </div>
                      ))}
                      <div className="flex flex-wrap items-center gap-4 pt-1">
                        <button onClick={() => addSlot(day)} className="text-xs font-bold text-math-red hover:underline"><i className="fa-solid fa-plus mr-1"></i>Add time range</button>
                        <button onClick={() => copyToAll(day)} className="text-xs font-semibold text-gray-500 hover:text-math-red"><i className="fa-regular fa-copy mr-1"></i>Copy to all days</button>
                        <button onClick={() => setOpenDay(null)} className="text-xs font-semibold text-gray-400 hover:text-gray-700 ml-auto">Done</button>
                      </div>
                    </>
                  ) : <p className="text-sm text-gray-400">Turn {day} on to add times.</p>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { sessions, profile, openModal } = useTeacherData()
  const [history, setHistory] = useState({ program: 'ALL', sort: 'newest' })
  const done = sessions.filter((s) => s.status === 'completed')
  const reviews = done.flatMap((s) => s.reviews)
  const avg = avgOf(reviews)
  const hours = done.reduce((n, s) => n + minutes(s.end) - minutes(s.start), 0) / 60
  const studentsTaught = new Set(done.flatMap((s) => s.students.map((x) => x.id))).size
  const programs = useMemo(() => [...new Set(sessions.map((s) => s.program))].sort(), [sessions])
  const name = profile?.name || 'Teacher'
  const since = profile?.createdAt ? new Date(profile.createdAt).getFullYear() : null

  const stats = [
    { icon: 'fa-chalkboard-user', box: 'bg-red-50 text-math-red', n: done.length, label: 'Sessions taught' },
    { icon: 'fa-hourglass-half', box: 'bg-blue-50 text-math-blue', n: hours % 1 ? hours.toFixed(1) : hours, label: 'Hours taught' },
    { icon: 'fa-users', box: 'bg-purple-100 text-math-purple', n: studentsTaught, label: 'Students taught' },
    { icon: 'fa-calendar-check', box: 'bg-green-50 text-math-success', n: sessions.filter((s) => s.status === 'upcoming').length, label: 'Upcoming sessions' },
  ]

  const active = sessions.filter((s) => s.status !== 'cancelled')
  const maxMix = Math.max(1, ...TYPE_KEYS.map((t) => active.filter((s) => s.type === t).length))

  const histPrograms = ['ALL', ...programs.filter((p) => done.some((s) => s.program === p))]
  const list = done.filter((s) => history.program === 'ALL' || s.program === history.program)
  if (history.sort === 'high') list.sort((a, b) => avgRating(b) - avgRating(a))
  else if (history.sort === 'low') list.sort((a, b) => avgRating(a) - avgRating(b))
  else list.sort((a, b) => byKey(b, a))

  return (
    <section>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden mb-6">
        <div className="h-28 t-hero relative">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <span className="absolute top-4 right-4 bg-white text-math-red text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Teacher Profile</span>
        </div>
        <div className="px-6 pb-6 flex flex-col sm:flex-row sm:items-start gap-4 relative">
          <div className="w-20 h-20 -mt-10 rounded-2xl bg-math-red text-white text-2xl font-extrabold flex items-center justify-center border-4 border-white shadow-lg shrink-0">{initials(name)}</div>
          <div className="flex-grow sm:pt-3">
            <h1 className="text-2xl font-extrabold text-gray-900">{name}</h1>
            <p className="text-sm text-gray-500">
              {profile?.categoryName ? `${profile.categoryName} Teacher` : 'Math Teacher'}
              {programs.length > 0 && ` • ${programs.join(' / ')}`}
              {profile?.email && ` • ${profile.email}`}
              {since && ` • Since ${since}`}
            </p>
          </div>
          <div className="bg-yellow-50 border border-yellow-100 rounded-xl px-4 py-2 text-sm">
            <div className="flex items-center gap-2"><span className="text-xl font-extrabold text-gray-900">{avg.toFixed(1)}</span><Stars value={avg} className="text-sm" /></div>
            <div className="text-[11px] text-gray-500">{plural(reviews.length, 'review')} from students</div>
          </div>
        </div>
        <div className="px-6 pb-6 flex flex-wrap gap-2">
          {programs.map((p) => <ProgramBadge key={p} program={p} />)}
          {TYPE_KEYS.filter((t) => active.some((s) => s.type === t)).map((t) => <TypeBadge key={t} type={t} />)}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-5 border border-gray-200 shadow-card">
            <div className={`w-10 h-10 rounded-xl ${s.box} flex items-center justify-center mb-3`}><i className={`fa-solid ${s.icon}`}></i></div>
            <div className="text-2xl font-extrabold text-gray-900">{s.n}</div>
            <div className="text-xs text-gray-500 font-medium mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <Availability />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-card">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Teaching Mix</h3>
            <div className="space-y-3">
              {TYPE_KEYS.map((t) => {
                const c = active.filter((s) => s.type === t).length
                return (
                  <div key={t}>
                    <div className="flex justify-between text-xs mb-1"><span className="font-semibold text-gray-700">{TYPES[t].label}</span><span className="font-bold text-gray-900">{c}</span></div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full ${TYPES[t].bar} rounded-full`} style={{ width: `${(c / maxMix) * 100}%` }}></div></div>
                  </div>
                )
              })}
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-card">
            <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">How Your Work Flows</h3>
            <ol className="space-y-3 text-xs">
              <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-gray-900 text-white font-bold flex items-center justify-center shrink-0">1</span><span><strong className="text-gray-900 block">Admin schedules</strong><span className="text-gray-500">Sessions + official PDFs appear automatically.</span></span></li>
              <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-math-red text-white font-bold flex items-center justify-center shrink-0">2</span><span><strong className="text-gray-900 block">You teach &amp; publish</strong><span className="text-gray-500">Add the meeting link, teach in the workspace, publish notes.</span></span></li>
              <li className="flex gap-3"><span className="w-6 h-6 rounded-full bg-math-success text-white font-bold flex items-center justify-center shrink-0">3</span><span><strong className="text-gray-900 block">Students rate</strong><span className="text-gray-500">Ratings &amp; comments land in your profile and Session Ratings.</span></span></li>
            </ol>
          </div>
        </div>
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-200 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Previous Sessions</h3>
              <p className="text-xs text-gray-500">Open a session to see your students&apos; ratings and feedback.</p>
            </div>
            <select value={history.sort} onChange={(e) => setHistory((h) => ({ ...h, sort: e.target.value }))} aria-label="Sort previous sessions" className={SELECT}>
              <option value="newest">Newest first</option>
              <option value="high">Highest rated</option>
              <option value="low">Lowest rated</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-2 mb-4">
            {histPrograms.map((p) => <Chip key={p} on={history.program === p} onClick={() => setHistory((h) => ({ ...h, program: p }))}>{p === 'ALL' ? 'All programs' : p}</Chip>)}
          </div>
          <div className="space-y-2">
            {list.length ? list.map((s) => {
              const d = parseISO(s.date)
              const a = avgRating(s)
              const n = s.reviews.length
              const quote = s.reviews.find((r) => r.comment)
              return (
                <button key={s.id} onClick={() => openModal('feedback', s.id)} disabled={!n} className="w-full text-left flex items-center gap-4 p-4 rounded-xl border border-gray-100 bg-white hover:border-math-red hover:shadow-md transition-all group disabled:cursor-default disabled:hover:border-gray-100 disabled:hover:shadow-none">
                  <div className={`w-12 h-12 rounded-xl ${typeOf(s.type).iconBox} flex flex-col items-center justify-center shrink-0`}>
                    <span className="text-base font-extrabold leading-none">{d.getDate()}</span>
                    <span className="text-[10px] font-bold uppercase">{MON3[d.getMonth()]}</span>
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="font-bold text-gray-900 truncate">{s.lesson}</div>
                    <div className="text-xs text-gray-500 flex flex-wrap items-center gap-1.5 mt-1">
                      <ProgramBadge program={s.program} /><TypeBadge type={s.type} />
                      <span>{fmtTime(s.start)} — {fmtTime(s.end)} • {plural(s.studentCount, 'student')}</span>
                    </div>
                    {quote && <div className="text-xs text-gray-400 truncate mt-1">“{quote.comment}” — {quote.student}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-extrabold text-gray-900 whitespace-nowrap"><i className="fa-solid fa-star text-yellow-400 text-sm"></i> {n ? a.toFixed(1) : '—'}</div>
                    <div className="text-[10px] text-gray-400">{plural(n, 'rating')}</div>
                  </div>
                  <i className="fa-solid fa-chevron-right text-gray-300 group-hover:text-math-red text-xs hidden sm:block"></i>
                </button>
              )
            }) : <EmptyState icon="fa-regular fa-star" title="No previous sessions here" text="Completed sessions appear here once they end." />}
          </div>
        </div>
      </div>
    </section>
  )
}

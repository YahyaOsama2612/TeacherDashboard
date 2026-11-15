import { useMemo, useState } from 'react'
import { useTeacherData } from '../context/TeacherDataContext'
import { TYPES, TYPE_KEYS, typeOf, avgOf, avgRating, byKey } from '../lib/sessions'
import { fmtTime, MON3, parseISO, plural, relDay } from '../lib/format'
import { EmptyState, ProgramBadge, SELECT, Stars, TypeBadge } from '../components/ui'
import ReviewCard from '../components/ReviewCard'

function RatingCard({ s, reviews, open, onToggle }) {
  const T = typeOf(s.type)
  const a = avgRating(s)
  const d = parseISO(s.date)
  const sorted = [...reviews].sort((x, y) => (y.comment ? 1 : 0) - (x.comment ? 1 : 0))
  const shown = open ? sorted : sorted.slice(0, 4)
  return (
    <article className="bg-white rounded-2xl border border-gray-200 shadow-card overflow-hidden">
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-4 border-b border-gray-100">
        <div className={`w-14 h-14 rounded-xl ${T.iconBox} flex flex-col items-center justify-center shrink-0`}>
          <span className="text-lg font-extrabold leading-none">{d.getDate()}</span>
          <span className="text-[10px] font-bold uppercase">{MON3[d.getMonth()]}</span>
        </div>
        <div className="flex-grow min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1"><ProgramBadge program={s.program} /><TypeBadge type={s.type} /></div>
          <h3 className="font-bold text-gray-900 text-lg truncate">{s.lesson}</h3>
          <p className="text-xs text-gray-500"><i className="fa-regular fa-clock mr-1"></i>{relDay(s.date)} • {fmtTime(s.start)} — {fmtTime(s.end)} • {plural(s.studentCount, 'student')}</p>
        </div>
        <div className="sm:text-right shrink-0">
          <div className="flex sm:justify-end items-center gap-2">
            <span className="text-3xl font-extrabold text-gray-900">{a.toFixed(1)}</span>
            <Stars value={a} className="text-sm" />
          </div>
          <p className="text-xs text-gray-500">{s.reviews.length} of {plural(s.studentCount, 'student')} rated</p>
        </div>
      </div>
      <div className="p-5 sm:p-6 bg-gray-50/60 grid grid-cols-1 md:grid-cols-2 gap-3">
        {shown.map((r) => <ReviewCard key={r.id} review={r} />)}
      </div>
      {sorted.length > 4 && (
        <button onClick={onToggle} className="w-full py-3 text-xs font-bold text-math-red hover:bg-red-50 border-t border-gray-100 transition-colors">
          {open ? 'Show less' : `Show all ${sorted.length} reviews`} <i className={`fa-solid fa-chevron-${open ? 'up' : 'down'} ml-1`}></i>
        </button>
      )}
    </article>
  )
}

export default function RatingsPage() {
  const { sessions } = useTeacherData()
  const [filter, setFilter] = useState({ type: 'ALL', program: 'ALL', stars: 0, sort: 'newest', comments: false })
  const [expanded, setExpanded] = useState(() => new Set())
  const set = (patch) => setFilter((f) => ({ ...f, ...patch }))

  const rated = useMemo(() => sessions.filter((s) => s.reviews.length), [sessions])
  const programs = useMemo(() => [...new Set(rated.map((s) => s.program))].sort(), [rated])
  const all = rated.flatMap((s) => s.reviews)
  const avg = avgOf(all)
  const dist = [5, 4, 3, 2, 1].map((n) => all.filter((r) => Math.round(r.stars) === n).length)
  const comments = all.filter((r) => r.comment).length
  const five = all.length ? Math.round((dist[0] / all.length) * 100) : 0
  const byType = TYPE_KEYS
    .map((t) => [t, avgOf(rated.filter((s) => s.type === t).flatMap((s) => s.reviews))])
    .filter(([, v]) => v)
    .sort((a, b) => b[1] - a[1])
  const lowest = [...rated].sort((a, b) => avgRating(a) - avgRating(b))[0]

  const list = rated
    .filter((s) => (filter.type === 'ALL' || s.type === filter.type) && (filter.program === 'ALL' || s.program === filter.program))
    .map((s) => ({ s, reviews: s.reviews.filter((r) => (!filter.stars || Math.round(r.stars) === filter.stars) && (!filter.comments || r.comment)) }))
    .filter((x) => x.reviews.length)
  if (filter.sort === 'high') list.sort((a, b) => avgRating(b.s) - avgRating(a.s))
  else if (filter.sort === 'low') list.sort((a, b) => avgRating(a.s) - avgRating(b.s))
  else list.sort((a, b) => byKey(b.s, a.s))

  const tile = (label, value, span = '') => (
    <div className={`bg-gray-50 rounded-xl p-3 border border-gray-100 ${span}`}>
      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{label}</div>
      <div className="text-lg font-extrabold text-gray-900 mt-1 truncate">{value}</div>
    </div>
  )

  return (
    <section>
      <div className="mb-5">
        <h1 className="t-h1">Session Ratings</h1>
        <p className="t-sub">Every rating and comment your students left after each session.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <div className="t-hero rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          <div className="relative">
            <span className="bg-white text-math-red text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-3">Overall Rating</span>
            <div className="flex items-end gap-2"><span className="text-5xl font-extrabold">{avg.toFixed(1)}</span><span className="text-white/60 mb-1.5">/ 5</span></div>
            <div className="mt-2"><Stars value={avg} className="text-lg" /></div>
            <p className="text-sm text-white/80 mt-2">{plural(all.length, 'rating')} across {plural(rated.length, 'session')}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-card">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Rating Breakdown <span className="text-xs text-gray-400 font-medium">— click to filter</span></h3>
          {[5, 4, 3, 2, 1].map((n, i) => {
            const on = filter.stars === n
            return (
              <button key={n} onClick={() => set({ stars: on ? 0 : n })} aria-pressed={on} className="w-full flex items-center gap-3 py-1.5 group">
                <span className={`text-xs font-bold w-8 flex items-center gap-1 ${on ? 'text-math-red' : 'text-gray-700'}`}>{n} <i className="fa-solid fa-star text-yellow-400 text-[10px]"></i></span>
                <span className="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden">
                  <span className={`block h-full rounded-full ${on ? 'bg-math-red' : 'bg-yellow-400 group-hover:bg-yellow-500'}`} style={{ width: `${all.length ? (dist[i] / all.length) * 100 : 0}%` }}></span>
                </span>
                <span className="text-xs font-bold text-gray-500 w-6 text-right">{dist[i]}</span>
              </button>
            )
          })}
        </div>
        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-card grid grid-cols-2 gap-3 content-start">
          {tile('5-star share', `${five}%`)}
          {tile('Written comments', comments)}
          {byType.length > 0 && tile('Best rated type', <>{TYPES[byType[0][0]].label} <span className="text-sm text-yellow-500">{byType[0][1].toFixed(1)}★</span></>, 'col-span-2')}
          {lowest && tile('Needs attention', <>{lowest.lesson} <span className="text-sm text-gray-500">{avgRating(lowest).toFixed(1)}★</span></>, 'col-span-2')}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-3 border border-gray-200 shadow-card mb-5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 flex-grow">
          <select value={filter.type} onChange={(e) => set({ type: e.target.value })} aria-label="Filter ratings by session type" className={SELECT}>
            <option value="ALL">All types</option>
            {TYPE_KEYS.map((t) => <option key={t} value={t}>{TYPES[t].label}</option>)}
          </select>
          <select value={filter.program} onChange={(e) => set({ program: e.target.value })} aria-label="Filter ratings by program" className={SELECT}>
            <option value="ALL">All programs</option>
            {programs.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select value={filter.stars} onChange={(e) => set({ stars: Number(e.target.value) })} aria-label="Filter by stars" className={SELECT}>
            <option value="0">All stars</option>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{plural(n, 'star')}</option>)}
          </select>
          <select value={filter.sort} onChange={(e) => set({ sort: e.target.value })} aria-label="Sort rated sessions" className={SELECT}>
            <option value="newest">Newest first</option>
            <option value="high">Highest rated</option>
            <option value="low">Lowest rated</option>
          </select>
          <label className="col-span-2 flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 cursor-pointer select-none">
            <input type="checkbox" checked={filter.comments} onChange={(e) => set({ comments: e.target.checked })} className="w-4 h-4 accent-[#7d0a0a]" /> With comments only
          </label>
        </div>
        <span className="text-xs font-semibold text-gray-400 md:text-right">
          {plural(list.length, 'session')} • {plural(list.reduce((n, x) => n + x.reviews.length, 0), 'review')}
        </span>
      </div>

      <div className="space-y-5">
        {list.length
          ? list.map(({ s, reviews }) => (
            <RatingCard
              key={s.id}
              s={s}
              reviews={reviews}
              open={expanded.has(s.id)}
              onToggle={() => setExpanded((e) => { const n = new Set(e); if (n.has(s.id)) n.delete(s.id); else n.add(s.id); return n })}
            />
          ))
          : <EmptyState icon="fa-regular fa-star" title={rated.length ? 'No ratings match these filters' : 'No ratings yet'} text={rated.length ? 'Try another type, program or star filter.' : 'Students rate each session after class. Their ratings show up here.'} />}
      </div>
    </section>
  )
}

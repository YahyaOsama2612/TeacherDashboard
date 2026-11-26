// Maps backend sessions (GET /api/teacher/sessions) to the shape the dashboard screens use,
// and holds the colour coding per session type.
import { minutes, todayISO, tomorrowISO, yesterdayISO, addDays, startOfToday, iso } from './format'

/** The backend's sessionRelationalType values, with the labels and colours from the design. */
export const TYPES = {
  Explanation: {
    label: 'Explanation', icon: 'fa-chalkboard-user', iconBox: 'bg-blue-50 text-math-blue', badge: 'bg-blue-100 text-math-blue',
    bar: 'bg-math-blue', btn: 'border-math-blue text-math-blue hover:bg-math-blue', block: 'bg-blue-50 border-math-blue text-blue-900',
  },
  Mistakes: {
    label: 'Mistakes Correction', icon: 'fa-triangle-exclamation', iconBox: 'bg-red-50 text-math-red', badge: 'bg-red-100 text-math-red',
    bar: 'bg-math-red', btn: 'border-math-red text-math-red hover:bg-math-red', block: 'bg-red-50 border-math-red text-red-900',
  },
  'Re-Explanation': {
    label: 'Re-explanation', icon: 'fa-rotate-left', iconBox: 'bg-orange-50 text-math-orange', badge: 'bg-orange-100 text-orange-600',
    bar: 'bg-math-orange', btn: 'border-math-orange text-math-orange hover:bg-math-orange', block: 'bg-orange-50 border-math-orange text-orange-900',
  },
  Exam: {
    label: 'Exam Proctoring', icon: 'fa-file-signature', iconBox: 'bg-purple-100 text-math-purple', badge: 'bg-purple-100 text-purple-600',
    bar: 'bg-math-purple', btn: 'border-math-purple text-math-purple hover:bg-math-purple', block: 'bg-purple-50 border-math-purple text-purple-900',
  },
}
export const TYPE_KEYS = Object.keys(TYPES)
export const typeOf = (key) => TYPES[key] || TYPES.Explanation

const dateOnly = (v) => (v ? String(v).slice(0, 10) : null)
const hhmm = (v) => (v ? String(v).slice(0, 5) : '00:00')

/** Backend ratings are 1–10; the design shows 1–5 stars. */
export const toStars = (rating) => Math.round((Number(rating) / 2) * 10) / 10

export function mapSession(raw, now = new Date()) {
  const lesson = (raw.lessons || [])[0]
  const date = dateOnly(raw.sessionDate) || dateOnly(raw.startDate) || todayISO()
  const start = hhmm(raw.timeFrom)
  const end = hhmm(raw.timeTo)
  const endAt = new Date(`${dateOnly(raw.endDate) || date}T${end}:00`)

  let status = 'upcoming'
  if (raw.status === 'cancelled') status = 'cancelled'
  else if (endAt < now) status = 'completed'

  const students = (raw.students || []).map((s) => ({ id: s.id, name: s.name, avatar: s.avatar, attendance: s.attendance, chargeStatus: s.chargeStatus ?? null, liveBalance: s.liveBalance ?? null }))

  return {
    id: raw.id,
    raw,
    type: TYPES[raw.sessionRelationalType] ? raw.sessionRelationalType : 'Explanation',
    program: lesson?.category?.name || lesson?.course?.name || 'General',
    lesson: raw.name,
    unit: lesson?.chapter?.name || lesson?.course?.name || lesson?.name || 'Session',
    date,
    endDate: dateOnly(raw.endDate),
    repeat: raw.scheduleType === 'repeat',
    start,
    end,
    status,
    students,
    studentCount: raw.studentsCount ?? students.length,
    meeting: raw.sessionLink || '',
    reviews: (raw.ratings || []).map((r) => ({
      id: r.id,
      student: r.student?.name || 'Student',
      stars: toStars(r.overallRating),
      comment: r.generalComment || '',
    })),
    cancel: status === 'cancelled'
      ? { by: raw.cancelledBy === 'teacher' ? 'You (request approved)' : 'Admin', reason: raw.cancelReason || '' }
      : null,
    docs: sessionDocs(raw),
  }
}

/** Every PDF the teacher can open for a session (official materials + their own explanation PDF). */
export function sessionDocs(raw) {
  const docs = []
  const seen = new Set()
  const add = (url, title, meta, source) => {
    if (!url || seen.has(url)) return
    seen.add(url)
    docs.push({ id: url, url, title, meta, source })
  }
  ;(raw.materials || []).forEach((m) => {
    add(m.session_pdf, `${m.name} — Blank`, 'Student copy', 'Official')
    add(m.session_answers_pdf, `${m.name} — Answers`, 'Teacher copy', 'Official')
  })
  add(raw.session_pdf, 'Session worksheet', 'Student copy', 'Official')
  add(raw.session_answers_pdf, 'Model answers', 'Teacher copy', 'Official')
  add(raw.teacher_explanation_pdf, 'Your explanation PDF', 'Published to students', 'Teacher')
  return docs
}

export const byKey = (a, b) => (a.date + a.start).localeCompare(b.date + b.start)
export const avgOf = (reviews) => (reviews.length ? reviews.reduce((n, r) => n + r.stars, 0) / reviews.length : 0)
export const avgRating = (s) => avgOf(s.reviews || [])
export const durMin = (s) => minutes(s.end) - minutes(s.start)

/**
 * Students of an upcoming session who have no live session for it: not charged yet and 0 sessions left.
 * They can't press Join themselves; the teacher can still mark them attended (saved as "Not paid").
 */
export const noBalanceStudents = (s) => (s.status === 'upcoming'
  ? (s.students || []).filter((st) => !st.chargeStatus && st.liveBalance === 0 && st.attendance !== 'absent')
  : [])
export const hasNoBalance = (st) => !st.chargeStatus && st.liveBalance === 0

/** Attendance can be taken on the session day and after it. */
export const canTakeAttendance = (s) => s.status === 'completed' || (s.status === 'upcoming' && s.date <= todayISO())

export function attCounts(s, record) {
  const c = { present: 0, absent: 0 }
  s.students.forEach((st) => {
    const v = record ? record[st.id] : st.attendance
    if (v === 'present' || v === 'absent') c[v]++
  })
  c.marked = c.present + c.absent
  return c
}

export function dateMatch(s, f, ctx) {
  const today = todayISO()
  switch (f) {
    case 'today': return s.date === today
    case 'tomorrow': return s.date === tomorrowISO()
    case 'yesterday': return s.date === yesterdayISO()
    case 'week': return s.date >= iso(addDays(startOfToday(), -7)) && s.date <= today
    case 'upcoming': return s.date >= today
    case 'past': return s.date < today
    case 'range': return s.date >= ctx.range.from && s.date <= ctx.range.to
    case 'date': return s.date === ctx.picked
    default: return true
  }
}

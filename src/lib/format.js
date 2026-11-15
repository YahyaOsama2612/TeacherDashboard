// Date / time helpers. Dates are 'YYYY-MM-DD' strings in the teacher's local time, times are 'HH:MM'.

export const pad = (n) => String(n).padStart(2, '0')
export const MON3 = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
export const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseISO = (s) => {
  const [y, m, d] = String(s).slice(0, 10).split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (d, n) => {
  const x = new Date(d)
  x.setDate(x.getDate() + n)
  return x
}
export const startOfToday = () => {
  const n = new Date()
  return new Date(n.getFullYear(), n.getMonth(), n.getDate())
}
export const todayISO = () => iso(startOfToday())
export const tomorrowISO = () => iso(addDays(startOfToday(), 1))
export const yesterdayISO = () => iso(addDays(startOfToday(), -1))

export const minutes = (t) => {
  const [h, m] = String(t).split(':').map(Number)
  return h * 60 + (m || 0)
}
export const fmtTime = (t) => {
  if (!t) return ''
  let [h, m] = String(t).split(':').map(Number)
  const ap = h >= 12 && h < 24 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${pad(h)}:${pad(m || 0)} ${ap}`
}
export const shortTime = (t) => {
  let [h, m] = String(t).split(':').map(Number)
  const ap = h >= 12 && h < 24 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}${m ? ':' + pad(m) : ''} ${ap}`
}
export const hourLabel = (h) => (h === 0 || h === 24 ? '12 AM' : h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`)
export const fmtDur = (m) => (m >= 60 ? `${Math.floor(m / 60)} h${m % 60 ? ` ${m % 60} min` : ''}` : `${m} min`)
export const fmtHours = (h) => `${h % 1 ? h.toFixed(1) : h}h`

export const fmtDate = (s) => {
  const d = parseISO(s)
  return `${DOW[d.getDay()]}, ${MON3[d.getMonth()]} ${d.getDate()}`
}
export const fmtLongDate = (s) => {
  const d = parseISO(s)
  return `${DOW_LONG[d.getDay()]}, ${MON3[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}
export const relDay = (s) => {
  if (s === todayISO()) return 'Today'
  if (s === tomorrowISO()) return 'Tomorrow'
  if (s === yesterdayISO()) return 'Yesterday'
  return fmtDate(s)
}
export const fmtStamp = (value) => {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return `${MON3[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}
export const timeAgo = (value) => {
  const d = new Date(value)
  const diff = (Date.now() - d.getTime()) / 1000
  if (Number.isNaN(diff)) return ''
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`
  if (diff < 172800) return 'Yesterday'
  return fmtStamp(value)
}

export const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`
export const initials = (name = '') =>
  name
    .replace(/^(mr|mrs|ms|dr)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('') || '?'
export const firstName = (name = '') => {
  const m = name.match(/^((?:mr|mrs|ms|dr)\.?\s+)?(\S+)/i)
  return m ? `${m[1] || ''}${m[2]}`.trim() : name
}

/** 30-minute steps from 08:00 to 24:00 */
export const TIME_SLOTS = (() => {
  const out = []
  for (let m = 8 * 60; m <= 24 * 60; m += 30) out.push(`${pad(Math.floor(m / 60))}:${pad(m % 60)}`)
  return out
})()

// Small building blocks shared by every screen (same markup as the MathPortal design).
import { useEffect } from 'react'
import { typeOf } from '../lib/sessions'
import { initials, todayISO, tomorrowISO, fmtDate } from '../lib/format'

export const SMALL_BTN =
  'bg-white border border-gray-200 hover:border-math-red hover:text-math-red text-gray-600 text-xs font-bold py-2 px-2 whitespace-nowrap rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none'
export const SELECT =
  'min-w-0 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-math-red'
export const FIELD =
  'mt-1 w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-math-red'

export function Stars({ value = 0, className = 'text-xs' }) {
  const icons = []
  for (let i = 1; i <= 5; i++) {
    const icon = value >= i ? 'fa-solid fa-star' : value >= i - 0.5 ? 'fa-solid fa-star-half-stroke' : 'fa-regular fa-star'
    icons.push(<i key={i} className={icon} aria-hidden="true"></i>)
  }
  return (
    <span className={`inline-flex gap-0.5 text-yellow-400 ${className}`} role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {icons}
    </span>
  )
}

export const PillBadge = ({ cls, icon, children }) => (
  <span className={`text-xs font-bold ${cls} px-2 py-1 rounded-full border flex items-center gap-1 whitespace-nowrap`}>
    {icon && <i className={icon}></i>}
    {children}
  </span>
)

export const TypeBadge = ({ type }) => (
  <span className={`${typeOf(type).badge} text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded`}>{typeOf(type).label}</span>
)

export const ProgramBadge = ({ program }) => (
  <span className="bg-gray-900 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">{program}</span>
)

export const Avatar = ({ name, size = 'w-8 h-8' }) => (
  <div className={`${size} rounded-full bg-math-red/10 text-math-red text-xs font-bold flex items-center justify-center shrink-0`} aria-hidden="true">
    {initials(name)}
  </div>
)

const CHIP_ON = 'bg-math-red text-white border-math-red shadow-sm'
const CHIP_OFF = 'bg-white text-gray-600 border-gray-200 hover:border-math-red hover:text-math-red'
export const Chip = ({ on, onClick, count, children }) => (
  <button
    onClick={onClick}
    aria-pressed={on}
    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${on ? CHIP_ON : CHIP_OFF}`}
  >
    {children}
    {count !== undefined && (
      <span className={`${on ? 'bg-white/20' : 'bg-gray-100 text-gray-500'} px-1.5 rounded-full text-[10px]`}>{count}</span>
    )}
  </button>
)

export function EmptyState({ icon, title, text, action }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-12 text-center col-span-full">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center text-2xl mx-auto mb-4">
        <i className={icon}></i>
      </div>
      <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto">{text}</p>
      {action}
    </div>
  )
}

/** Session status pill: completed / cancelled / up next / later today / tomorrow / date */
export function StatusBadge({ s, isNext }) {
  if (s.status === 'completed') return <PillBadge cls="text-math-success bg-green-50 border-green-100" icon="fa-solid fa-check text-[10px]">COMPLETED</PillBadge>
  if (s.status === 'cancelled') return <PillBadge cls="text-red-600 bg-red-50 border-red-100" icon="fa-solid fa-ban text-[10px]">CANCELLED</PillBadge>
  if (isNext) return <PillBadge cls="text-yellow-600 bg-yellow-50 border-yellow-100" icon="fa-solid fa-circle text-[8px]">UP NEXT</PillBadge>
  if (s.date === todayISO()) return <PillBadge cls="text-gray-500 bg-gray-100 border-gray-200">LATER TODAY</PillBadge>
  if (s.date === tomorrowISO()) return <PillBadge cls="text-math-blue bg-blue-50 border-blue-100">TOMORROW</PillBadge>
  return <PillBadge cls="text-gray-500 bg-gray-100 border-gray-200">{fmtDate(s.date).toUpperCase()}</PillBadge>
}

/** Bottom sheet on phones, centered dialog from sm: up. Closes on backdrop click and Escape. */
export function Modal({ onClose, labelledBy, maxWidth = 'max-w-lg', z = 'z-[100]', children }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', onKey)
    document.body.classList.add('overflow-hidden')
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('overflow-hidden')
    }
  }, [onClose])
  return (
    <div
      className={`fixed inset-0 ${z} flex items-end sm:items-center justify-center bg-gray-900/60 backdrop-blur-sm sm:p-4 fade-in`}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col`} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {children}
      </div>
    </div>
  )
}

export const ModalHeader = ({ id, title, icon, meta, onClose, children }) => (
  <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-start gap-4 shrink-0">
    <div className="min-w-0">
      {children}
      <h3 id={id} className="text-lg font-bold text-gray-900 flex items-center gap-2">
        {icon && <i className={`${icon} text-math-red`}></i>} {title}
      </h3>
      {meta && <p className="text-xs text-gray-500 mt-0.5">{meta}</p>}
    </div>
    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" aria-label="Close">
      <i className="fa-solid fa-xmark text-xl"></i>
    </button>
  </div>
)

export function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-gray-500">
      <i className="fa-solid fa-circle-notch animate-spin text-math-red"></i> {label}
    </div>
  )
}

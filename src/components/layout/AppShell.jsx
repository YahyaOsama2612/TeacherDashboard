import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useTeacherData } from '../../context/TeacherDataContext'
import { useAuth } from '../../hooks/useAuth'
import { fmtLongDate, fmtTime, initials, relDay, timeAgo, todayISO } from '../../lib/format'
import ModalHost from '../modals/ModalHost'

const TITLES = { dashboard: 'Dashboard', sessions: 'Sessions', students: 'My Students', ratings: 'Ratings', requests: 'Requests', profile: 'My Profile', workspace: 'Workspace' }
const SIDEBAR_KEY = 'mp_t_sidebar'

const NAV = [
  { to: '/dashboard', icon: 'fa-solid fa-gauge-high', label: 'Dashboard', short: 'Home' },
  { to: '/sessions', icon: 'fa-solid fa-layer-group', label: 'Sessions', short: 'Sessions' },
  { to: '/students', icon: 'fa-solid fa-user-graduate', label: 'My Students', short: 'Students' },
  { to: '/ratings', icon: 'fa-solid fa-star', label: 'Ratings', short: 'Ratings' },
  { to: '/requests', icon: 'fa-regular fa-envelope', label: 'Requests', short: 'Requests' },
]
// Phones: four main sections on the bottom bar, the rest under "More".
const MOBILE_MAIN = NAV.filter((n) => ['/dashboard', '/sessions', '/students', '/requests'].includes(n.to))
const MOBILE_MORE = [
  ...NAV.filter((n) => !MOBILE_MAIN.includes(n)),
  { to: '/profile', icon: 'fa-solid fa-user', label: 'My Profile' },
]

function readCollapsed() {
  try {
    const v = localStorage.getItem(SIDEBAR_KEY)
    return v ? v === 'collapsed' : window.innerWidth < 1280
  } catch {
    return false
  }
}

function NotificationBell() {
  const { notifications, unreadNotifications, markNotificationsRead } = useTeacherData()
  const [open, setOpen] = useState(false)
  const wrap = useRef(null)

  useEffect(() => {
    const close = (e) => { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const openItem = (n) => {
    if (!n.isRead) markNotificationsRead([n.id])
    const link = n.materialLink || n.materialFile
    if (link) window.open(link, '_blank', 'noopener')
  }

  return (
    <div ref={wrap} className="relative">
      <button onClick={() => setOpen((o) => !o)} title="Notifications" aria-label="Notifications" aria-expanded={open} className={`nt-bell ${open ? 'open' : ''}`}>
        <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path>
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path>
        </svg>
        {unreadNotifications > 0 && <span className="nt-badge">{unreadNotifications > 9 ? '9+' : unreadNotifications}</span>}
      </button>
      {open && (
        <div className="nt-panel">
          <div className="nt-head">
            <span className="nt-title">
              Notifications{unreadNotifications > 0 && <span className="nt-count">{unreadNotifications} new</span>}
            </span>
            {unreadNotifications > 0 && <button className="nt-link" onClick={() => markNotificationsRead()}>Mark all as read</button>}
          </div>
          <div className="nt-list">
            {notifications.length ? notifications.map((n) => (
              <button key={n.id} onClick={() => openItem(n)} className={`nt-item ${n.isRead ? '' : 'unread'}`}>
                <span className="nt-icon"><i className={`fa-solid ${n.materialLink || n.materialFile ? 'fa-link' : 'fa-bell'}`}></i></span>
                <span className="nt-body">
                  <span className="nt-text">{n.text}</span>
                  <span className="nt-meta">{timeAgo(n.dateTime)} · MathPortal Admin</span>
                </span>
                {!n.isRead && <span className="nt-dot"></span>}
              </button>
            )) : <p className="nt-empty">You are all caught up.</p>}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AppShell() {
  const { user, logout } = useAuth()
  const { profile, nextSession, pendingRequests, sessions, toast } = useTeacherData()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  const [moreOpen, setMoreOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const tab = location.pathname.split('/')[1] || 'dashboard'
  const name = profile?.name || user?.name || 'Teacher'
  const role = profile?.categoryName ? `${profile.categoryName} Teacher` : 'Math Teacher'
  const todayCount = sessions.filter((s) => s.status === 'upcoming' && s.date === todayISO()).length

  useEffect(() => {
    document.title = `${TITLES[tab] || 'Teacher'} · MathPortal Teacher`
    window.scrollTo(0, 0)
  }, [tab])

  const toggleSide = () => {
    setCollapsed((c) => {
      try { localStorage.setItem(SIDEBAR_KEY, c ? 'open' : 'collapsed') } catch { /* storage blocked */ }
      return !c
    })
  }

  const moreActive = MOBILE_MORE.some((n) => location.pathname.startsWith(n.to))
  const moreCount = MOBILE_MORE.reduce((sum, n) => sum + badgeFor(n.to), 0)

  useEffect(() => { setMoreOpen(false) }, [location.pathname])
  useEffect(() => {
    if (!moreOpen) return undefined
    const esc = (e) => e.key === 'Escape' && setMoreOpen(false)
    document.addEventListener('keydown', esc)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', esc); document.body.style.overflow = prev }
  }, [moreOpen])

  function badgeFor(to) {
    if (to === '/requests') return pendingRequests
    if (to === '/sessions') return todayCount
    return 0
  }

  return (
    <div className={`t-shell ${collapsed ? 't-collapsed' : ''}`}>
      {/* Sidebar (desktop) */}
      <aside className="t-side" aria-label="Teacher navigation">
        <div className="t-side-head flex items-center gap-3 px-5 h-16 border-b border-gray-100 shrink-0">
          <img src="/favicon.svg" alt="MathPortal" className="w-9 h-9 rounded-lg shadow-sm" />
          <div className="t-brand-txt leading-tight min-w-0">
            <div className="font-bold text-lg text-gray-900 tracking-tight whitespace-nowrap">Math<span className="text-math-red">Portal</span></div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Teacher portal</div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="t-menu-h px-3 pt-2 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Menu</p>
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} className="t-nav" title={n.label}>
              <i className={`${n.icon} w-5 text-center`}></i>
              <span className="t-lbl">{n.label}</span>
              {badgeFor(n.to) > 0 && <span className="t-note-badge">{badgeFor(n.to)}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100 space-y-3 shrink-0">
          {nextSession && (
            <button onClick={() => navigate(`/workspace/${nextSession.id}`)} className="t-side-next w-full text-left rounded-xl bg-red-50 border border-red-100 p-3 hover:border-math-red transition-colors">
              <p className="text-[10px] font-extrabold text-math-red uppercase tracking-widest mb-1">Next session</p>
              <p className="text-sm font-bold text-gray-900 truncate">{nextSession.lesson}</p>
              <p className="text-xs text-gray-500">{relDay(nextSession.date)} · {fmtTime(nextSession.start)}</p>
            </button>
          )}
          <NavLink to="/profile" className="t-side-me w-full flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-gray-50 text-left" title="Open my profile">
            <span className="w-9 h-9 rounded-full bg-math-red text-white flex items-center justify-center font-bold text-sm shrink-0">{initials(name)}</span>
            <span className="t-me-txt min-w-0">
              <span className="block text-sm font-bold text-gray-900 truncate">{name}</span>
              <span className="block text-[11px] text-gray-500">{role}</span>
            </span>
            <i className="t-me-txt fa-solid fa-chevron-right text-[10px] text-gray-300 ml-auto"></i>
          </NavLink>
          <button type="button" onClick={logout} className="t-nav w-full !text-red-600 hover:!bg-red-50" title="Sign out">
            <i className="fa-solid fa-arrow-right-from-bracket w-5 text-center"></i>
            <span className="t-lbl">Sign out</span>
          </button>
        </div>
      </aside>

      {/* Top bar */}
      <header className="bg-white/95 backdrop-blur border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 gap-3">
            <div className="flex items-center gap-3 shrink-0 lg:hidden">
              <img src="/favicon.svg" alt="MathPortal" className="w-8 h-8 rounded-lg shadow-sm" />
              <span className="font-bold text-xl text-gray-950 tracking-tight">
                Math<span className="text-math-red">Portal</span>{' '}
                <span className="hidden sm:inline text-xs font-semibold px-2 py-0.5 rounded-full bg-math-red/10 text-math-red ml-1 align-middle">Teacher</span>
              </span>
            </div>
            <div className="hidden lg:flex items-center gap-3 min-w-0 mr-auto">
              <button onClick={toggleSide} className="w-9 h-9 -ml-2 rounded-lg inline-flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-900 shrink-0" title={collapsed ? 'Show sidebar' : 'Hide sidebar'} aria-label="Toggle sidebar" aria-expanded={!collapsed}>
                <i className="fa-solid fa-bars"></i>
              </button>
              <div className="min-w-0">
                <h2 className="text-base font-bold text-gray-900 leading-tight">{TITLES[tab] || 'Workspace'}</h2>
                <p className="text-xs text-gray-400">{fmtLongDate(todayISO())}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <NotificationBell />
              <button onClick={() => navigate('/profile')} className="flex items-center gap-3 rounded-xl px-2 py-1 hover:bg-gray-50 transition-colors shrink-0" title="Open my profile" aria-label="Open my profile">
                <div className="text-right hidden lg:block">
                  <div className="text-xs font-bold text-gray-900">{name}</div>
                  <div className="text-[10px] text-gray-500">{role} • View profile</div>
                </div>
                <div className="w-9 h-9 rounded-full bg-math-red text-white flex items-center justify-center font-bold text-sm shadow">{initials(name)}</div>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow flex flex-col max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {tab === 'workspace' ? (
          // The workspace is a fixed overlay; keep it out of the animated wrapper (a CSS transform
          // would make "fixed" relative to that wrapper instead of the window).
          <Outlet />
        ) : (
          <div key={tab} className="flex flex-col flex-grow fade-in">
            <Outlet />
          </div>
        )}
      </main>

      {/* Bottom bar (phones / tablets): main sections + "More" */}
      <nav className="t-mbar lg:hidden" aria-label="Teacher sections">
        {MOBILE_MAIN.map((n) => (
          <NavLink key={n.to} to={n.to} className="t-mnav">
            <i className={n.icon}></i>
            <span>{n.short}</span>
            {badgeFor(n.to) > 0 && <span className="t-note-badge">{badgeFor(n.to)}</span>}
          </NavLink>
        ))}
        <button type="button" onClick={() => setMoreOpen(true)} className="t-mnav" aria-haspopup="dialog" aria-expanded={moreOpen}
          aria-current={moreActive ? 'page' : undefined}>
          <i className="fa-solid fa-ellipsis"></i>
          <span>More</span>
          {moreCount > 0 && <span className="t-note-badge">{moreCount}</span>}
        </button>
      </nav>

      {moreOpen && (
        <div className="t-sheet-wrap lg:hidden" onClick={() => setMoreOpen(false)}>
          <div className="t-sheet" role="dialog" aria-modal="true" aria-label="More sections" onClick={(e) => e.stopPropagation()}>
            <div className="t-sheet-grip" aria-hidden="true"></div>
            <div className="flex items-center justify-between px-5 pb-3">
              <p className="text-base font-bold text-gray-900">More</p>
              <button type="button" onClick={() => setMoreOpen(false)} className="w-9 h-9 rounded-full inline-flex items-center justify-center text-gray-500 hover:bg-gray-100" aria-label="Close">
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2 px-4 pb-3">
              {MOBILE_MORE.map((n) => (
                <NavLink key={n.to} to={n.to} onClick={() => setMoreOpen(false)} className="t-sheet-item">
                  <i className={`${n.icon} text-lg`}></i>
                  <span>{n.label}</span>
                  {badgeFor(n.to) > 0 && <span className="t-note-badge">{badgeFor(n.to)}</span>}
                </NavLink>
              ))}
              <button type="button" onClick={() => { setMoreOpen(false); logout() }} className="t-sheet-item !text-red-600">
                <i className="fa-solid fa-arrow-right-from-bracket text-lg"></i>
                <span>Sign out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <ModalHost />

      {toast && (
        <div className="fixed bottom-20 lg:bottom-6 right-6 left-6 sm:left-auto z-[120] bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 fade-in" role="status" aria-live="polite">
          <i className={`fa-solid ${toast.icon} text-green-400`}></i> {toast.message}
        </div>
      )}
    </div>
  )
}

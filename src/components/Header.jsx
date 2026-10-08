import { useAuth } from '../hooks/useAuth'

const TABS = [
  { id: 'schedule', label: 'My Schedule' },
  { id: 'students', label: 'My Students' },
  { id: 'sessions', label: 'Past Sessions' },
]

export default function Header({ activeView, onNavigate, onOpenLogin }) {
  const { user, isAuthenticated, logout } = useAuth()

  const displayName =
    user?.name ||
    user?.first_name ||
    user?.full_name ||
    user?.email ||
    'Teacher'

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('schedule')}>
            <div className="w-8 h-8 bg-math-red text-white rounded flex items-center justify-center font-bold text-lg">
              π
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">
              MathPortal <span className="text-sm font-normal text-gray-500 ml-1">| Teacher</span>
            </span>
          </div>

          {/* Main Navigation Tabs */}
          <nav className="hidden md:flex space-x-8 h-full">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id)}
                className={
                  activeView === tab.id
                    ? 'text-math-red font-bold border-b-2 border-math-red py-5 transition-all h-full flex items-center'
                    : 'text-gray-500 hover:text-gray-900 font-medium border-b-2 border-transparent py-5 transition-all h-full flex items-center'
                }
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Profile & Auth */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">
                    {displayName}
                  </div>
                  <div className="text-xs text-green-600 font-medium flex items-center justify-end gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                    Online
                  </div>
                </div>
                <div className="w-9 h-9 rounded-full bg-math-red/10 text-math-red flex items-center justify-center font-semibold text-sm">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <button
                  onClick={logout}
                  title="Logout"
                  className="text-xs text-gray-500 hover:text-math-red px-2 py-1 rounded border border-gray-200 hover:border-math-red/30 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-2 bg-math-red hover:bg-math-red-hover text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition-all"
              >
                <span>Teacher Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}


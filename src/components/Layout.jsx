import { NavLink, Outlet, useLocation } from 'react-router-dom'

const NAV = [
  { to: '/', label: '홈', icon: HomeIcon },
  { to: '/routines', label: '루틴', icon: ListIcon },
  { to: '/workout', label: '운동', icon: PlayIcon, main: true },
  { to: '/history', label: '기록', icon: ChartIcon },
  { to: '/settings', label: '설정', icon: SettingsIcon },
]

export default function Layout() {
  const location = useLocation()

  return (
    <div className="flex flex-col min-h-svh max-w-lg mx-auto">
      <main key={location.pathname} className="flex-1 overflow-y-auto pb-24 animate-pagein safe-top">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto">
        <div className="bg-[#0d0d12]/95 border-t border-white/5 safe-bottom backdrop-blur-sm">
          <div className="flex justify-around items-center h-14">
            {NAV.map(({ to, label, icon: Icon, main }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                className={({ isActive }) =>
                  `relative flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-all duration-200 ${
                    isActive ? 'text-[#a855f7]' : 'text-slate-600'
                  } ${main ? '-mt-3' : ''}`
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && !main && (
                      <span className="absolute -top-0 w-4 h-0.5 rounded-full bg-[#a855f7]" />
                    )}
                    <Icon active={isActive} />
                    <span className="font-medium">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>
    </div>
  )
}

function HomeIcon({ active }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function ListIcon({ active }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  )
}

function PlayIcon({ active }) {
  return (
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all duration-200 ${
      active ? 'bg-[#a855f7] scale-105 shadow-[#a855f7]/40' : 'bg-[#a855f7]/90 shadow-[#a855f7]/20'
    }`}>
      <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z" />
      </svg>
    </div>
  )
}

function ChartIcon({ active }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function SettingsIcon({ active }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

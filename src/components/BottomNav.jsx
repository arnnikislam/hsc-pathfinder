import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LayoutDashboard, Trophy, BookOpen, User, Code2 } from 'lucide-react'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'nav.dashboard' },
  { to: '/leaderboard', icon: Trophy, key: 'nav.leaderboard' },
  { to: '/routine', icon: BookOpen, key: 'nav.routine' },
  { to: '/account', icon: User, key: 'nav.account' },
  { to: '/developer', icon: Code2, key: 'nav.developer' },
]

export default function BottomNav() {
  const { t, i18n } = useTranslation()
  const isBn = i18n.language === 'bn'

  return (
    <nav className="bottom-nav bg-surface-800/90 backdrop-blur-xl border-t border-white/10">
      <div className="grid grid-cols-5 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-3 gap-0.5 transition-all duration-200 relative ${
                isActive ? 'text-brand-400' : 'text-white/40 hover:text-white/70'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-brand-400 rounded-full" />
                )}
                <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className={`text-[9px] font-display ${isBn ? 'font-bengali text-[8px]' : ''}`}>
                  {t(key)}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

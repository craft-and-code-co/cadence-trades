import { NavLink } from 'react-router-dom'
import { Icon } from '@/components/ui/icon'

const NAV_ITEMS = [
  { to: '/', icon: 'dashboard', label: 'Briefing' },
  { to: '/coach', icon: 'forum', label: 'Coach' },
  { to: '/insights', icon: 'analytics', label: 'Insights' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
]

export function MobileNav() {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-surface-container-low z-50 glass-surface">
      <div className="flex justify-around py-2">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-1.5 text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-on-surface-variant'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={icon} filled={isActive} size={22} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

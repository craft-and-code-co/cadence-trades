import { NavLink } from 'react-router-dom'
import { Icon } from '@/components/ui/icon'
import { useAuth } from '@/hooks/useAuth'
import { useCompanyProfile } from '@/hooks/useCompanyProfile'

const NAV_ITEMS = [
  { to: '/', icon: 'dashboard', label: 'Weekly Briefing' },
  { to: '/coach', icon: 'forum', label: 'Coach Chat' },
  { to: '/insights', icon: 'analytics', label: 'Insights' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
]

export function Sidebar() {
  const { user } = useAuth()
  const { profile } = useCompanyProfile()

  return (
    <aside className="hidden md:flex flex-col h-screen py-8 px-5 w-64 fixed left-0 top-0 bg-surface-container-low z-40">
      {/* Logo */}
      <div className="mb-12 px-1">
        <h1 className="text-xl font-extrabold tracking-tight text-primary font-headline italic">
          Cadence Trades
        </h1>
        <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-[0.2em] mt-1.5 opacity-60">
          Chief of Staff
        </p>
      </div>

      {/* New Inquiry CTA */}
      <button className="mb-8 w-full py-3.5 px-4 bg-primary-container text-on-primary-container font-bold rounded-xl flex items-center justify-center gap-2 hover:brightness-110 transition-all active:scale-[0.98] shadow-lg shadow-primary-container/10">
        <Icon name="add" size={18} />
        <span className="text-sm">New Inquiry</span>
      </button>

      {/* Navigation */}
      <nav className="flex-1 space-y-1.5">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3.5 py-3 px-4 transition-all active:scale-[0.98] duration-200 ${
                isActive
                  ? 'text-primary font-bold border-r-4 border-primary bg-primary/5 rounded-none'
                  : 'text-on-surface-variant font-medium hover:bg-surface-container hover:text-on-surface rounded-xl'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon name={icon} filled={isActive} />
                <span className="text-sm">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User profile */}
      <div className="pt-8 mt-auto">
        <div className="flex items-center gap-3 px-1">
          <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
            <Icon name="person" className="text-on-surface-variant" />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold truncate text-on-surface">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
            </p>
            <p className="text-[10px] text-on-surface-variant truncate font-medium uppercase tracking-wider">
              {profile?.company_name || 'Business Owner'}
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

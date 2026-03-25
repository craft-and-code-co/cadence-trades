import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, MessageCircle, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Briefing', icon: LayoutDashboard },
  { to: '/coach', label: 'Coach', icon: MessageCircle },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function MobileNav() {
  const location = useLocation()

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-sidebar border-t border-sidebar-border z-50">
      <div className="flex justify-around py-2">
        {navItems.map(({ to, label, icon: Icon }) => {
          const active = location.pathname === to
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-1 text-xs font-medium transition-colors',
                active
                  ? 'text-sidebar-primary'
                  : 'text-sidebar-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

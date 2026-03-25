import { useAuth } from '@/hooks/useAuth'
import { useCompanyProfile } from '@/hooks/useCompanyProfile'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Morning'
  if (hour < 17) return 'Afternoon'
  return 'Evening'
}

export default function Briefing() {
  const { user } = useAuth()
  const { profile } = useCompanyProfile()

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'there'

  return (
    <div className="space-y-12">
      {/* Greeting */}
      <header className="space-y-3">
        <h1 className="text-4xl font-extrabold font-headline tracking-tight text-on-surface">
          {getGreeting()}, {name}. Here's what's happening with{' '}
          <span className="text-primary">{profile?.company_name || 'your business'}.</span>
        </h1>
        <p className="text-on-surface-variant text-lg max-w-3xl leading-relaxed">
          Your Chief of Staff has analyzed the last 7 days of operations.
          {!profile?.onboarding_complete
            ? ' Complete onboarding and add data to unlock your full briefing.'
            : ' Insights will appear here once we have enough data.'}
        </p>
      </header>

      {/* KPI Placeholder */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['Revenue This Week', 'Jobs Completed', 'Avg Ticket Price'].map((label) => (
          <div
            key={label}
            className="bg-surface-container p-7 rounded-xl"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-2">
              {label}
            </p>
            <span className="text-3xl font-extrabold font-headline text-on-surface-variant/30">
              —
            </span>
            <p className="text-[11px] text-on-surface-variant mt-4 font-medium opacity-60">
              Awaiting data
            </p>
          </div>
        ))}
      </section>

      {/* Empty state for insights */}
      <section className="bg-surface-container p-10 rounded-2xl text-center">
        <p className="text-on-surface-variant text-lg">
          Your weekly briefing and AI-powered insights will appear here once you've imported data.
        </p>
      </section>
    </div>
  )
}

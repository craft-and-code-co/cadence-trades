import { useCompanyProfile } from '@/hooks/useCompanyProfile'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function TopBar() {
  const { profile } = useCompanyProfile()

  const greeting = profile
    ? `${getGreeting()}, ${profile.company_name}.`
    : getGreeting()

  return (
    <header className="border-b border-border px-6 py-4">
      <h2 className="text-lg font-semibold text-foreground">{greeting}</h2>
    </header>
  )
}

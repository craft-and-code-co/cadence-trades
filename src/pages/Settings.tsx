import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'

export default function SettingsPage() {
  const { signOut } = useAuth()

  return (
    <div className="space-y-12">
      <header>
        <h2 className="text-4xl font-extrabold tracking-tight font-headline text-on-surface mb-2">
          Account Settings
        </h2>
        <p className="text-on-surface-variant font-medium">
          Manage your operational preferences and connected data ecosystems.
        </p>
      </header>

      {/* Placeholder sections */}
      <div className="space-y-8">
        <section className="bg-surface-container rounded-xl p-8">
          <h4 className="text-lg font-bold font-headline mb-4 flex items-center gap-2">
            Company Profile
            <span className="h-[2px] w-8 bg-primary-container/30" />
          </h4>
          <p className="text-on-surface-variant">
            Company profile settings will be available here — trade, team size, revenue range, and more.
          </p>
        </section>

        <section className="bg-surface-container rounded-xl p-8">
          <h4 className="text-lg font-bold font-headline mb-4 flex items-center gap-2">
            Data Sources
            <span className="h-[2px] w-8 bg-primary-container/30" />
          </h4>
          <p className="text-on-surface-variant">
            Connected integrations and import history will appear here.
          </p>
        </section>

        <div className="pt-4">
          <Button variant="ghost" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </div>
    </div>
  )
}

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useCompanyProfile } from '@/hooks/useCompanyProfile'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useCompanyProfile()
  const location = useLocation()

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Redirect to onboarding if profile isn't complete (unless on onboarding or import flows)
  const bypassPaths = ['/onboarding', '/import/csv', '/import/manual']
  if (!profile?.onboarding_complete && !bypassPaths.includes(location.pathname)) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}

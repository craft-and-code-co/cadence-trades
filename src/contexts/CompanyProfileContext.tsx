import { createContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import type { CompanyProfile } from '@/types/database'

export interface CompanyProfileContextType {
  profile: CompanyProfile | null
  loading: boolean
  refetch: () => Promise<void>
}

export const CompanyProfileContext = createContext<CompanyProfileContextType | undefined>(undefined)

export function CompanyProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const userId = user?.id

  useEffect(() => {
    if (!userId) {
      setProfile(null)
      setLoading(false)
      return
    }

    // User just became available — mark as loading until we fetch the profile
    setLoading(true)

    let cancelled = false

    supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Error fetching company profile:', error)
          setLoading(false)
          return
        }
        setProfile(data)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [userId])

  const refetch = useCallback(async () => {
    if (!userId) return

    const { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Error fetching company profile:', error)
      return
    }
    setProfile(data)
  }, [userId])

  return (
    <CompanyProfileContext.Provider value={{ profile, loading, refetch }}>
      {children}
    </CompanyProfileContext.Provider>
  )
}

import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { CompanyProfile } from '@/types/database'

export function useCompanyProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true

    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    let cancelled = false

    supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) {
          console.error('Error fetching company profile:', error)
        }
        setProfile(data)
        setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const refetch = useCallback(async () => {
    if (!user) return

    const { data, error } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('Error fetching company profile:', error)
    }
    setProfile(data)
  }, [user])

  return { profile, loading, refetch }
}

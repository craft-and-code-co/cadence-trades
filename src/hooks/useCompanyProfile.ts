import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { CompanyProfile } from '@/types/database'

export function useCompanyProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<CompanyProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    async function fetchProfile() {
      const { data, error } = await supabase
        .from('company_profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle()

      if (error) {
        console.error('Error fetching company profile:', error)
      }
      setProfile(data)
      setLoading(false)
    }

    fetchProfile()
  }, [user])

  return { profile, loading }
}

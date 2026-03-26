import { useContext } from 'react'
import { CompanyProfileContext, type CompanyProfileContextType } from '@/contexts/CompanyProfileContext'

export function useCompanyProfile(): CompanyProfileContextType {
  const context = useContext(CompanyProfileContext)
  if (!context) {
    throw new Error('useCompanyProfile must be used within a CompanyProfileProvider')
  }
  return context
}

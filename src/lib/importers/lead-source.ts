import type { LeadSource } from '@/types/database'

export const LEAD_SOURCE_VALUES: LeadSource[] = ['google', 'facebook', 'referral', 'repeat', 'other']

/** Normalize a raw string to a valid LeadSource or null */
export function normalizeLeadSource(raw: string | null | undefined): LeadSource | null {
  if (!raw) return null
  const lower = raw.trim().toLowerCase()

  if (LEAD_SOURCE_VALUES.includes(lower as LeadSource)) return lower as LeadSource

  // Common aliases
  if (lower.includes('google') || lower === 'ppc' || lower === 'sem') return 'google'
  if (lower.includes('facebook') || lower.includes('meta') || lower === 'fb') return 'facebook'
  if (lower.includes('referral') || lower === 'word of mouth' || lower === 'wom') return 'referral'
  if (lower.includes('repeat') || lower === 'existing' || lower === 'return') return 'repeat'

  return 'other'
}

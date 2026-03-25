import type {
  Trade,
  RevenueRange,
  FieldServicePlatform,
  AdPlatform,
  PainPoint,
} from '@/types/database'

export interface OnboardingData {
  // Step 1: Business Basics
  company_name: string
  trade: Trade | ''
  service_area: string
  years_in_business: string
  revenue_range: RevenueRange | ''

  // Step 2: Team Structure
  tech_count: string
  admin_count: string
  has_dispatcher: boolean
  has_service_manager: boolean
  avg_tech_hourly_cost: string

  // Step 3: Current Tools
  field_service_platform: FieldServicePlatform | ''
  tracks_marketing: string
  runs_paid_ads: AdPlatform | ''
  has_membership: boolean
  membership_description: string

  // Step 4: Goals
  pain_points: PainPoint[]
  success_vision: string
}

export const INITIAL_ONBOARDING_DATA: OnboardingData = {
  company_name: '',
  trade: '',
  service_area: '',
  years_in_business: '',
  revenue_range: '',
  tech_count: '',
  admin_count: '',
  has_dispatcher: false,
  has_service_manager: false,
  avg_tech_hourly_cost: '',
  field_service_platform: '',
  tracks_marketing: '',
  runs_paid_ads: '',
  has_membership: false,
  membership_description: '',
  pain_points: [],
  success_vision: '',
}

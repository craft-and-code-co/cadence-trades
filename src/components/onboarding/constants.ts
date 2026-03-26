import type { Trade, RevenueRange, FieldServicePlatform, PainPoint } from '@/types/database'

export const TRADE_OPTIONS: { value: Trade; label: string }[] = [
  { value: 'hvac', label: 'HVAC' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'backflow', label: 'Backflow' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'pest_control', label: 'Pest Control' },
  { value: 'general_home_services', label: 'General Home Services' },
  { value: 'other', label: 'Other' },
]

export const REVENUE_OPTIONS: { value: RevenueRange; label: string }[] = [
  { value: 'under_500k', label: 'Under $500k' },
  { value: '500k_1m', label: '$500k – $1M' },
  { value: '1m_3m', label: '$1M – $3M' },
  { value: '3m_plus', label: '$3M+' },
]

export const PLATFORM_OPTIONS: { value: FieldServicePlatform; label: string }[] = [
  { value: 'servicetitan', label: 'ServiceTitan' },
  { value: 'housecall_pro', label: 'Housecall Pro' },
  { value: 'jobber', label: 'Jobber' },
  { value: 'workiz', label: 'Workiz' },
  { value: 'none', label: 'None' },
  { value: 'other', label: 'Other' },
]

export const MARKETING_CHANNEL_OPTIONS: { value: string; label: string }[] = [
  { value: 'google_search', label: 'Google Search Ads' },
  { value: 'google_lsa', label: 'Google Local Services Ads' },
  { value: 'facebook', label: 'Facebook / Meta Ads' },
  { value: 'instagram', label: 'Instagram Ads' },
  { value: 'nextdoor', label: 'Nextdoor' },
  { value: 'yelp', label: 'Yelp Ads' },
  { value: 'thumbtack', label: 'Thumbtack' },
  { value: 'angi', label: 'Angi / HomeAdvisor' },
  { value: 'direct_mail', label: 'Direct Mail / Postcards' },
  { value: 'door_hangers', label: 'Door Hangers / Flyers' },
  { value: 'truck_wraps', label: 'Vehicle Wraps' },
  { value: 'radio_tv', label: 'Radio / TV' },
  { value: 'seo', label: 'SEO / Organic Search' },
  { value: 'referral_program', label: 'Referral Program' },
  { value: 'none', label: 'No paid marketing yet' },
]

export const PAIN_POINT_OPTIONS: { value: PainPoint; label: string }[] = [
  { value: 'finding_keeping_techs', label: 'Finding & keeping good techs' },
  { value: 'slow_seasons', label: 'Slow season revenue dips' },
  { value: 'pricing', label: 'Knowing if my pricing is right' },
  { value: 'call_conversion', label: 'Converting more calls into booked jobs' },
  { value: 'tech_upselling', label: 'Getting techs to upsell in the field' },
  { value: 'cash_flow', label: 'Cash flow management' },
  { value: 'growth_without_more_hours', label: 'Growing without working more hours' },
  { value: 'other', label: 'Other' },
]

export const STEP_TITLES = [
  "Let's get to know your business",
  'Tell us about your team',
  'What tools are you using?',
  'Where do you want to go?',
  'Connect your data',
]

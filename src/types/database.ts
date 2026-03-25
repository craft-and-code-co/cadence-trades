export interface Database {
  public: {
    Tables: {
      company_profiles: {
        Row: CompanyProfile
        Insert: Omit<CompanyProfile, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<CompanyProfile, 'id'>>
      }
      jobs: {
        Row: Job
        Insert: Omit<Job, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Job, 'id'>>
      }
      technicians: {
        Row: Technician
        Insert: Omit<Technician, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Technician, 'id'>>
      }
      service_catalog: {
        Row: ServiceCatalogItem
        Insert: Omit<ServiceCatalogItem, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<ServiceCatalogItem, 'id'>>
      }
      customers: {
        Row: Customer
        Insert: Omit<Customer, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Customer, 'id'>>
      }
      insights: {
        Row: Insight
        Insert: Omit<Insight, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<Insight, 'id'>>
      }
      coach_conversations: {
        Row: CoachConversation
        Insert: Omit<CoachConversation, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<CoachConversation, 'id'>>
      }
      coach_messages: {
        Row: CoachMessage
        Insert: Omit<CoachMessage, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<CoachMessage, 'id'>>
      }
      knowledge_documents: {
        Row: KnowledgeDocument
        Insert: Omit<KnowledgeDocument, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<KnowledgeDocument, 'id'>>
      }
      data_connections: {
        Row: DataConnection
        Insert: Omit<DataConnection, 'id' | 'created_at'> & { id?: string; created_at?: string }
        Update: Partial<Omit<DataConnection, 'id'>>
      }
      market_benchmarks: {
        Row: MarketBenchmark
        Insert: Omit<MarketBenchmark, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<MarketBenchmark, 'id'>>
      }
      email_log: {
        Row: EmailLog
        Insert: Omit<EmailLog, 'id' | 'sent_at'> & { id?: string; sent_at?: string }
        Update: Partial<Omit<EmailLog, 'id'>>
      }
    }
    Functions: {
      match_knowledge_documents: {
        Args: {
          query_embedding: number[]
          match_threshold?: number
          match_count?: number
          filter_category?: string | null
          filter_trade?: string | null
        }
        Returns: Array<{
          id: string
          title: string
          category: string
          content: string
          similarity: number
        }>
      }
    }
  }
}

// ============================================
// Row types
// ============================================

export interface CompanyProfile {
  id: string
  user_id: string
  company_name: string
  trade: Trade
  service_area: string | null
  years_in_business: number | null
  revenue_range: RevenueRange | null
  tech_count: number | null
  admin_count: number | null
  has_dispatcher: boolean | null
  has_service_manager: boolean | null
  avg_tech_hourly_cost: number | null
  field_service_platform: FieldServicePlatform | null
  tracks_marketing: boolean | null
  runs_paid_ads: AdPlatform | null
  has_membership: boolean | null
  membership_description: string | null
  pain_points: PainPoint[] | null
  success_vision: string | null
  onboarding_complete: boolean
  email_opt_in: boolean
  created_at: string
  updated_at: string
}

export interface Job {
  id: string
  company_id: string
  external_id: string | null
  source: DataSource
  job_date: string
  job_type: JobType | null
  service_category: string | null
  service_name: string | null
  technician_name: string | null
  technician_id: string | null
  hours_on_job: number | null
  parts_cost: number | null
  labor_revenue: number | null
  total_revenue: number
  invoice_paid: boolean
  customer_id: string | null
  customer_zip: string | null
  lead_source: LeadSource | null
  membership_job: boolean
  upsell_attempted: boolean | null
  upsell_converted: boolean | null
  notes: string | null
  created_at: string
}

export interface Technician {
  id: string
  company_id: string
  name: string
  hourly_rate: number | null
  hourly_burdened_cost: number | null
  start_date: string | null
  active: boolean
  created_at: string
}

export interface ServiceCatalogItem {
  id: string
  company_id: string
  service_name: string
  category: string | null
  flat_rate_price: number | null
  estimated_hours: number | null
  parts_cost_estimate: number | null
  active: boolean
  created_at: string
}

export interface Customer {
  id: string
  company_id: string
  external_id: string | null
  name: string | null
  zip_code: string | null
  acquisition_source: string | null
  first_job_date: string | null
  last_job_date: string | null
  lifetime_value: number
  job_count: number
  is_member: boolean
  created_at: string
}

export interface Insight {
  id: string
  company_id: string
  insight_type: InsightType
  title: string
  summary: string
  detail: string
  action_plan: string | null
  estimated_impact: string | null
  priority: Priority
  status: InsightStatus
  roi_tracked: boolean
  roi_result: string | null
  dismissed_at: string | null
  created_at: string
}

export interface CoachConversation {
  id: string
  company_id: string
  topic: string | null
  created_at: string
  updated_at: string
}

export interface CoachMessage {
  id: string
  conversation_id: string
  company_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface KnowledgeDocument {
  id: string
  title: string
  category: string
  source_file: string | null
  chunk_index: number
  content: string
  embedding: number[] | null
  trade_tags: string[] | null
  created_at: string
}

export interface DataConnection {
  id: string
  company_id: string
  platform: string
  status: 'active' | 'error' | 'disconnected'
  last_sync: string | null
  sync_error: string | null
  created_at: string
}

export interface MarketBenchmark {
  id: string
  trade: string
  region: string | null
  service_name: string
  benchmark_low: number
  benchmark_high: number
  benchmark_source: string | null
  notes: string | null
  updated_at: string
  created_at: string
}

export interface EmailLog {
  id: string
  company_id: string
  email_type: string
  insight_id: string | null
  sent_at: string
  resend_id: string | null
}

// ============================================
// Enums / union types
// ============================================

export type Trade =
  | 'hvac'
  | 'plumbing'
  | 'electrical'
  | 'backflow'
  | 'landscaping'
  | 'pest_control'
  | 'general_home_services'
  | 'other'

export type RevenueRange = 'under_500k' | '500k_1m' | '1m_3m' | '3m_plus'

export type FieldServicePlatform =
  | 'servicetitan'
  | 'housecall_pro'
  | 'jobber'
  | 'workiz'
  | 'none'
  | 'other'

export type AdPlatform = 'google' | 'facebook' | 'both' | 'neither'

export type PainPoint =
  | 'finding_keeping_techs'
  | 'slow_seasons'
  | 'pricing'
  | 'call_conversion'
  | 'tech_upselling'
  | 'cash_flow'
  | 'growth_without_more_hours'
  | 'other'

export type DataSource = 'jobber' | 'housecall_pro' | 'csv' | 'manual'

export type JobType = 'service' | 'install' | 'maintenance' | 'estimate'

export type LeadSource = 'google' | 'facebook' | 'referral' | 'repeat' | 'other'

export type InsightType =
  | 'pricing'
  | 'staffing'
  | 'seasonal'
  | 'marketing'
  | 'membership'
  | 'cash_flow'
  | 'tech_performance'

export type Priority = 'high' | 'medium' | 'low'

export type InsightStatus = 'new' | 'in_progress' | 'completed' | 'dismissed'

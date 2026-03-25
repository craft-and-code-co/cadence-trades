export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

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

// ============================================
// Row types (use `type` not `interface` for supabase-js compat)
// ============================================

export type CompanyProfile = {
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
  tracks_marketing: string | null
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

export type Job = {
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

export type Technician = {
  id: string
  company_id: string
  name: string
  hourly_rate: number | null
  hourly_burdened_cost: number | null
  start_date: string | null
  active: boolean
  created_at: string
}

export type ServiceCatalogItem = {
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

export type Customer = {
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

export type Insight = {
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

export type CoachConversation = {
  id: string
  company_id: string
  topic: string | null
  created_at: string
  updated_at: string
}

export type CoachMessage = {
  id: string
  conversation_id: string
  company_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type KnowledgeDocument = {
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

export type DataConnection = {
  id: string
  company_id: string
  platform: string
  status: 'active' | 'error' | 'disconnected'
  last_sync: string | null
  sync_error: string | null
  created_at: string
}

export type MarketBenchmark = {
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

export type EmailLog = {
  id: string
  company_id: string
  email_type: string
  insight_id: string | null
  sent_at: string
  resend_id: string | null
}

// ============================================
// Database type helpers
// ============================================

/** Pick nullable keys from T (value extends null) */
type NullableKeys<T> = {
  [K in keyof T]: null extends T[K] ? K : never
}[keyof T]

/** Make nullable fields optional, keep required fields required, omit auto-generated cols */
type InsertType<T, AutoCols extends keyof T> = {
  [K in keyof Omit<T, AutoCols> as K extends NullableKeys<T> ? never : K]: T[K]
} & {
  [K in keyof Omit<T, AutoCols> as K extends NullableKeys<T> ? K : never]?: T[K]
} & {
  [K in AutoCols]?: T[K]
}

// ============================================
// Database type for supabase-js client
// ============================================

export type Database = {
  public: {
    Tables: {
      company_profiles: {
        Row: CompanyProfile
        Insert: InsertType<CompanyProfile, 'id' | 'created_at' | 'updated_at' | 'onboarding_complete' | 'email_opt_in'>
        Update: Partial<CompanyProfile>
        Relationships: []
      }
      jobs: {
        Row: Job
        Insert: InsertType<Job, 'id' | 'created_at' | 'invoice_paid' | 'membership_job'>
        Update: Partial<Job>
        Relationships: []
      }
      technicians: {
        Row: Technician
        Insert: InsertType<Technician, 'id' | 'created_at' | 'active'>
        Update: Partial<Technician>
        Relationships: []
      }
      service_catalog: {
        Row: ServiceCatalogItem
        Insert: InsertType<ServiceCatalogItem, 'id' | 'created_at' | 'active'>
        Update: Partial<ServiceCatalogItem>
        Relationships: []
      }
      customers: {
        Row: Customer
        Insert: InsertType<Customer, 'id' | 'created_at' | 'lifetime_value' | 'job_count' | 'is_member'>
        Update: Partial<Customer>
        Relationships: []
      }
      insights: {
        Row: Insight
        Insert: InsertType<Insight, 'id' | 'created_at' | 'priority' | 'status' | 'roi_tracked'>
        Update: Partial<Insight>
        Relationships: []
      }
      coach_conversations: {
        Row: CoachConversation
        Insert: InsertType<CoachConversation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<CoachConversation>
        Relationships: []
      }
      coach_messages: {
        Row: CoachMessage
        Insert: InsertType<CoachMessage, 'id' | 'created_at'>
        Update: Partial<CoachMessage>
        Relationships: []
      }
      knowledge_documents: {
        Row: KnowledgeDocument
        Insert: InsertType<KnowledgeDocument, 'id' | 'created_at'>
        Update: Partial<KnowledgeDocument>
        Relationships: []
      }
      data_connections: {
        Row: DataConnection
        Insert: InsertType<DataConnection, 'id' | 'created_at' | 'status'>
        Update: Partial<DataConnection>
        Relationships: []
      }
      market_benchmarks: {
        Row: MarketBenchmark
        Insert: InsertType<MarketBenchmark, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<MarketBenchmark>
        Relationships: []
      }
      email_log: {
        Row: EmailLog
        Insert: InsertType<EmailLog, 'id' | 'sent_at'>
        Update: Partial<EmailLog>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

import type { DataSource } from '@/types/database'

export interface NormalizedJob {
  external_id?: string
  source: DataSource
  job_date: string
  job_type?: string
  service_category?: string
  service_name?: string
  technician_name?: string
  hours_on_job?: number
  parts_cost?: number
  labor_revenue?: number
  total_revenue: number
  customer_name?: string
  customer_zip?: string
  lead_source?: string
  notes?: string
}

export interface NormalizedCustomer {
  external_id?: string
  name: string
  zip_code?: string
  acquisition_source?: string
  first_job_date?: string
  last_job_date?: string
  lifetime_value?: number
}

export interface NormalizedService {
  service_name: string
  category?: string
  flat_rate_price?: number
  estimated_hours?: number
  parts_cost_estimate?: number
}

export interface ValidationIssue {
  row: number
  field: string
  message: string
  severity: 'error' | 'warning'
}

export interface DataImporter {
  source: DataSource
  normalizeJobs(rawData: Record<string, string>[]): NormalizedJob[]
  normalizeCustomers?(rawData: Record<string, string>[]): NormalizedCustomer[]
  normalizeServices?(rawData: Record<string, string>[]): NormalizedService[]
  validate(data: NormalizedJob[] | NormalizedCustomer[] | NormalizedService[]): ValidationIssue[]
}

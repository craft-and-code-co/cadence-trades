import type { DataImporter, NormalizedJob, NormalizedCustomer, NormalizedService, ValidationIssue } from './types'

/** Known aliases for auto-mapping CSV headers → target fields */
const JOB_FIELD_ALIASES: Record<string, string[]> = {
  external_id: ['external_id', 'id', 'invoice_id', 'invoice_number', 'invoice #', 'invoice number', 'job_id', 'job id'],
  job_date: ['date', 'job_date', 'job date', 'service_date', 'service date', 'invoice_date'],
  service_name: ['service_type', 'service type', 'service_name', 'service name', 'service', 'description'],
  technician_name: ['tech_name', 'tech name', 'technician_name', 'technician', 'tech'],
  hours_on_job: ['hours', 'hours_on_job', 'labor_hours', 'labor hours', 'time'],
  total_revenue: ['revenue', 'total_revenue', 'total revenue', 'amount', 'total', 'invoice_total', 'invoice total'],
  lead_source: ['lead_source', 'lead source', 'source', 'referral_source'],
  customer_name: ['customer_name', 'customer name', 'customer', 'client', 'client_name'],
  customer_zip: ['customer_zip', 'zip', 'zip_code', 'zipcode', 'postal_code'],
}

export function autoMapColumns(csvHeaders: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  const normalizedHeaders = csvHeaders.map((h) => h.toLowerCase().trim())

  for (const [targetField, aliases] of Object.entries(JOB_FIELD_ALIASES)) {
    const matchIndex = normalizedHeaders.findIndex((h) => aliases.includes(h))
    if (matchIndex !== -1) {
      mapping[csvHeaders[matchIndex]] = targetField
    }
  }

  return mapping
}

/** Parse a date string flexibly. Returns ISO date string or null. */
function parseDate(raw: string): string | null {
  if (!raw) return null
  const trimmed = raw.trim()

  // YYYY-MM-DD
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) {
    const d = new Date(trimmed + 'T00:00:00')
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
  }

  // MM/DD/YYYY or M/D/YYYY
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (slashMatch) {
    let year = parseInt(slashMatch[3])
    if (year < 100) year += 2000
    const month = slashMatch[1].padStart(2, '0')
    const day = slashMatch[2].padStart(2, '0')
    const d = new Date(`${year}-${month}-${day}T00:00:00`)
    return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
  }

  // Fallback: try native parsing
  const d = new Date(trimmed)
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0]
}

/** Parse a numeric string, stripping $ and commas */
function parseNumber(raw: string): number | undefined {
  if (!raw) return undefined
  const cleaned = raw.replace(/[$,\s]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? undefined : num
}

export const csvJobImporter: DataImporter = {
  source: 'csv',

  normalizeJobs(rawData: Record<string, string>[]): NormalizedJob[] {
    return rawData.map((row) => ({
      external_id: row.external_id?.trim() || undefined,
      source: 'csv',
      job_date: parseDate(row.job_date) || '',
      service_name: row.service_name?.trim() || undefined,
      technician_name: row.technician_name?.trim() || undefined,
      hours_on_job: parseNumber(row.hours_on_job),
      total_revenue: parseNumber(row.total_revenue) ?? 0,
      lead_source: row.lead_source?.trim().toLowerCase() || undefined,
      customer_name: row.customer_name?.trim() || undefined,
      customer_zip: row.customer_zip?.trim() || undefined,
    }))
  },

  normalizeCustomers(rawData: Record<string, string>[]): NormalizedCustomer[] {
    return rawData.map((row) => ({
      name: row.name?.trim() || '',
      zip_code: (row.zip || row.zip_code)?.trim() || undefined,
      first_job_date: parseDate(row.first_job_date) || undefined,
      last_job_date: parseDate(row.last_job_date) || undefined,
      lifetime_value: parseNumber(row.total_spend),
    }))
  },

  normalizeServices(rawData: Record<string, string>[]): NormalizedService[] {
    return rawData.map((row) => ({
      service_name: row.service_name?.trim() || '',
      category: row.category?.trim() || undefined,
      flat_rate_price: parseNumber(row.flat_rate_price),
      estimated_hours: parseNumber(row.estimated_hours),
      parts_cost_estimate: parseNumber(row.parts_cost_estimate),
    }))
  },

  validate(data): ValidationIssue[] {
    const issues: ValidationIssue[] = []
    const jobs = data as NormalizedJob[]

    jobs.forEach((job, i) => {
      const row = i + 2 // 1-indexed + header row
      if (!job.job_date) {
        issues.push({ row, field: 'job_date', message: 'Missing or invalid date', severity: 'error' })
      }
      if (job.total_revenue === 0 || job.total_revenue === undefined) {
        issues.push({ row, field: 'total_revenue', message: 'Missing or zero revenue', severity: 'warning' })
      }
      if (job.total_revenue < 0) {
        issues.push({ row, field: 'total_revenue', message: 'Negative revenue', severity: 'warning' })
      }
    })

    return issues
  },
}

import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useCompanyProfile } from '@/hooks/useCompanyProfile'
import { normalizeLeadSource } from '@/lib/importers/lead-source'
import { resolveCustomerIds, customerKey } from '@/lib/importers/customer-matching'
import type { CsvImportType } from '@/lib/importers/import-types'
import { Button } from '@/components/ui/button'
import type { NormalizedJob, NormalizedCustomer, NormalizedService, ValidationIssue } from '@/lib/importers/types'

interface Props {
  importType: CsvImportType
  file: File | null
  jobs: NormalizedJob[]
  customers: NormalizedCustomer[]
  services: NormalizedService[]
  issues: ValidationIssue[]
  onImported: (count: number) => void
  onBack: () => void
}

export function CsvSummaryStep({
  importType,
  file,
  jobs,
  customers,
  services,
  issues,
  onImported,
  onBack,
}: Props) {
  const { profile } = useCompanyProfile()
  const [importing, setImporting] = useState(false)

  const errors = issues.filter((i) => i.severity === 'error')
  const errorRows = new Set(errors.map((e) => e.row))
  const warnings = issues.filter((i) => i.severity === 'warning')

  const validCount =
    importType === 'jobs'
      ? jobs.filter((_, i) => !errorRows.has(i + 2)).length
      : importType === 'customers'
        ? customers.filter((_, i) => !errorRows.has(i + 2)).length
        : services.filter((_, i) => !errorRows.has(i + 2)).length

  const label = importType === 'jobs' ? 'jobs' : importType === 'customers' ? 'customers' : 'services'

  const handleImport = async () => {
    if (!profile) {
      toast.error('Company profile not found.')
      return
    }

    setImporting(true)

    try {
      // 1. Upload raw CSV to storage
      if (file) {
        const path = `${profile.id}/${Date.now()}-${file.name}`
        const { error: storageError } = await supabase.storage.from('csv-uploads').upload(path, file)
        if (storageError) {
          console.error('CSV storage upload failed:', storageError)
          toast.warning('Could not archive the raw CSV file, but your data will still be imported.')
        }
      }

      let insertedTotal = 0

      if (importType === 'jobs') {
        insertedTotal = await importJobs(profile.id, jobs, errorRows)
      } else if (importType === 'customers') {
        insertedTotal = await importCustomers(profile.id, customers, errorRows)
      } else {
        insertedTotal = await importServices(profile.id, services, errorRows)
      }

      // Upsert data_connections record
      await supabase.from('data_connections').upsert(
        { company_id: profile.id, platform: 'csv', status: 'active', last_sync: new Date().toISOString() },
        { onConflict: 'company_id,platform' }
      )

      onImported(insertedTotal)
    } catch (err) {
      console.error('Import error:', err)
      toast.error('Import failed. Please try again.')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-outline-variant/20 bg-surface-container p-5 space-y-3">
        <p className="text-lg font-semibold text-on-surface">
          Ready to import {validCount} {label}
        </p>
        {file && (
          <p className="text-sm text-on-surface-variant">
            From: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </p>
        )}
        {errors.length > 0 && (
          <p className="text-sm text-destructive">{errors.length} rows skipped due to errors.</p>
        )}
        {warnings.length > 0 && (
          <p className="text-sm text-primary">{warnings.length} warnings will be imported as-is.</p>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack} disabled={importing}>
          Back
        </Button>
        <Button onClick={handleImport} disabled={importing || validCount === 0}>
          {importing ? 'Importing...' : `Import ${validCount} ${label}`}
        </Button>
      </div>
    </div>
  )
}

// ---- Import helpers ----

async function importJobs(companyId: string, jobs: NormalizedJob[], errorRows: Set<number>) {
  const validJobs = jobs.filter((_, i) => !errorRows.has(i + 2))
  const customerIdMap = await resolveCustomerIds(companyId, validJobs)

  const rows = validJobs.map((job) => {
    const custId = job.customer_name
      ? customerIdMap.get(customerKey(job.customer_name, job.customer_zip))
      : undefined
    return {
      company_id: companyId,
      external_id: job.external_id || null,
      source: 'csv' as const,
      job_date: job.job_date,
      service_name: job.service_name || null,
      technician_name: job.technician_name || null,
      hours_on_job: job.hours_on_job ?? null,
      total_revenue: job.total_revenue,
      lead_source: normalizeLeadSource(job.lead_source),
      customer_id: custId || null,
      customer_zip: job.customer_zip || null,
      notes: job.notes || null,
    }
  })

  const hasExternalIds = rows.some((r) => r.external_id)
  let total = 0
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100)
    const query = hasExternalIds
      ? supabase.from('jobs').upsert(batch, { onConflict: 'company_id,external_id' })
      : supabase.from('jobs').insert(batch)
    const { error, data } = await query.select('id')
    if (error) throw error
    total += data.length
  }
  return total
}

async function importCustomers(companyId: string, customers: NormalizedCustomer[], errorRows: Set<number>) {
  const valid = customers.filter((_, i) => !errorRows.has(i + 2))
  const rows = valid.map((c) => ({
    company_id: companyId,
    name: c.name,
    zip_code: c.zip_code || null,
    acquisition_source: c.acquisition_source || null,
    first_job_date: c.first_job_date || null,
    last_job_date: c.last_job_date || null,
    lifetime_value: c.lifetime_value ?? 0,
  }))

  let total = 0
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100)
    const { error, data } = await supabase.from('customers').insert(batch).select('id')
    if (error) throw error
    total += data.length
  }
  return total
}

async function importServices(companyId: string, services: NormalizedService[], errorRows: Set<number>) {
  const valid = services.filter((_, i) => !errorRows.has(i + 2))
  const rows = valid.map((s) => ({
    company_id: companyId,
    service_name: s.service_name,
    category: s.category || null,
    flat_rate_price: s.flat_rate_price ?? null,
    estimated_hours: s.estimated_hours ?? null,
    parts_cost_estimate: s.parts_cost_estimate ?? null,
  }))

  let total = 0
  for (let i = 0; i < rows.length; i += 100) {
    const batch = rows.slice(i, i + 100)
    const { error, data } = await supabase.from('service_catalog').insert(batch).select('id')
    if (error) throw error
    total += data.length
  }
  return total
}

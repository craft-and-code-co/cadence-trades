import { supabase } from '@/lib/supabase'
import type { NormalizedJob } from './types'

/**
 * Before inserting jobs, create/find customer records and return a
 * name+zip → customer_id map. Callers use this to set customer_id
 * on each job row before insert.
 */
export async function resolveCustomerIds(
  companyId: string,
  jobs: NormalizedJob[]
): Promise<Map<string, string>> {
  // Collect unique customer keys
  const customerKeys = new Map<string, { name: string; zip: string | null }>()
  for (const job of jobs) {
    if (!job.customer_name) continue
    const key = customerKey(job.customer_name, job.customer_zip)
    if (!customerKeys.has(key)) {
      customerKeys.set(key, {
        name: job.customer_name.trim(),
        zip: job.customer_zip?.trim() || null,
      })
    }
  }

  if (customerKeys.size === 0) return new Map()

  // Fetch existing customers for this company
  const { data: existing } = await supabase
    .from('customers')
    .select('id, name, zip_code')
    .eq('company_id', companyId)

  const idMap = new Map<string, string>()
  for (const c of existing ?? []) {
    const key = customerKey(c.name || '', c.zip_code)
    idMap.set(key, c.id)
  }

  // Create customers that don't exist yet
  const toCreate: { company_id: string; name: string; zip_code: string | null }[] = []
  for (const [key, { name, zip }] of customerKeys) {
    if (!idMap.has(key)) {
      toCreate.push({ company_id: companyId, name, zip_code: zip })
    }
  }

  if (toCreate.length > 0) {
    const { data: created } = await supabase
      .from('customers')
      .insert(toCreate)
      .select('id, name, zip_code')

    for (const c of created ?? []) {
      const key = customerKey(c.name || '', c.zip_code)
      idMap.set(key, c.id)
    }
  }

  return idMap
}

/** Build a normalized key for customer matching */
export function customerKey(name: string, zip: string | null | undefined): string {
  return `${name.toLowerCase().trim()}|${(zip || '').trim()}`
}

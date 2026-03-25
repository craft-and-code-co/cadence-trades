import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useCompanyProfile } from '@/hooks/useCompanyProfile'
import { normalizeLeadSource } from '@/lib/importers/lead-source'
import { MIN_JOBS_THRESHOLD } from '@/lib/constants'
import { Button } from '@/components/ui/button'
import {
  ManualJobTable,
  newManualRow,
  type ManualJobRow,
} from '@/components/data/ManualJobTable'

export default function ImportManual() {
  const navigate = useNavigate()
  const { profile } = useCompanyProfile()
  const [rows, setRows] = useState<ManualJobRow[]>([newManualRow()])
  const [saving, setSaving] = useState(false)
  const [savedCount, setSavedCount] = useState(0)

  const updateRow = (id: string, field: keyof ManualJobRow, value: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))

  const removeRow = (id: string) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev))

  const addRow = () => setRows((prev) => [...prev, newManualRow()])

  const validRows = rows.filter((r) => r.job_date && r.total_revenue)

  const handleSave = async () => {
    if (!profile || validRows.length === 0) return

    setSaving(true)
    try {
      const jobRows = validRows.map((r) => ({
        company_id: profile.id,
        source: 'manual' as const,
        job_date: r.job_date,
        service_name: r.service_name || null,
        technician_name: r.technician_name || null,
        hours_on_job: r.hours ? parseFloat(r.hours) : null,
        total_revenue: parseFloat(r.total_revenue),
        lead_source: normalizeLeadSource(r.lead_source),
      }))

      const { error, data } = await supabase.from('jobs').insert(jobRows).select('id')
      if (error) throw error

      await supabase.from('data_connections').upsert(
        {
          company_id: profile.id,
          platform: 'manual',
          status: 'active',
          last_sync: new Date().toISOString(),
        },
        { onConflict: 'company_id,platform' }
      )

      const count = data.length
      setSavedCount((prev) => prev + count)
      toast.success(`${count} job${count > 1 ? 's' : ''} saved!`)
      setRows([newManualRow()])
    } catch (err) {
      console.error('Manual entry error:', err)
      toast.error('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-surface">
      <div className="w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold font-headline text-on-surface">Add Jobs Manually</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Add your recent jobs one at a time. Date and revenue are required.
            </p>
          </div>
          {savedCount > 0 && (
            <div className="text-right">
              <p className="text-lg font-semibold text-primary">{savedCount} saved</p>
              {savedCount < MIN_JOBS_THRESHOLD && (
                <p className="text-xs text-muted-foreground">
                  {MIN_JOBS_THRESHOLD - savedCount} more for insights
                </p>
              )}
            </div>
          )}
        </div>

        <ManualJobTable
          rows={rows}
          onUpdate={updateRow}
          onRemove={removeRow}
          onAdd={addRow}
        />

        {savedCount > 0 && savedCount < MIN_JOBS_THRESHOLD && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm text-foreground">
              You have <strong>{savedCount}</strong> jobs. We need at least{' '}
              <strong>{MIN_JOBS_THRESHOLD}</strong> to generate specific insights.
            </p>
          </div>
        )}

        <div className="flex justify-between">
          <Button variant="ghost" onClick={() => navigate('/')}>
            {savedCount > 0 ? 'Done — Go to Briefing' : 'Skip for Now'}
          </Button>
          <Button onClick={handleSave} disabled={saving || validRows.length === 0}>
            {saving ? 'Saving...' : `Save ${validRows.length} Job${validRows.length !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>
    </div>
  )
}

import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LEAD_SOURCE_VALUES } from '@/lib/importers/lead-source'

export interface ManualJobRow {
  id: string
  job_date: string
  service_name: string
  technician_name: string
  hours: string
  total_revenue: string
  lead_source: string
}

export function newManualRow(): ManualJobRow {
  return {
    id: crypto.randomUUID(),
    job_date: new Date().toISOString().split('T')[0],
    service_name: '',
    technician_name: '',
    hours: '',
    total_revenue: '',
    lead_source: '',
  }
}

interface Props {
  rows: ManualJobRow[]
  onUpdate: (id: string, field: keyof ManualJobRow, value: string) => void
  onRemove: (id: string) => void
  onAdd: () => void
}

export function ManualJobTable({ rows, onUpdate, onRemove, onAdd }: Props) {
  const techNames = [...new Set(rows.map((r) => r.technician_name).filter(Boolean))]
  const serviceNames = [...new Set(rows.map((r) => r.service_name).filter(Boolean))]

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-outline-variant/20">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/20 bg-surface-container-low">
              <th className="px-3 py-2 text-left font-medium text-on-surface-variant">Date *</th>
              <th className="px-3 py-2 text-left font-medium text-on-surface-variant">Service</th>
              <th className="px-3 py-2 text-left font-medium text-on-surface-variant">Tech</th>
              <th className="px-3 py-2 text-left font-medium text-on-surface-variant w-20">Hours</th>
              <th className="px-3 py-2 text-left font-medium text-on-surface-variant w-28">Revenue *</th>
              <th className="px-3 py-2 text-left font-medium text-on-surface-variant">Lead Source</th>
              <th className="px-3 py-2 w-10" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b border-outline-variant/20 last:border-0">
                <td className="px-2 py-1.5">
                  <Input
                    type="date"
                    value={row.job_date}
                    onChange={(e) => onUpdate(row.id, 'job_date', e.target.value)}
                    className="h-8 text-xs"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    value={row.service_name}
                    onChange={(e) => onUpdate(row.id, 'service_name', e.target.value)}
                    placeholder="e.g. AC Repair"
                    list="service-names"
                    className="h-8 text-xs"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    value={row.technician_name}
                    onChange={(e) => onUpdate(row.id, 'technician_name', e.target.value)}
                    placeholder="e.g. Mike"
                    list="tech-names"
                    className="h-8 text-xs"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    type="number"
                    min="0"
                    step="0.5"
                    value={row.hours}
                    onChange={(e) => onUpdate(row.id, 'hours', e.target.value)}
                    placeholder="2.5"
                    className="h-8 text-xs"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.total_revenue}
                    onChange={(e) => onUpdate(row.id, 'total_revenue', e.target.value)}
                    placeholder="450.00"
                    className="h-8 text-xs"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <Input
                    value={row.lead_source}
                    onChange={(e) => onUpdate(row.id, 'lead_source', e.target.value)}
                    placeholder="e.g. google"
                    list="lead-sources"
                    className="h-8 text-xs"
                  />
                </td>
                <td className="px-2 py-1.5">
                  <button
                    onClick={() => onRemove(row.id)}
                    className="text-on-surface-variant hover:text-destructive transition-colors p-1"
                    disabled={rows.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Datalists for autocomplete */}
      <datalist id="tech-names">
        {techNames.map((n) => <option key={n} value={n} />)}
      </datalist>
      <datalist id="service-names">
        {serviceNames.map((n) => <option key={n} value={n} />)}
      </datalist>
      <datalist id="lead-sources">
        {LEAD_SOURCE_VALUES.map((v) => <option key={v} value={v} />)}
      </datalist>

      <div className="flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="h-4 w-4 mr-1" />
          Add Row
        </Button>
      </div>
    </>
  )
}

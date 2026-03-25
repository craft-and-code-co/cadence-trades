import { Button } from '@/components/ui/button'
import { TARGET_FIELDS_BY_TYPE, REQUIRED_FIELDS_BY_TYPE, type CsvImportType } from '@/lib/importers/import-types'

interface Props {
  importType: CsvImportType
  headers: string[]
  rawData: Record<string, string>[]
  columnMapping: Record<string, string>
  onUpdateMapping: (csvColumn: string, targetField: string) => void
  onConfirm: () => void
  onBack: () => void
}

export function CsvMappingStep({
  importType,
  headers,
  rawData,
  columnMapping,
  onUpdateMapping,
  onConfirm,
  onBack,
}: Props) {
  const targetFields = TARGET_FIELDS_BY_TYPE[importType]
  const requiredFields = REQUIRED_FIELDS_BY_TYPE[importType]
  const previewRows = rawData.slice(0, 3)

  const mappedValues = Object.values(columnMapping)
  const allRequiredMapped = requiredFields.every((f) => mappedValues.includes(f))

  return (
    <div className="space-y-6">
      <p className="text-sm text-on-surface-variant">
        Map your CSV columns to the fields we need. We've auto-matched what we could.
      </p>

      <div className="space-y-3">
        {headers.map((header) => (
          <div key={header} className="flex items-center gap-3">
            <div className="w-40 shrink-0 truncate text-sm font-medium text-on-surface">
              {header}
            </div>
            <span className="text-on-surface-variant">&rarr;</span>
            <select
              className="flex h-9 flex-1 rounded-lg border-0 border-b-2 border-b-transparent bg-surface-container-highest px-2 py-1 text-sm text-on-surface outline-none focus:border-b-primary-container"
              value={columnMapping[header] || ''}
              onChange={(e) => onUpdateMapping(header, e.target.value)}
            >
              {targetFields.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Preview */}
      {previewRows.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-on-surface-variant uppercase tracking-wide">
            Preview (first {previewRows.length} rows)
          </p>
          <div className="overflow-x-auto rounded border border-outline-variant/20">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-outline-variant/20 bg-surface-container-low">
                  {headers.map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-on-surface-variant">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i} className="border-b border-outline-variant/20 last:border-0">
                    {headers.map((h) => (
                      <td key={h} className="px-3 py-1.5 text-on-surface">
                        {row[h] || '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onConfirm} disabled={!allRequiredMapped}>
          Validate Data
        </Button>
      </div>

      {!allRequiredMapped && (
        <p className="text-xs text-on-surface-variant">
          Map the required fields to continue:{' '}
          {requiredFields
            .filter((f) => !mappedValues.includes(f))
            .map((f) => targetFields.find((tf) => tf.value === f)?.label)
            .join(', ')}
        </p>
      )}
    </div>
  )
}

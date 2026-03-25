import { AlertTriangle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { ValidationIssue } from '@/lib/importers/types'

interface Props {
  totalRows: number
  issues: ValidationIssue[]
  onContinue: () => void
  onBack: () => void
}

export function CsvValidationStep({ totalRows, issues, onContinue, onBack }: Props) {
  const errors = issues.filter((i) => i.severity === 'error')
  const warnings = issues.filter((i) => i.severity === 'warning')
  const validCount = totalRows - new Set(errors.map((e) => e.row)).size

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{totalRows}</p>
          <p className="text-xs text-muted-foreground">Total rows</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-destructive">{errors.length}</p>
          <p className="text-xs text-muted-foreground">Errors</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4 text-center">
          <p className="text-2xl font-bold text-primary">{warnings.length}</p>
          <p className="text-xs text-muted-foreground">Warnings</p>
        </div>
      </div>

      {/* Error list */}
      {errors.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
            <XCircle className="h-4 w-4" />
            Errors — these rows won't be imported
          </p>
          <div className="max-h-48 overflow-y-auto rounded border border-destructive/30 bg-destructive/5 p-3 space-y-1">
            {errors.slice(0, 20).map((issue, i) => (
              <p key={i} className="text-xs text-foreground">
                Row {issue.row}: {issue.message} ({issue.field})
              </p>
            ))}
            {errors.length > 20 && (
              <p className="text-xs text-muted-foreground">
                ...and {errors.length - 20} more errors
              </p>
            )}
          </div>
        </div>
      )}

      {/* Warning list */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-primary flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4" />
            Warnings — these rows will still be imported
          </p>
          <div className="max-h-48 overflow-y-auto rounded border border-primary/30 bg-primary/5 p-3 space-y-1">
            {warnings.slice(0, 20).map((issue, i) => (
              <p key={i} className="text-xs text-foreground">
                Row {issue.row}: {issue.message} ({issue.field})
              </p>
            ))}
            {warnings.length > 20 && (
              <p className="text-xs text-muted-foreground">
                ...and {warnings.length - 20} more warnings
              </p>
            )}
          </div>
        </div>
      )}

      {errors.length === 0 && warnings.length === 0 && (
        <p className="text-sm text-success">All rows look good — no issues found.</p>
      )}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onContinue} disabled={validCount === 0}>
          Review Summary ({validCount} jobs)
        </Button>
      </div>
    </div>
  )
}

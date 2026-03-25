import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MIN_JOBS_THRESHOLD } from '@/lib/constants'

interface Props {
  importedCount: number
  onImportAnother: () => void
  onFinish: () => void
}

export function CsvConfirmationStep({ importedCount, onImportAnother, onFinish }: Props) {
  return (
    <div className="space-y-6 text-center">
      <CheckCircle className="h-14 w-14 text-success mx-auto" />

      <div className="space-y-2">
        <p className="text-xl font-bold text-foreground">
          {importedCount} jobs imported successfully
        </p>

        {importedCount < MIN_JOBS_THRESHOLD && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
            <p className="text-sm text-foreground">
              You have <strong>{importedCount}</strong> jobs. We need at least{' '}
              <strong>{MIN_JOBS_THRESHOLD}</strong> to generate specific insights.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Keep logging jobs or import another file to unlock your full coaching experience.
            </p>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Button onClick={onImportAnother} variant="outline" className="w-full">
          Import Another File
        </Button>
        <Button onClick={onFinish} className="w-full">
          Continue to Briefing
        </Button>
      </div>
    </div>
  )
}

import { Upload, PenLine, ArrowRight } from 'lucide-react'

interface Props {
  onChoice: (choice: 'csv' | 'manual' | 'skip') => void
}

export function StepConnectData({ onChoice }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The more data you give us, the better your coaching gets. You can always add more later.
      </p>

      <button
        onClick={() => onChoice('csv')}
        className="w-full flex items-center gap-4 rounded-lg border-2 border-primary bg-primary/10 px-5 py-4 text-left transition-colors hover:bg-primary/20"
      >
        <Upload className="h-6 w-6 text-primary shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-foreground">Upload a CSV</p>
          <p className="text-sm text-muted-foreground">
            Export your job history from your field service software and upload it here.
          </p>
        </div>
        <ArrowRight className="h-5 w-5 text-primary shrink-0" />
      </button>

      <button
        onClick={() => onChoice('manual')}
        className="w-full flex items-center gap-4 rounded-lg border border-border bg-card px-5 py-4 text-left transition-colors hover:border-muted-foreground"
      >
        <PenLine className="h-6 w-6 text-muted-foreground shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-foreground">Enter jobs manually</p>
          <p className="text-sm text-muted-foreground">
            Add your recent jobs one at a time — great for getting started quickly.
          </p>
        </div>
        <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
      </button>

      <button
        onClick={() => onChoice('skip')}
        className="w-full text-center text-sm text-muted-foreground py-3 hover:text-foreground transition-colors"
      >
        Skip for now — I'll add data later
      </button>
      <p className="text-xs text-center text-muted-foreground">
        You'll see limited insights until you add at least 30 jobs.
      </p>
    </div>
  )
}

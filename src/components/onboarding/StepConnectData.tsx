import { Icon } from '@/components/ui/icon'

interface Props {
  onChoice: (choice: 'csv' | 'manual' | 'skip') => void
}

export function StepConnectData({ onChoice }: Props) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-on-surface-variant">
        The more data you give us, the better your coaching gets. You can always add more later.
      </p>

      <button
        onClick={() => onChoice('csv')}
        className="w-full flex items-center gap-4 rounded-xl bg-primary/10 px-5 py-5 text-left transition-colors hover:bg-primary/15"
      >
        <Icon name="upload_file" size={24} className="text-primary shrink-0" />
        <div className="flex-1">
          <p className="font-bold text-on-surface">Upload a CSV</p>
          <p className="text-sm text-on-surface-variant">
            Export your job history from your field service software and upload it here.
          </p>
        </div>
        <Icon name="arrow_forward" size={20} className="text-primary shrink-0" />
      </button>

      <button
        onClick={() => onChoice('manual')}
        className="w-full flex items-center gap-4 rounded-xl bg-surface-container px-5 py-5 text-left transition-colors hover:bg-surface-container-high"
      >
        <Icon name="edit_note" size={24} className="text-on-surface-variant shrink-0" />
        <div className="flex-1">
          <p className="font-bold text-on-surface">Enter jobs manually</p>
          <p className="text-sm text-on-surface-variant">
            Add your recent jobs one at a time — great for getting started quickly.
          </p>
        </div>
        <Icon name="arrow_forward" size={20} className="text-on-surface-variant shrink-0" />
      </button>

      <button
        onClick={() => onChoice('skip')}
        className="w-full text-center text-sm text-on-surface-variant py-3 hover:text-on-surface transition-colors"
      >
        Skip for now — I'll add data later
      </button>
      <p className="text-xs text-center text-on-surface-variant/60">
        You'll see limited insights until you add at least 30 jobs.
      </p>
    </div>
  )
}

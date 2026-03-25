import { Label } from '@/components/ui/label'
import { PAIN_POINT_OPTIONS } from './constants'
import type { OnboardingData } from './types'
import type { PainPoint } from '@/types/database'

interface Props {
  data: OnboardingData
  onChange: (updates: Partial<OnboardingData>) => void
}

export function StepGoals({ data, onChange }: Props) {
  const togglePainPoint = (value: PainPoint) => {
    const current = data.pain_points
    const next = current.includes(value)
      ? current.filter((p) => p !== value)
      : [...current, value]
    onChange({ pain_points: next })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Label>
          Biggest challenges <span className="text-destructive">*</span>
        </Label>
        <p className="text-sm text-muted-foreground">Select at least one.</p>
        <div className="grid grid-cols-1 gap-2">
          {PAIN_POINT_OPTIONS.map((p) => (
            <label
              key={p.value}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                data.pain_points.includes(p.value)
                  ? 'bg-primary/10 text-on-surface ghost-border'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input accent-primary"
                checked={data.pain_points.includes(p.value)}
                onChange={() => togglePainPoint(p.value)}
              />
              <span className="text-sm">{p.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="success_vision">
          What does success look like in 12 months?
        </Label>
        <textarea
          id="success_vision"
          rows={3}
          className="flex w-full rounded-lg border-0 border-b-2 border-b-transparent bg-surface-container-highest px-3 py-2 text-sm text-on-surface placeholder:text-on-surface-variant/50 outline-none focus:border-b-primary-container resize-none"
          placeholder="e.g. Consistent $200k+ months, two new techs trained, and a membership program with 300 customers."
          value={data.success_vision}
          onChange={(e) => onChange({ success_vision: e.target.value })}
        />
      </div>
    </div>
  )
}

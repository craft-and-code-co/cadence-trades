import { STEP_TITLES } from './constants'

interface Props {
  currentStep: number
}

export function OnboardingProgress({ currentStep }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-on-surface-variant">
        <span>Step {currentStep + 1} of {STEP_TITLES.length}</span>
      </div>
      <div className="flex gap-1.5">
        {STEP_TITLES.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= currentStep ? 'bg-primary' : 'bg-surface-container-low'
            }`}
          />
        ))}
      </div>
    </div>
  )
}

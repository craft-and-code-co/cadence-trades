import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icon } from '@/components/ui/icon'
import { PLATFORM_OPTIONS, MARKETING_CHANNEL_OPTIONS } from './constants'
import type { OnboardingData } from './types'

interface Props {
  data: OnboardingData
  onChange: (updates: Partial<OnboardingData>) => void
}

export function StepCurrentTools({ data, onChange }: Props) {
  const toggleChannel = (value: string) => {
    if (value === 'none') {
      onChange({ marketing_channels: data.marketing_channels.includes('none') ? [] : ['none'] })
      return
    }
    const without = data.marketing_channels.filter((c) => c !== 'none')
    const next = without.includes(value)
      ? without.filter((c) => c !== value)
      : [...without, value]
    onChange({ marketing_channels: next })
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="field_service_platform">Field service software</Label>
        <select
          id="field_service_platform"
          className="flex h-10 w-full rounded-lg border-0 border-b-2 border-b-transparent bg-surface-container-highest px-3 py-2 text-sm text-on-surface outline-none focus:border-b-primary-container"
          value={data.field_service_platform}
          onChange={(e) =>
            onChange({
              field_service_platform: e.target.value as OnboardingData['field_service_platform'],
            })
          }
        >
          <option value="">Select platform</option>
          {PLATFORM_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tracks_marketing">
          How do you track marketing?{' '}
          <span
            className="inline-flex align-middle cursor-help text-on-surface-variant/60 hover:text-on-surface-variant"
            title="How do you know which marketing brings in calls? Examples: call tracking numbers, Google Analytics, asking customers, or nothing yet."
          >
            <Icon name="help_outline" size={16} />
          </span>
        </Label>
        <Input
          id="tracks_marketing"
          placeholder="e.g. Google Analytics, spreadsheet, or 'I don't'"
          value={data.tracks_marketing}
          onChange={(e) => onChange({ tracks_marketing: e.target.value })}
        />
      </div>

      <div className="space-y-3">
        <Label>Marketing channels</Label>
        <p className="text-sm text-muted-foreground">Select all that you use.</p>
        <div className="grid grid-cols-2 gap-2">
          {MARKETING_CHANNEL_OPTIONS.map((ch) => (
            <button
              key={ch.value}
              type="button"
              onClick={() => toggleChannel(ch.value)}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors text-left ${
                data.marketing_channels.includes(ch.value)
                  ? 'bg-primary/15 text-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {ch.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-input accent-primary"
            checked={data.has_membership}
            onChange={(e) => onChange({ has_membership: e.target.checked })}
          />
          <span className="text-sm">We offer a membership / maintenance plan</span>
        </label>

        {data.has_membership && (
          <div className="space-y-2 pl-7">
            <Label htmlFor="membership_description">Tell us about it</Label>
            <Input
              id="membership_description"
              placeholder="e.g. $19/month, includes annual tune-up"
              value={data.membership_description}
              onChange={(e) => onChange({ membership_description: e.target.value })}
            />
          </div>
        )}
      </div>
    </div>
  )
}

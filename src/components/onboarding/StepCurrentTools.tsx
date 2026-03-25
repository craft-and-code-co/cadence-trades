import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PLATFORM_OPTIONS, AD_OPTIONS } from './constants'
import type { OnboardingData } from './types'

interface Props {
  data: OnboardingData
  onChange: (updates: Partial<OnboardingData>) => void
}

export function StepCurrentTools({ data, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="field_service_platform">Field service software</Label>
        <select
          id="field_service_platform"
          className="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <Label htmlFor="tracks_marketing">How do you track marketing?</Label>
        <Input
          id="tracks_marketing"
          placeholder="e.g. Google Analytics, spreadsheet, or 'I don't'"
          value={data.tracks_marketing}
          onChange={(e) => onChange({ tracks_marketing: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="runs_paid_ads">Paid advertising?</Label>
        <select
          id="runs_paid_ads"
          className="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={data.runs_paid_ads}
          onChange={(e) =>
            onChange({ runs_paid_ads: e.target.value as OnboardingData['runs_paid_ads'] })
          }
        >
          <option value="">Select option</option>
          {AD_OPTIONS.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
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

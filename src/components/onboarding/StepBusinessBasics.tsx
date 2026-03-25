import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TRADE_OPTIONS, REVENUE_OPTIONS } from './constants'
import type { OnboardingData } from './types'

interface Props {
  data: OnboardingData
  onChange: (updates: Partial<OnboardingData>) => void
}

export function StepBusinessBasics({ data, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="company_name">
          Company name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="company_name"
          placeholder="e.g. Smith HVAC"
          value={data.company_name}
          onChange={(e) => onChange({ company_name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="trade">
          Primary trade <span className="text-destructive">*</span>
        </Label>
        <select
          id="trade"
          className="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          value={data.trade}
          onChange={(e) => onChange({ trade: e.target.value as OnboardingData['trade'] })}
        >
          <option value="">Select your trade</option>
          {TRADE_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="service_area">Service area</Label>
        <Input
          id="service_area"
          placeholder="e.g. Dallas-Fort Worth metro"
          value={data.service_area}
          onChange={(e) => onChange({ service_area: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="years_in_business">Years in business</Label>
          <Input
            id="years_in_business"
            type="number"
            min="0"
            placeholder="e.g. 12"
            value={data.years_in_business}
            onChange={(e) => onChange({ years_in_business: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="revenue_range">Annual revenue</Label>
          <select
            id="revenue_range"
            className="flex h-10 w-full rounded-md border border-input bg-input px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={data.revenue_range}
            onChange={(e) =>
              onChange({ revenue_range: e.target.value as OnboardingData['revenue_range'] })
            }
          >
            <option value="">Select range</option>
            {REVENUE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icon } from '@/components/ui/icon'
import { TRADE_OPTIONS, REVENUE_OPTIONS } from './constants'
import type { OnboardingData } from './types'
import type { Trade } from '@/types/database'

interface Props {
  data: OnboardingData
  onChange: (updates: Partial<OnboardingData>) => void
}

export function StepBusinessBasics({ data, onChange }: Props) {
  const toggleTrade = (value: Trade) => {
    const current = data.trades
    const next = current.includes(value)
      ? current.filter((t) => t !== value)
      : [...current, value]
    onChange({ trades: next })
  }

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

      <div className="space-y-3">
        <Label>
          Trades you offer <span className="text-destructive">*</span>
        </Label>
        <p className="text-sm text-muted-foreground">Select all that apply.</p>
        <div className="grid grid-cols-2 gap-2">
          {TRADE_OPTIONS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => toggleTrade(t.value)}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                data.trades.includes(t.value)
                  ? 'bg-primary/15 text-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
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
          <Label htmlFor="revenue_range">
            Annual revenue{' '}
            <span
              className="inline-flex align-middle cursor-help text-on-surface-variant/60 hover:text-on-surface-variant"
              title="Your total gross revenue for the last 12 months, before expenses. Check your P&L or tax return if unsure."
            >
              <Icon name="help_outline" size={16} />
            </span>
          </Label>
          <select
            id="revenue_range"
            className="flex h-10 w-full rounded-lg border-0 border-b-2 border-b-transparent bg-surface-container-highest px-3 py-2 text-sm text-on-surface outline-none focus:border-b-primary-container"
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

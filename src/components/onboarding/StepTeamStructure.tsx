import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { OnboardingData } from './types'

interface Props {
  data: OnboardingData
  onChange: (updates: Partial<OnboardingData>) => void
}

export function StepTeamStructure({ data, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tech_count">Field technicians</Label>
          <Input
            id="tech_count"
            type="number"
            min="0"
            placeholder="e.g. 6"
            value={data.tech_count}
            onChange={(e) => onChange({ tech_count: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="admin_count">Office / admin staff</Label>
          <Input
            id="admin_count"
            type="number"
            min="0"
            placeholder="e.g. 2"
            value={data.admin_count}
            onChange={(e) => onChange({ admin_count: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Team roles</Label>
        <div className="space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input accent-primary"
              checked={data.has_dispatcher}
              onChange={(e) => onChange({ has_dispatcher: e.target.checked })}
            />
            <span className="text-sm">Dedicated dispatcher</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input accent-primary"
              checked={data.has_service_manager}
              onChange={(e) => onChange({ has_service_manager: e.target.checked })}
            />
            <span className="text-sm">Service manager</span>
          </label>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="avg_tech_hourly_cost">Average tech hourly cost (fully burdened)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
            $
          </span>
          <Input
            id="avg_tech_hourly_cost"
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 45.00"
            className="pl-7"
            value={data.avg_tech_hourly_cost}
            onChange={(e) => onChange({ avg_tech_hourly_cost: e.target.value })}
          />
        </div>
        <p className="text-xs text-on-surface-variant">
          Include wages, benefits, vehicle, insurance — not sure? Leave blank and we'll estimate.
        </p>
      </div>
    </div>
  )
}

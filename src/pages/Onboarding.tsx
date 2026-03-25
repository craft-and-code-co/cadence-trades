import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { OnboardingProgress } from '@/components/onboarding/OnboardingProgress'
import { StepBusinessBasics } from '@/components/onboarding/StepBusinessBasics'
import { StepTeamStructure } from '@/components/onboarding/StepTeamStructure'
import { StepCurrentTools } from '@/components/onboarding/StepCurrentTools'
import { StepGoals } from '@/components/onboarding/StepGoals'
import { StepConnectData } from '@/components/onboarding/StepConnectData'
import { STEP_TITLES } from '@/components/onboarding/constants'
import { INITIAL_ONBOARDING_DATA, type OnboardingData } from '@/components/onboarding/types'

export default function Onboarding() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>(INITIAL_ONBOARDING_DATA)
  const [saving, setSaving] = useState(false)

  const update = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }

  const canAdvance = (): boolean => {
    if (step === 0) return data.company_name.trim() !== '' && data.trade !== ''
    if (step === 3) return data.pain_points.length > 0
    return true
  }

  const saveProfile = async () => {
    if (!user) return

    setSaving(true)
    const { error } = await supabase.from('company_profiles').upsert(
      {
        user_id: user.id,
        company_name: data.company_name.trim(),
        trade: data.trade || 'other',
        service_area: data.service_area || null,
        years_in_business: data.years_in_business ? parseInt(data.years_in_business) : null,
        revenue_range: data.revenue_range || null,
        tech_count: data.tech_count ? parseInt(data.tech_count) : null,
        admin_count: data.admin_count ? parseInt(data.admin_count) : null,
        has_dispatcher: data.has_dispatcher,
        has_service_manager: data.has_service_manager,
        avg_tech_hourly_cost: data.avg_tech_hourly_cost
          ? parseFloat(data.avg_tech_hourly_cost)
          : null,
        field_service_platform: data.field_service_platform || null,
        tracks_marketing: data.tracks_marketing || null,
        runs_paid_ads: data.runs_paid_ads || null,
        has_membership: data.has_membership,
        membership_description: data.membership_description || null,
        pain_points: data.pain_points,
        success_vision: data.success_vision || null,
        onboarding_complete: true,
      },
      { onConflict: 'user_id' }
    )

    setSaving(false)

    if (error) {
      toast.error('Failed to save your profile. Please try again.')
      console.error('Onboarding save error:', error)
      return false
    }

    return true
  }

  const handleNext = async () => {
    if (step < STEP_TITLES.length - 1) {
      setStep(step + 1)
    }
  }

  const handleBack = () => {
    if (step > 0) setStep(step - 1)
  }

  const handleDataChoice = async (choice: 'csv' | 'manual' | 'skip') => {
    const saved = await saveProfile()
    if (!saved) return

    if (choice === 'csv') {
      navigate('/import/csv')
    } else if (choice === 'manual') {
      navigate('/import/manual')
    } else {
      toast.success('Welcome to Cadence! You can add data anytime from Settings.')
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-surface">
      <div className="w-full max-w-lg space-y-6">
        <OnboardingProgress currentStep={step} />

        <h1 className="text-2xl font-extrabold font-headline text-on-surface">{STEP_TITLES[step]}</h1>

        {step === 0 && <StepBusinessBasics data={data} onChange={update} />}
        {step === 1 && <StepTeamStructure data={data} onChange={update} />}
        {step === 2 && <StepCurrentTools data={data} onChange={update} />}
        {step === 3 && <StepGoals data={data} onChange={update} />}
        {step === 4 && <StepConnectData onChoice={handleDataChoice} />}

        {step < 4 && (
          <div className="flex justify-between pt-2">
            <Button variant="ghost" onClick={handleBack} disabled={step === 0}>
              Back
            </Button>
            <Button onClick={handleNext} disabled={!canAdvance() || saving}>
              Continue
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="flex justify-start pt-2">
            <Button variant="ghost" onClick={handleBack} disabled={saving}>
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

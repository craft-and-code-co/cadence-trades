import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are a business coach for trades and home service companies. Generate a specific, step-by-step action plan for this recommendation. Each step should be concrete and actionable. Include exact scripts or talking points where relevant (e.g., what to say to a customer when raising prices). Format as a markdown checklist. Keep it practical — this is for a busy trades business owner, not an MBA student.`

const MAX_RETRIES = 3
const BASE_DELAY_MS = 1000

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function callOpenRouter(
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-sonnet-4-5',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 2048,
        }),
      }
    )

    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after')
      const delay = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : BASE_DELAY_MS * Math.pow(2, attempt)
      console.warn(
        `OpenRouter rate limited (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delay}ms`
      )
      await new Promise((resolve) => setTimeout(resolve, delay))
      continue
    }

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        `OpenRouter API error: ${response.status} ${response.statusText} — ${errorText}`
      )
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content
    if (!content) {
      throw new Error('OpenRouter returned empty response')
    }
    return content as string
  }

  throw lastError ?? new Error('OpenRouter rate limited after max retries')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  try {
    // ── Validate env ──
    const openrouterKey = Deno.env.get('OPENROUTER_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!openrouterKey) {
      console.error('OPENROUTER_API_KEY is not set')
      return jsonResponse({ error: 'Server configuration error' }, 500)
    }
    if (!supabaseUrl) {
      console.error('SUPABASE_URL is not set')
      return jsonResponse({ error: 'Server configuration error' }, 500)
    }
    if (!supabaseAnonKey) {
      console.error('SUPABASE_ANON_KEY is not set')
      return jsonResponse({ error: 'Server configuration error' }, 500)
    }
    if (!supabaseServiceKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
      return jsonResponse({ error: 'Server configuration error' }, 500)
    }

    // ── Parse body ──
    const body = await req.json()
    const { insight_id } = body

    if (!insight_id || typeof insight_id !== 'string') {
      return jsonResponse({ error: 'insight_id is required' }, 400)
    }

    // ── Auth: verify caller owns the insight ──
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401)
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    // RLS ensures user can only read their own company's insights
    const { data: insight, error: insightError } = await supabaseUser
      .from('insights')
      .select('*')
      .eq('id', insight_id)
      .single()

    if (insightError || !insight) {
      console.error('Insight fetch error:', insightError?.message)
      return jsonResponse({ error: 'Insight not found' }, 404)
    }

    // ── Fetch company profile ──
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { data: company, error: companyError } = await supabaseAdmin
      .from('company_profiles')
      .select('*')
      .eq('id', insight.company_id)
      .single()

    if (companyError || !company) {
      console.error('Company fetch error:', companyError?.message)
      return jsonResponse({ error: 'Company profile not found' }, 404)
    }

    // ── Build LLM prompt ──
    const companyContext = [
      `Trade: ${company.trade}`,
      `Company: ${company.company_name}`,
      company.tech_count ? `Technicians: ${company.tech_count}` : null,
      company.revenue_range ? `Revenue range: ${company.revenue_range}` : null,
      company.years_in_business
        ? `Years in business: ${company.years_in_business}`
        : null,
      company.service_area ? `Service area: ${company.service_area}` : null,
    ]
      .filter(Boolean)
      .join('\n')

    const userPrompt = `## Company Profile
${companyContext}

## Insight to Build a Plan For
**Type:** ${insight.insight_type}
**Title:** ${insight.title}
**Summary:** ${insight.summary}
**Detail:** ${insight.detail}
${insight.estimated_impact ? `**Estimated Impact:** ${insight.estimated_impact}` : ''}

Generate the action plan now.`

    // ── Call LLM ──
    const actionPlan = await callOpenRouter(
      openrouterKey,
      SYSTEM_PROMPT,
      userPrompt
    )

    // ── Persist action plan ──
    const { error: updateError } = await supabaseAdmin
      .from('insights')
      .update({ action_plan: actionPlan })
      .eq('id', insight_id)

    if (updateError) {
      console.error('Failed to update insight:', updateError.message)
      return jsonResponse({ error: 'Failed to save action plan' }, 500)
    }

    return jsonResponse({ action_plan: actionPlan }, 200)
  } catch (err) {
    console.error('generate-insight error:', err)
    const message =
      err instanceof Error ? err.message : 'Internal server error'
    return jsonResponse({ error: message }, 500)
  }
})

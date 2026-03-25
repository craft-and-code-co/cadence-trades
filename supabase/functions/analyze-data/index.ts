import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CompanyMetrics {
  revenue_last_30d: number
  revenue_last_90d: number
  revenue_same_period_last_year: number | null
  avg_ticket: number
  avg_ticket_by_service_category: Record<string, number>
  jobs_last_30d: number
  jobs_last_90d: number
  jobs_by_month: Array<{ month: string; count: number; revenue: number }>
  revenue_per_tech: Record<string, number>
  avg_hours_per_job: number
  jobs_per_tech: Record<string, number>
  jobs_by_lead_source: Record<string, number>
  revenue_by_lead_source: Record<string, number>
  new_vs_repeat_ratio: number
  avg_customer_lifetime_value: number
  member_job_count: number
  member_revenue: number
  member_avg_ticket_vs_non_member: number
  slowest_3_months_historical: string[]
  projected_slow_window: string
}

interface LLMInsight {
  insight_type: string
  title: string
  summary: string
  detail: string
  estimated_impact: string
  priority: string
}

const INSIGHT_TYPES = [
  'pricing',
  'staffing',
  'seasonal',
  'marketing',
  'membership',
  'cash_flow',
  'tech_performance',
] as const

const PRIORITIES = ['high', 'medium', 'low'] as const

const MIN_JOBS_THRESHOLD = 30
const MAX_COMPANIES_PER_RUN = 10

// ---------------------------------------------------------------------------
// Supabase client (service role — bypasses RLS)
// ---------------------------------------------------------------------------

function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
}

// ---------------------------------------------------------------------------
// OpenRouter call with exponential backoff
// ---------------------------------------------------------------------------

async function callLLM(
  systemPrompt: string,
  userPrompt: string
): Promise<LLMInsight[]> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY')
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set')

  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
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
            response_format: { type: 'json_object' },
          }),
        }
      )

      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after')
        const backoffMs = retryAfter
          ? parseInt(retryAfter, 10) * 1000
          : Math.pow(2, attempt + 1) * 1000
        console.warn(
          `OpenRouter 429 — retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries})`
        )
        await new Promise((r) => setTimeout(r, backoffMs))
        continue
      }

      if (!response.ok) {
        const body = await response.text()
        throw new Error(
          `OpenRouter ${response.status}: ${response.statusText} — ${body}`
        )
      }

      const result = await response.json()
      const content = result.choices?.[0]?.message?.content
      if (!content) throw new Error('Empty LLM response')

      const parsed = JSON.parse(content)
      const insights: LLMInsight[] = Array.isArray(parsed)
        ? parsed
        : parsed.insights ?? parsed.recommendations ?? []

      if (!Array.isArray(insights)) {
        throw new Error('LLM response is not an array of insights')
      }

      return insights
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < maxRetries - 1) {
        const backoffMs = Math.pow(2, attempt + 1) * 1000
        console.warn(
          `LLM call failed — retrying in ${backoffMs}ms (attempt ${attempt + 1}/${maxRetries}):`,
          lastError.message
        )
        await new Promise((r) => setTimeout(r, backoffMs))
      }
    }
  }

  throw lastError ?? new Error('LLM call failed after retries')
}

// ---------------------------------------------------------------------------
// Metric computation via RPC (all aggregation in SQL)
// ---------------------------------------------------------------------------

async function computeMetrics(
  supabase: ReturnType<typeof getSupabaseClient>,
  companyId: string
): Promise<CompanyMetrics> {
  const { data: raw, error } = await supabase.rpc('compute_company_metrics', {
    p_company_id: companyId,
  })

  if (error) {
    throw new Error(`compute_company_metrics failed: ${error.message}`)
  }

  // The RPC returns a jsonb object — parse the nested arrays into typed maps
  const m = raw as Record<string, unknown>

  // Tech metrics: array of { tech, job_count, revenue } -> two Record maps
  const techMetrics = (m.tech_metrics as Array<{ tech: string; job_count: number; revenue: number }>) ?? []
  const revenuePerTech: Record<string, number> = {}
  const jobsPerTech: Record<string, number> = {}
  for (const t of techMetrics) {
    revenuePerTech[t.tech] = t.revenue
    jobsPerTech[t.tech] = t.job_count
  }

  // Lead metrics: array of { source, job_count, revenue } -> two Record maps
  const leadMetrics = (m.lead_metrics as Array<{ source: string; job_count: number; revenue: number }>) ?? []
  const jobsByLeadSource: Record<string, number> = {}
  const revenueByLeadSource: Record<string, number> = {}
  for (const l of leadMetrics) {
    jobsByLeadSource[l.source] = l.job_count
    revenueByLeadSource[l.source] = l.revenue
  }

  // Slow months: array of { month_name, month_num, job_count }
  const slowMonths = (m.slow_months as Array<{ month_name: string; month_num: number; job_count: number }>) ?? []
  const slowest3 = slowMonths.map((s) => s.month_name)

  // Project next slow window
  const currentMonth = new Date().getMonth() + 1
  const slowMonthNums = slowMonths.map((s) => s.month_num)
  const upcomingSlow =
    slowMonthNums.find((n) => n >= currentMonth) ?? slowMonthNums[0]
  const monthNames = [
    '',
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ]

  return {
    revenue_last_30d: Number(m.revenue_last_30d) || 0,
    revenue_last_90d: Number(m.revenue_last_90d) || 0,
    revenue_same_period_last_year:
      m.revenue_same_period_last_year != null
        ? Number(m.revenue_same_period_last_year)
        : null,
    avg_ticket: Number(m.avg_ticket) || 0,
    avg_ticket_by_service_category:
      (m.avg_ticket_by_service_category as Record<string, number>) ?? {},
    jobs_last_30d: Number(m.jobs_last_30d) || 0,
    jobs_last_90d: Number(m.jobs_last_90d) || 0,
    jobs_by_month:
      (m.jobs_by_month as Array<{
        month: string
        count: number
        revenue: number
      }>) ?? [],
    revenue_per_tech: revenuePerTech,
    avg_hours_per_job: Number(m.avg_hours_per_job) || 0,
    jobs_per_tech: jobsPerTech,
    jobs_by_lead_source: jobsByLeadSource,
    revenue_by_lead_source: revenueByLeadSource,
    new_vs_repeat_ratio: Number(m.new_vs_repeat_ratio) || 0,
    avg_customer_lifetime_value: Number(m.avg_customer_lifetime_value) || 0,
    member_job_count: Number(m.member_job_count) || 0,
    member_revenue: Number(m.member_revenue) || 0,
    member_avg_ticket_vs_non_member:
      Number(m.member_avg_ticket_vs_non_member) || 0,
    slowest_3_months_historical: slowest3,
    projected_slow_window: monthNames[upcomingSlow] ?? 'Unknown',
  }
}

// ---------------------------------------------------------------------------
// LLM prompt construction
// ---------------------------------------------------------------------------

function buildSystemPrompt(): string {
  return `You are Cadence Trades AI — a senior business coach for trades and home service companies (HVAC, plumbing, electrical, backflow). You analyze company performance data and produce specific, dollar-quantified recommendations.

Your job is to review the company profile, their computed business metrics, and market benchmarks for their trade, then generate actionable insights.

RULES:
- Every insight MUST include a specific dollar estimate of the impact (monthly or annual).
- Reference the company's actual numbers — never use generic advice.
- Compare against market benchmarks where available and note gaps.
- Prioritize insights by potential dollar impact.
- Be direct and specific — these are busy business owners, not academics.
- Label all dollar projections as estimates.

Return a JSON object with an "insights" key containing an array of insight objects. Each insight must have:
- insight_type: one of "pricing", "staffing", "seasonal", "marketing", "membership", "cash_flow", "tech_performance"
- title: short, specific headline (e.g., "Your backflow test price is $25 below market")
- summary: 1-2 sentence explanation with dollar figures
- detail: full markdown explanation with data, reasoning, and recommended next steps
- estimated_impact: dollar impact string (e.g., "$1,050/month in additional revenue")
- priority: "high", "medium", or "low"

Generate 3-7 insights, focusing on the highest-impact opportunities first.`
}

function buildUserPrompt(
  profile: Record<string, unknown>,
  metrics: CompanyMetrics,
  benchmarks: Record<string, unknown>[]
): string {
  return `## Company Profile
${JSON.stringify(profile, null, 2)}

## Business Metrics (computed from their job data)
${JSON.stringify(metrics, null, 2)}

## Market Benchmarks for ${profile.trade ?? 'their trade'}
${JSON.stringify(benchmarks, null, 2)}

Analyze this data and generate insights. Return valid JSON only.`
}

// ---------------------------------------------------------------------------
// Insight deduplication & upsert
// ---------------------------------------------------------------------------

async function upsertInsights(
  supabase: ReturnType<typeof getSupabaseClient>,
  companyId: string,
  newInsights: LLMInsight[]
): Promise<{ inserted: number; updated: number; skipped: number }> {
  let inserted = 0
  let updated = 0
  let skipped = 0

  // Fetch existing active insights for this company
  const { data: existing } = await supabase
    .from('insights')
    .select('id, insight_type, title, summary, status')
    .eq('company_id', companyId)
    .in('status', ['new', 'in_progress'])

  const existingByType = new Map<
    string,
    Array<{ id: string; insight_type: string; title: string; summary: string; status: string }>
  >()
  for (const row of existing ?? []) {
    const list = existingByType.get(row.insight_type) ?? []
    list.push(row)
    existingByType.set(row.insight_type, list)
  }

  for (const insight of newInsights) {
    // Validate insight_type
    if (
      !INSIGHT_TYPES.includes(
        insight.insight_type as (typeof INSIGHT_TYPES)[number]
      )
    ) {
      console.warn(`Skipping invalid insight_type: ${insight.insight_type}`)
      skipped++
      continue
    }

    // Validate priority
    const priority = PRIORITIES.includes(
      insight.priority as (typeof PRIORITIES)[number]
    )
      ? insight.priority
      : 'medium'

    const matchingExisting = existingByType.get(insight.insight_type) ?? []

    // Check for substantial similarity (same type + similar title/summary)
    const duplicate = matchingExisting.find((ex) => {
      const titleSimilarity = computeSimilarity(
        ex.title.toLowerCase(),
        insight.title.toLowerCase()
      )
      const summarySimilarity = computeSimilarity(
        ex.summary.toLowerCase(),
        insight.summary.toLowerCase()
      )
      return titleSimilarity > 0.6 || summarySimilarity > 0.6
    })

    if (duplicate) {
      // Check if data changed significantly
      const summarySimilarity = computeSimilarity(
        duplicate.summary.toLowerCase(),
        insight.summary.toLowerCase()
      )

      if (summarySimilarity < 0.85) {
        // Data changed — update the existing insight
        await supabase
          .from('insights')
          .update({
            title: insight.title,
            summary: insight.summary,
            detail: insight.detail,
            estimated_impact: insight.estimated_impact,
            priority,
          })
          .eq('id', duplicate.id)
        updated++
      } else {
        // Substantially the same — skip
        skipped++
      }
    } else {
      // New insight — insert
      await supabase.from('insights').insert({
        company_id: companyId,
        insight_type: insight.insight_type,
        title: insight.title,
        summary: insight.summary,
        detail: insight.detail,
        estimated_impact: insight.estimated_impact,
        priority,
        status: 'new',
      })
      inserted++
    }
  }

  return { inserted, updated, skipped }
}

/**
 * Simple word-overlap similarity (Jaccard index).
 * Good enough for deduplication without external dependencies.
 */
function computeSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/).filter(Boolean))
  const wordsB = new Set(b.split(/\s+/).filter(Boolean))
  if (wordsA.size === 0 && wordsB.size === 0) return 1
  const intersection = new Set([...wordsA].filter((w) => wordsB.has(w)))
  const union = new Set([...wordsA, ...wordsB])
  return intersection.size / union.size
}

// ---------------------------------------------------------------------------
// Analyze a single company
// ---------------------------------------------------------------------------

async function analyzeCompany(
  supabase: ReturnType<typeof getSupabaseClient>,
  companyId: string
): Promise<{
  success: boolean
  companyId: string
  error?: string
  stats?: { inserted: number; updated: number; skipped: number }
}> {
  try {
    // 1. Check job count threshold
    const { count } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)

    if ((count ?? 0) < MIN_JOBS_THRESHOLD) {
      return {
        success: true,
        companyId,
        error: `Skipped — only ${count} jobs (minimum ${MIN_JOBS_THRESHOLD})`,
      }
    }

    // 2. Fetch company profile
    const { data: profile, error: profileError } = await supabase
      .from('company_profiles')
      .select('*')
      .eq('id', companyId)
      .single()

    if (profileError || !profile) {
      return {
        success: false,
        companyId,
        error: `Failed to fetch profile: ${profileError?.message}`,
      }
    }

    // 3. Compute metrics via SQL RPC (single round-trip)
    const metrics = await computeMetrics(supabase, companyId)

    // 4. Fetch market benchmarks for this trade
    const { data: benchmarks } = await supabase
      .from('market_benchmarks')
      .select('*')
      .eq('trade', profile.trade)

    // 5. Call LLM
    const systemPrompt = buildSystemPrompt()
    const userPrompt = buildUserPrompt(
      profile as unknown as Record<string, unknown>,
      metrics,
      (benchmarks ?? []) as unknown as Record<string, unknown>[]
    )

    const insights = await callLLM(systemPrompt, userPrompt)

    // 6. Deduplicate & upsert
    const stats = await upsertInsights(supabase, companyId, insights)

    console.log(
      `[analyze-data] Company ${companyId}: ${stats.inserted} inserted, ${stats.updated} updated, ${stats.skipped} skipped`
    )

    return { success: true, companyId, stats }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[analyze-data] Company ${companyId} failed:`, message)
    return { success: false, companyId, error: message }
  }
}

// ---------------------------------------------------------------------------
// Edge Function handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  try {
    const supabase = getSupabaseClient()
    let body: { company_id?: string } = {}

    try {
      body = await req.json()
    } catch {
      // Empty body is valid — means analyze all companies
    }

    const results: Array<{
      success: boolean
      companyId: string
      error?: string
      stats?: { inserted: number; updated: number; skipped: number }
    }> = []

    if (body.company_id) {
      // ---- Single company mode ----
      const result = await analyzeCompany(supabase, body.company_id)
      results.push(result)
    } else {
      // ---- Batch mode: all eligible companies ----
      const { data: companies, error: companiesError } = await supabase.rpc(
        'get_eligible_companies',
        { min_jobs: MIN_JOBS_THRESHOLD }
      )

      if (companiesError) {
        console.error(
          '[analyze-data] Failed to fetch eligible companies:',
          companiesError.message
        )
        return new Response(
          JSON.stringify({ error: 'Failed to fetch eligible companies' }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }

      const allCompanies = companies ?? []
      console.log(
        `[analyze-data] Found ${allCompanies.length} eligible companies`
      )

      if (allCompanies.length > MAX_COMPANIES_PER_RUN) {
        console.log(
          `[analyze-data] Limiting to ${MAX_COMPANIES_PER_RUN} companies this run; remaining ${allCompanies.length - MAX_COMPANIES_PER_RUN} will be processed on the next cron run`
        )
      }

      const batch = allCompanies.slice(0, MAX_COMPANIES_PER_RUN)

      // Process sequentially to avoid OpenRouter rate limits
      for (const company of batch) {
        const result = await analyzeCompany(supabase, company.id)
        results.push(result)
      }
    }

    const summary = {
      total: results.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    }

    console.log(
      `[analyze-data] Complete: ${summary.successful}/${summary.total} succeeded`
    )

    return new Response(JSON.stringify(summary), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[analyze-data] Unhandled error:', message)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

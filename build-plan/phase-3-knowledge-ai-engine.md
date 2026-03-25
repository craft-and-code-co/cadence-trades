# Phase 3: Knowledge Base + AI Insight Engine

**Goal:** The coaching brain is online. Knowledge base is seeded and searchable. The insight engine can analyze a company's job data and produce specific, dollar-quantified recommendations written to the `insights` table. pg_cron runs analysis daily.

**Estimated effort:** 4-5 days

**Depends on:** Phase 1 (schema, pgvector, pg_cron), Phase 2 (jobs data, company profile)

---

## 3.1 Knowledge Base Seeding

### Founder Content Preparation
The founder has an existing content library. Files need to be organized into `/knowledge/` with frontmatter:

```
knowledge/
├── pricing/
│   ├── flat-rate-pricing-strategy.md
│   ├── when-to-raise-prices.md
│   ├── labor-burden-calculation.md
│   └── price-book-structure.md
├── staffing/
│   ├── tech-bonus-spiff-programs.md
│   ├── performance-based-pay.md
│   └── hiring-retention-tactics.md
├── marketing/
│   ├── facebook-ads-local-service.md
│   ├── google-search-ads-trades.md
│   ├── local-services-ads-setup.md
│   └── tracking-marketing-roi.md
├── membership/
│   ├── maintenance-plan-structures.md
│   ├── pricing-a-membership.md
│   ├── selling-memberships-in-field.md
│   └── renewal-strategies.md
├── seasonal/
│   ├── slow-season-cash-flow.md
│   ├── pre-season-demand-generation.md
│   └── diversifying-service-offerings.md
├── cash-flow/
│   ├── job-costing-fundamentals.md
│   ├── understanding-true-margins.md
│   └── separating-personal-business.md
└── job-costing/
    ├── calculating-breakeven.md
    └── material-markup-strategies.md
```

**Frontmatter convention:**
```markdown
---
title: Flat Rate Pricing Strategy
category: pricing
trade_tags: [all]
---
```

Use `trade_tags: [all]` for universal content. Use `[hvac]`, `[plumbing]`, `[electrical]`, `[backflow]` for trade-specific content.

### `embed-documents` Edge Function
```
POST /functions/v1/embed-documents
Body: { text: string }
Returns: { embedding: number[] }
```

- Calls `text-embedding-3-small` via OpenRouter
- Returns the 1536-dimension embedding vector
- Used by the seed script and by `coach-chat` at query time

### `seed-knowledge.ts` Script
Located at `scripts/seed-knowledge.ts`. Run via `npx tsx scripts/seed-knowledge.ts`.

**Process:**
1. Glob all `.md` files in `/knowledge/`
2. Parse frontmatter (title, category, trade_tags)
3. Chunk each document: ~500 tokens per chunk, ~50 token overlap
4. For each chunk, call `embed-documents` Edge Function
5. Upsert into `knowledge_documents` keyed on `source_file + chunk_index`
6. Log: total files processed, total chunks created, any errors

**Chunking strategy:**
- Split on paragraph boundaries first (double newline)
- If a paragraph exceeds ~500 tokens, split on sentence boundaries
- Include the document title in each chunk for context: prepend `"[{title}] "` to chunk content
- Overlap: last ~50 tokens of chunk N appear at the start of chunk N+1

**Rate limiting:** OpenRouter embedding calls may need throttling. Start with 5 concurrent requests, back off on 429s.

**Idempotency:** Upsert by `source_file + chunk_index`. Re-running the script updates existing chunks and adds new ones.

---

## 3.2 Market Benchmarks Seeding

Seed `market_benchmarks` table with founder's data for the four launch trades. This is a separate migration or seed script.

**Example rows:**
| trade | service_name | benchmark_low | benchmark_high | benchmark_source |
|---|---|---|---|---|
| backflow | Backflow Test | 75 | 150 | founder_experience |
| hvac | AC Service Call | 89 | 175 | HomeAdvisor |
| plumbing | Drain Cleaning | 100 | 300 | Angi |
| electrical | Panel Upgrade | 1500 | 3000 | BLS |

Founder provides the full dataset. Script loads it into Supabase.

---

## 3.3 `analyze-data` Edge Function

The core insight engine. This is the highest-complexity function in the system.

### Trigger
- **pg_cron:** Daily at 5:00 AM UTC (configurable). Iterates all companies with `onboarding_complete = true` and `jobs count >= 30`.
- **Manual:** Called from the briefing screen via "Refresh insights" button.
- **On data import:** Triggered after CSV import completes (if job count >= 30).

### pg_cron Setup
```sql
-- Enable pg_cron (already done in Phase 1)
-- Create cron job that calls the Edge Function via pg_net
select cron.schedule(
  'daily-analyze',
  '0 5 * * *',
  $$
  select net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/analyze-data',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

The Edge Function handles iterating companies internally when called without a `company_id`. When called with a specific `company_id`, it analyzes just that company.

### Metric Aggregation (computed before LLM call)

Query the `jobs` table and compute the `CompanyMetrics` interface from the V1 spec:

```typescript
interface CompanyMetrics {
  // Revenue
  revenue_last_30d: number
  revenue_last_90d: number
  revenue_same_period_last_year: number | null
  avg_ticket: number
  avg_ticket_by_service_category: Record<string, number>

  // Job volume
  jobs_last_30d: number
  jobs_last_90d: number
  jobs_by_month: Array<{ month: string; count: number; revenue: number }>

  // Technician performance
  revenue_per_tech: Record<string, number>
  avg_hours_per_job: number
  jobs_per_tech: Record<string, number>

  // Lead sources
  jobs_by_lead_source: Record<string, number>
  revenue_by_lead_source: Record<string, number>

  // Customers
  new_vs_repeat_ratio: number
  avg_customer_lifetime_value: number

  // Membership
  member_job_count: number
  member_revenue: number
  member_avg_ticket_vs_non_member: number

  // Slow season
  slowest_3_months_historical: string[]
  projected_slow_window: string
}
```

**Important:** Compute as much as possible in SQL (aggregation queries) rather than pulling all jobs into the Edge Function. This keeps the function fast and reduces memory usage.

### Market Benchmark Lookup

After computing metrics, query `market_benchmarks` for the company's trade:
```sql
select * from market_benchmarks where trade = $1;
```

Include benchmark data in the LLM prompt so it can generate pricing gap insights with real numbers.

### LLM Call

**Model:** `anthropic/claude-sonnet-4-5` via OpenRouter

**System prompt:** As specified in V1 spec. Include:
- Full company profile JSON
- Computed metrics JSON
- Market benchmarks for their trade
- Instruction to return JSON array of insights

**Expected output:** JSON array of insight objects:
```json
[
  {
    "insight_type": "pricing",
    "title": "Your backflow test price is $25 below market",
    "summary": "You're charging $75 per test. Market range is $100-$150...",
    "detail": "Full markdown explanation...",
    "estimated_impact": "$1,050/month in additional revenue",
    "priority": "high"
  }
]
```

### Insight Deduplication
Before writing to `insights`, check for existing insights of the same type with status `new` or `in_progress` for this company. Don't create duplicates — update the existing insight if the data has changed, or skip if it's substantially the same.

### Error Handling
- If LLM returns invalid JSON: log error, skip this company, retry on next cron run
- If company has < 30 jobs: skip analysis, no error
- If OpenRouter rate limits: exponential backoff, retry up to 3 times
- Log all errors to a structured log (Supabase `pg_net` response or Edge Function logs)

---

## 3.4 `generate-insight` Edge Function

Called when user clicks "Build a plan for this" on an insight card.

```
POST /functions/v1/generate-insight
Body: { insight_id: string }
Returns: { action_plan: string }
```

**Process:**
1. Fetch the insight by ID (with company profile)
2. Call LLM with the insight context + company profile
3. Request a step-by-step action plan in markdown
4. Update the insight row: set `action_plan` field
5. Return the action plan

**System prompt addition:**
```
Generate a specific, step-by-step action plan for this recommendation.
Each step should be concrete and actionable. Include exact scripts or
talking points where relevant (e.g., what to say to a customer when
raising prices). Format as a markdown checklist.
```

---

## Phase 3 Completion Criteria

- [ ] Knowledge base seeded: all founder content chunked, embedded, and stored in `knowledge_documents`
- [ ] `match_knowledge_documents()` returns relevant results for test queries
- [ ] Market benchmarks seeded for HVAC, Plumbing, Electrical, Backflow
- [ ] `analyze-data` Edge Function: given a company with 30+ jobs, produces structured insights
- [ ] Insights written to `insights` table with type, title, summary, detail, estimated_impact, priority
- [ ] Dollar projections reference real benchmark data and company-specific metrics
- [ ] Insight deduplication prevents duplicate entries
- [ ] pg_cron job created and running daily
- [ ] `generate-insight` Edge Function produces markdown action plans
- [ ] `embed-documents` Edge Function returns embeddings
- [ ] Error handling: invalid LLM output logged and skipped, rate limits retried

---

## Dependencies for Next Phase
Phase 4 (Briefing + Coach Chat) requires:
- Insights in the database (this phase)
- Knowledge base searchable via pgvector (this phase)
- Company metrics computable (this phase)
- `embed-documents` function working (this phase — reused by coach-chat for query embedding)

# Cadence Trades — V1 MVP Build Specification

> **V1 REVISED SCOPE (2026-03-25)**
>
> Based on the `/office-hours` design session (see `cadence-trades-design.md`), V1 has
> been scoped down from the full spec below to **Approach A: AI Coach Chief of Staff** —
> a push-first, conversational coaching product with 3 core screens. The full spec remains
> as the long-term product vision; this preamble defines what ships first.
>
> ### Strategic Shift
> - **Push-first, app-second.** The primary engagement channel is a weekly email with
>   specific dollar-impact recommendations. The app is the home base for going deeper.
> - **We replace the coach, not the FSM.** Competition is the $1,500/month coaching
>   program, not ServiceTitan's analytics tab. Price at $200-400/month.
> - **Progressive disclosure.** 3 screens by default (briefing, coach chat, settings).
>   Dashboard depth layers on after validation.
>
> ### V1 Scope — IN (build these sections)
> | Section in this spec | Status | Notes |
> |---|---|---|
> | Tech Stack | **USE AS-IS** | No changes |
> | Project Structure | **SIMPLIFY** | Remove `campaigns/`, reduce `dashboard/` to briefing widget |
> | Authentication | **USE AS-IS** | No changes |
> | Onboarding Flow | **SIMPLIFY** | Steps 1-4 as-is, Step 5 CSV only (Jobber stretch) |
> | Database Schema | **USE AS-IS** | All tables needed; `campaigns` and `roi_events` tables created but unused in V1 |
> | Data Sources — CSV Import | **USE AS-IS** | Primary data input for launch |
> | Data Sources — Manual Entry | **USE AS-IS** | Fallback for small operators |
> | Edge Functions — `analyze-data` | **USE AS-IS** | Core insight engine |
> | Edge Functions — `generate-insight` | **USE AS-IS** | Action plan generation |
> | Edge Functions — `coach-chat` | **USE AS-IS** | RAG-powered conversational coach |
> | Edge Functions — `embed-documents` | **USE AS-IS** | KB seeding utility |
> | AI Insight Engine | **USE AS-IS** | All metric aggregations and insight types |
> | Coach Page | **USE AS-IS** | Primary deep-dive interface |
> | Knowledge Base + Seeding | **USE AS-IS** | Founder has existing content library — chunk, embed, and load in week 1 |
> | Environment Variables | **USE AS-IS** | No changes |
> | Cloudflare Pages Deployment | **USE AS-IS** | No changes |
>
> ### V1 Scope — DEFERRED (do not build yet)
> | Section in this spec | Status | Revisit when |
> |---|---|---|
> | Dashboard (full layout) | **REPLACE** | Replace with Weekly Briefing screen (see design doc) |
> | Insights Page (full list + filters) | **DEFER** | After validating push engagement works |
> | Campaign Generator | **DEFER** | After 3+ users are actively using insights |
> | ROI Tracking Loop | **DEFER** | After users complete their first insight action |
> | Data Sources — Housecall Pro | **DEFER** | V2+ |
> | Data Sources — Jobber OAuth | **STRETCH** | Submit OAuth app week 1; ship when approved |
> | Data Sources Page (full UI) | **DEFER** | After Jobber integration ships |
> | Settings Page (full) | **SIMPLIFY** | Company profile edit + account basics only |
>
> ### V1 Additions — NOT in original spec
> | Feature | Details |
> |---|---|
> | **Weekly Briefing Screen** | Replaces dashboard. "Morning, Josh." + 3 KPIs (revenue vs. last week, jobs completed, avg ticket) + 1-2 insight cards with dollar projections. See design doc. |
> | **Push Email System** | Monday morning email with highest-priority insight, projected dollar impact, and CTA to open app. Requires email service (Resend/SendGrid). Stretch: SMS. |
> | **Insight Engine Data Model** | Dollar projections: `(benchmark - current) x volume`. Market benchmarks founder-curated, spot-checked against HomeAdvisor/Angi/BLS. Confidence tiers: <50 jobs = "early estimate," 50-200 = "based on your data," >200 = "high confidence." |
> | **Minimum Data Threshold** | 30+ jobs required before insight engine generates recommendations. Below that: "keep logging jobs" message. |
> | **KB Fallback Mode** | If knowledge base has <30 documents by week 2, coach chat launches with curated FAQ pairs instead of open-ended RAG. |
| **Scheduled Analysis (pg_cron)** | Use Supabase `pg_cron` extension to trigger `analyze-data` on a daily schedule. Generates fresh insights and powers the Monday morning push email. |
| **Email Delivery (Resend)** | Resend selected as email provider for push notifications. Core engagement channel — not a dependency, a feature. Build priority alongside push system. |
>
> ### V1 Build Priority (revised)
> 1. Supabase project setup + schema migration (including pgvector, pg_cron)
> 2. Auth (signup, login, password reset)
> 3. Onboarding flow (simplified — Steps 1-4)
> 4. CSV import + manual entry
> 5. Knowledge base: chunk, embed, and load founder's existing content library via seed script
> 6. Edge Functions: `analyze-data` (with pg_cron daily schedule) + `generate-insight` + `coach-chat` + `embed-documents`
> 7. Weekly Briefing screen (replaces dashboard)
> 8. Coach chat page with full RAG
> 9. Push email system via Resend (Monday morning insight email — core engagement channel)
> 10. Basic settings page
> 11. Polish: empty states, loading states, error handling, min-data-threshold UX
> 12. Cloudflare Pages deployment + Supabase production setup
>
> ### Pre-Build Validation (DO THIS FIRST)
> Before writing code: call Josh + 2 other clients. Pitch: "A tool that emails you
> every Monday with one specific thing to do to make more money — based on your actual
> Jobber data." If 2 of 3 react with more than "that sounds cool," build. If not, dig
> into why.

---

## Overview

Cadence Trades is an AI-powered business coach for trades and home service companies. It connects to their operational data, analyzes performance, and delivers specific, actionable recommendations that feel like having a seasoned business coach on staff 24/7 — without the price tag or generic advice.

The core value loop:
1. User connects or imports their data
2. System analyzes it continuously and surfaces insights
3. User gets specific recommendations with a plan to execute
4. System tracks what happened after and proves its own ROI

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript (Vite) |
| Styling | Tailwind CSS + shadcn/ui |
| Backend / Auth / DB | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| AI / LLM | OpenRouter API (called via Supabase Edge Functions only — key never exposed to client) |
| Vector Search / RAG | Supabase pgvector (built-in PostgreSQL extension) |
| Embeddings | OpenAI `text-embedding-3-small` via OpenRouter |
| Deployment | Cloudflare Pages (frontend) + Supabase Edge Functions (backend logic) |
| File Storage | Supabase Storage (CSV uploads, user assets) |

**Critical:** All OpenRouter API calls must be made from Supabase Edge Functions. The API key lives in Supabase environment variables and is never sent to or accessible by the client.

---

## Project Structure

```
cadence-trades/
├── src/
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── layout/          # Shell, Sidebar, TopBar
│   │   ├── dashboard/       # Dashboard widgets and cards
│   │   ├── insights/        # Insight cards, detail panels
│   │   ├── data/            # Data import/connection components
│   │   ├── campaign/        # Campaign generator components
│   │   └── onboarding/      # Onboarding flow components
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Insights.tsx
│   │   ├── DataSources.tsx
│   │   ├── Campaigns.tsx
│   │   ├── Coach.tsx        # Conversational AI coach
│   │   ├── Settings.tsx
│   │   └── Onboarding.tsx
│   ├── hooks/
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── utils.ts
│   ├── types/
│   └── App.tsx
├── supabase/
│   ├── functions/
│   │   ├── analyze-data/    # Main analysis engine
│   │   ├── generate-insight/
│   │   ├── generate-campaign/
│   │   ├── coach-chat/      # RAG-powered conversational coach
│   │   └── embed-documents/ # One-time + on-demand KB seeding
│   └── migrations/
├── knowledge/               # Source markdown files for the RAG knowledge base
│   ├── pricing/
│   ├── staffing/
│   ├── marketing/
│   ├── membership/
│   ├── seasonal/
│   ├── cash-flow/
│   └── job-costing/
├── scripts/
│   └── seed-knowledge.ts    # Script to chunk, embed, and load KB docs into Supabase
├── public/
└── vite.config.ts
```

---

## Authentication

Use Supabase Auth with email/password for V1. Each user belongs to one company (1:1 for MVP). Add team/multi-user support post-launch.

- Email + password signup/login
- Email confirmation required
- Password reset flow
- Session managed via Supabase client
- Protected routes via React Router + auth context

---

## Onboarding Flow

This is a first-class feature. Onboarding collects the business context that colors every AI output throughout the product. It should feel like setting up a coach, not filling out a form.

### Step 1: Business Basics
- Company name
- Primary trade (HVAC, Plumbing, Electrical, Landscaping, Pest Control, General Home Services, Other)
- Service area (city/region -- text input for V1)
- Years in business
- Approximate annual revenue range (ranges, not exact: Under $500k / $500k-$1M / $1M-$3M / $3M+)

### Step 2: Team Structure
- Number of field technicians
- Number of office/admin staff
- Do you have a dedicated dispatcher? (yes/no)
- Do you have a service manager? (yes/no)
- Average tech hourly cost (fully burdened -- include benefits, taxes, vehicle)

### Step 3: Current Tools
- Field service software (ServiceTitan / Housecall Pro / Jobber / Workiz / None / Other)
- How do you currently track marketing performance? (free text or "I don't")
- Do you run paid advertising? (Google / Facebook / Both / Neither)
- Do you have a membership/maintenance plan? (yes/no -- if yes, brief description)

### Step 4: Goals and Pain Points
- What is your biggest challenge right now? (multiselect)
  - Finding and keeping good techs
  - Slow seasons killing cash flow
  - Pricing -- not sure if I'm charging enough
  - Converting more calls to booked jobs
  - Techs not selling enough on the job
  - Managing cash flow and knowing my numbers
  - Growing revenue without working more hours
  - Other (free text)
- What does success look like in 12 months? (free text, 2-3 sentences)

### Step 5: Connect Your Data
- Option A: Connect field service platform (show available integrations -- see Data Sources section)
- Option B: Upload a CSV file (show template download links)
- Option C: Enter manually (basic job log table)
- Skip for now (can connect later -- they'll see limited insights)

Store all onboarding data in the `company_profiles` table. Pass the full company profile as system context in every AI call.

---

## Database Schema (Supabase / PostgreSQL)

```sql
-- Users (handled by Supabase Auth)

-- Company profiles (1:1 with auth user for V1)
create table company_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  company_name text not null,
  trade text not null,
  service_area text,
  years_in_business int,
  revenue_range text,
  tech_count int,
  admin_count int,
  has_dispatcher boolean,
  has_service_manager boolean,
  avg_tech_hourly_cost numeric,
  field_service_platform text,
  tracks_marketing boolean,
  runs_paid_ads text,
  has_membership boolean,
  membership_description text,
  pain_points text[],
  success_vision text,
  onboarding_complete boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Jobs / invoices (normalized from any data source)
create table jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references company_profiles not null,
  external_id text,                    -- original ID from source platform
  source text not null,                -- 'housecall_pro' | 'jobber' | 'csv' | 'manual'
  job_date date not null,
  job_type text,                       -- 'service' | 'install' | 'maintenance' | 'estimate'
  service_category text,               -- 'HVAC' | 'Plumbing' | etc
  service_name text,
  technician_name text,
  technician_id text,
  hours_on_job numeric,
  parts_cost numeric,
  labor_revenue numeric,
  total_revenue numeric not null,
  invoice_paid boolean default true,
  customer_id text,
  customer_zip text,
  lead_source text,                    -- 'google' | 'facebook' | 'referral' | 'repeat' | 'other'
  membership_job boolean default false,
  upsell_attempted boolean,
  upsell_converted boolean,
  notes text,
  created_at timestamptz default now()
);

-- Employees / technicians
create table technicians (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references company_profiles not null,
  name text not null,
  hourly_rate numeric,
  hourly_burdened_cost numeric,        -- fully loaded cost with taxes, benefits, vehicle
  start_date date,
  active boolean default true,
  created_at timestamptz default now()
);

-- Service / price book
create table service_catalog (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references company_profiles not null,
  service_name text not null,
  category text,
  flat_rate_price numeric,
  estimated_hours numeric,
  parts_cost_estimate numeric,
  active boolean default true,
  created_at timestamptz default now()
);

-- Customers
create table customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references company_profiles not null,
  external_id text,
  name text,
  zip_code text,
  acquisition_source text,
  first_job_date date,
  last_job_date date,
  lifetime_value numeric default 0,
  job_count int default 0,
  is_member boolean default false,
  created_at timestamptz default now()
);

-- AI-generated insights
create table insights (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references company_profiles not null,
  insight_type text not null,          -- 'pricing' | 'staffing' | 'seasonal' | 'marketing' | 'membership' | 'cash_flow' | 'tech_performance'
  title text not null,
  summary text not null,
  detail text not null,                -- full markdown explanation
  action_plan text,                    -- markdown step-by-step action plan
  estimated_impact text,               -- e.g. "$800-$1,200/month in additional revenue"
  priority text default 'medium',      -- 'high' | 'medium' | 'low'
  status text default 'new',           -- 'new' | 'in_progress' | 'completed' | 'dismissed'
  roi_tracked boolean default false,
  roi_result text,                     -- filled in later by ROI tracking
  dismissed_at timestamptz,
  created_at timestamptz default now()
);

-- Campaigns
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references company_profiles not null,
  insight_id uuid references insights,  -- linked insight if campaign came from one
  campaign_name text not null,
  platform text not null,               -- 'facebook' | 'google' | 'both'
  objective text,                       -- what problem this campaign addresses
  suggested_start_date date,
  suggested_end_date date,
  suggested_budget_range text,
  ad_copy jsonb,                        -- headline, body, cta for each platform
  targeting_guide text,                 -- markdown setup instructions
  canva_template_url text,
  setup_checklist jsonb,
  status text default 'draft',          -- 'draft' | 'launched' | 'completed'
  launched_at date,
  completed_at date,
  created_at timestamptz default now()
);

-- ROI tracking events
create table roi_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references company_profiles not null,
  insight_id uuid references insights,
  campaign_id uuid references campaigns,
  tracking_start date not null,
  tracking_end date,
  baseline_metric text,                -- what metric we're watching
  baseline_value numeric,
  current_value numeric,
  delta numeric,
  delta_revenue_estimate numeric,
  summary text,
  created_at timestamptz default now()
);

-- Coach chat conversations (thread metadata)
create table coach_conversations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references company_profiles not null,
  topic text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Coach chat messages (individual messages, queryable and pageable)
create table coach_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references coach_conversations not null,
  company_id uuid references company_profiles not null,
  role text not null,              -- 'user' | 'assistant'
  content text not null,
  created_at timestamptz default now()
);

-- RAG knowledge base documents
-- Requires: enable the pgvector extension in Supabase dashboard first
-- Run: create extension if not exists vector;
create table knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,              -- 'pricing' | 'staffing' | 'marketing' | 'membership' | 'seasonal' | 'cash_flow' | 'job_costing'
  source_file text,                    -- original markdown filename for traceability
  chunk_index int not null,            -- position of this chunk within the source doc
  content text not null,               -- the raw text chunk
  embedding vector(1536),              -- text-embedding-3-small produces 1536 dimensions
  trade_tags text[],                   -- optional: ['hvac', 'plumbing', 'all'] for trade-specific filtering
  created_at timestamptz default now()
);

-- Index for fast cosine similarity search (HNSW works well at any scale, no reindexing needed)
create index on knowledge_documents
  using hnsw (embedding vector_cosine_ops);

-- Helper function for semantic search (called from Edge Functions)
create or replace function match_knowledge_documents(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5,
  filter_category text default null,
  filter_trade text default null
)
returns table (
  id uuid,
  title text,
  category text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    kd.id,
    kd.title,
    kd.category,
    kd.content,
    1 - (kd.embedding <=> query_embedding) as similarity
  from knowledge_documents kd
  where
    (filter_category is null or kd.category = filter_category)
    and (filter_trade is null or kd.trade_tags @> array[filter_trade] or kd.trade_tags @> array['all'])
    and 1 - (kd.embedding <=> query_embedding) > match_threshold
  order by kd.embedding <=> query_embedding
  limit match_count;
$$;

-- Data source connections
create table data_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references company_profiles not null,
  platform text not null,
  status text default 'active',        -- 'active' | 'error' | 'disconnected'
  last_sync timestamptz,
  sync_error text,
  created_at timestamptz default now()
);
```

---

## Data Sources (V1 Scope)

### Priority Order for V1:
1. **CSV Import** (launch with this -- broadest compatibility)
2. **Manual Entry** (simple table UI)
3. **Jobber** (first integration — Josh uses Jobber, OAuth app submitted week 1)
4. **Housecall Pro** (post-launch, good API)

Architecture should support pluggable integrations — each platform normalizes into the same `jobs` schema. ServiceTitan is the dominant platform but has a locked, expensive API. Roadmap for V2+.

### CSV Import
Provide downloadable template CSVs for:
- Job history (date, service type, tech name, hours, revenue, lead source)
- Customer list (name, zip, first job, last job, total spend)
- Price book (service name, category, flat rate, estimated hours)

The import flow should:
1. Accept the file upload
2. Run a preview with column mapping UI (user confirms which CSV column maps to which field)
3. Validate and flag obvious issues (missing dates, negative revenue, etc.)
4. Show a summary before confirming import
5. Store raw CSV in Supabase Storage, normalized data in jobs/customers tables

### Manual Entry
A simple table UI where users can add jobs row by row. Good enough for small operators who don't use software. Fields: date, service, tech, hours, revenue, lead source.

### Housecall Pro + Jobber (V1 stretch goal)
Use their OAuth flows. Store refresh tokens in Supabase (encrypted via Vault). Run a sync via Edge Function on a schedule (or user-triggered). Normalize their data into the jobs schema.

---

## Supabase Edge Functions

All AI calls route through Edge Functions. Never call OpenRouter from the client.

### `analyze-data`
Triggered daily via Supabase `pg_cron` extension. Reads the company's recent jobs data, aggregates key metrics, and passes them to OpenRouter with the company profile as context. Returns structured insight objects that get written to the `insights` table. Also powers the Monday morning push email (highest-priority insight selected and sent via Resend).

**Model:** Use `anthropic/claude-sonnet-4-5` via OpenRouter for analysis tasks.

**System prompt structure:**
```
You are a business performance coach specializing in home service and trades businesses.
You have deep expertise in pricing strategy, technician performance, seasonal planning,
marketing ROI, and membership program design.

Company context:
{company_profile JSON}

Your job is to analyze the data provided and return a JSON array of insights.
Each insight must be specific, actionable, and grounded in the actual numbers provided.
Never give generic advice. Every recommendation must reference specific data points.

Return ONLY a valid JSON array. No preamble or explanation outside the JSON.
```

### `generate-insight`
Takes a specific insight ID and generates the full action plan. Called when a user clicks "Build a plan for this" on an insight card.

### `generate-campaign`
Takes a campaign brief (slow season dates, trade type, company profile, suggested offer) and returns structured campaign content: ad copy for Facebook and Google, targeting parameters as plain English instructions, budget recommendation, Canva template URL, and a step-by-step setup checklist.

**Canva template URL logic:** Map trade type + platform to a curated set of Canva template URLs. Maintain a simple lookup table in the codebase:
```typescript
const canvaTemplates = {
  hvac: {
    facebook: "https://www.canva.com/...",
    google_display: "https://www.canva.com/..."
  },
  plumbing: { ... },
  // etc.
}
```

### `coach-chat`
Handles the conversational coach interface. Maintains message history in context. Implements full vector RAG using Supabase pgvector.

**RAG flow for every message:**
1. Receive the user's message
2. Generate an embedding for it using `text-embedding-3-small` via OpenRouter
3. Run `match_knowledge_documents()` in Supabase with that embedding -- retrieve top 4-5 chunks above the similarity threshold (0.7)
4. Optionally filter by `category` if the topic is clearly identifiable, and by `trade_tag` matching the company's trade
5. Inject retrieved chunks into the system prompt as grounding context
6. Include the full company profile and a summary of active insights as additional context
7. Call the LLM with the assembled prompt and return the response

**System prompt structure:**
```
You are Cadence, an expert business coach for home service and trades companies.
You are direct, practical, and specific. You never give generic advice.
Every recommendation must reference the company's actual data or the knowledge
provided to you.

Company profile:
{company_profile JSON}

Current active insights for this company:
{insight summaries}

Relevant knowledge from your coaching library:
---
{retrieved RAG chunks, each labeled with its source title}
---

Use the knowledge above to inform your response, but always tie it back to
this specific company's situation. If the knowledge doesn't cover something
the user is asking about, say so clearly rather than guessing.
```

**Model:** Use `anthropic/claude-sonnet-4-5` via OpenRouter.

### `embed-documents`
A utility Edge Function used during knowledge base seeding. Accepts a text chunk and returns its embedding vector. Called by the `seed-knowledge.ts` script during initial setup and whenever new KB documents are added.

---

## AI Insight Engine

### Metric Aggregations (computed before AI call)

Before calling the LLM, compute these aggregates from the jobs table and pass them as structured data:

```typescript
interface CompanyMetrics {
  // Revenue
  revenue_last_30d: number
  revenue_last_90d: number
  revenue_same_period_last_year: number
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
  
  // Membership (if applicable)
  member_job_count: number
  member_revenue: number
  member_avg_ticket_vs_non_member: number
  
  // Slow season signal
  slowest_3_months_historical: string[]
  projected_slow_window: string
}
```

### Core Insight Types to Generate

The system should actively look for these patterns in the data:

1. **Pricing Gap** -- "Your average AC service ticket is $X. Industry benchmark for your region is $Y. You're leaving approximately $Z/month on the table."
2. **Tech Performance Spread** -- "Your top tech generates 2.4x the revenue of your average tech. Here's what's different and how to close the gap."
3. **Slow Season Forecast** -- "Based on 2 years of data, your slowest stretch is coming in [X weeks]. Here's a campaign to run before it hits."
4. **Lead Source ROI** -- "Jobs from Google Ads are converting at X% but your referral jobs convert at Y%. Your cost per booked job varies significantly."
5. **Upsell Opportunity** -- "Your [service category] jobs have the highest ticket and fastest completion time. They're your most profitable job type and you're not running enough of them."
6. **Membership Program** -- "You have X repeat customers who've spent an average of $Y over 2 years. A $Z/year maintenance plan would lock in that revenue and increase their frequency."
7. **Call Conversion** (if data available) -- "X% of your estimates are not converting. Here's what your booking rate implies and how to improve it."
8. **Money Left on the Table Report** -- Monthly summary. Dollar figure attached. This is a high-priority, always-visible insight.

---

## Dashboard

The dashboard is the first thing users see after onboarding. It should feel like a morning briefing, not a data dump.

### Layout (top to bottom):

**Header bar:** "Good morning, [name]. Here's what's happening with [Company Name]."

**Data health banner** (if data is sparse or stale): "Your data is [X] days old. [Sync now / Import updated file]"

**KPI row (4 cards):**
- Revenue last 30 days (vs. prior 30 days, +/- %)
- Jobs completed last 30 days
- Average ticket (vs. 90-day average)
- Active insights waiting for your attention (count)

**Top Insight (full width):** The highest priority insight with a brief summary and CTA button: "See the plan"

**Insight cards grid (2 columns):** Next 4-6 insights, each showing type, title, estimated impact, and a "Review" button

**Seasonal forecast widget:** Simple visual showing job volume by month (bar chart) with the next forecasted slow window highlighted

**Recent activity feed:** Last 5 jobs imported or synced, last insight generated

---

## Insights Page

Full list of all insights, filterable by:
- Type (pricing, staffing, seasonal, marketing, membership, cash flow)
- Priority (high, medium, low)
- Status (new, in progress, completed, dismissed)

Each insight card expands into a detail panel with:
- Full explanation with specific data references
- Estimated impact (revenue or cost)
- "Build a plan for this" button (triggers `generate-insight` edge function)
- Action plan (shown after generation, formatted as markdown checklist)
- "Mark as in progress" / "Mark as complete" / "Dismiss" controls
- ROI tracking section (appears after status = completed, prompts user to confirm they took action and sets up tracking window)

---

## Campaign Generator

Accessible from:
- An insight card of type 'seasonal' or 'marketing' (context pre-filled)
- Direct navigation from sidebar

### Flow:

**Step 1: Campaign Brief**
Pre-filled from insight context if available. User can adjust:
- What problem are we solving? (slow season / general awareness / specific service push)
- Target run dates
- Estimated budget range
- Platform (Facebook / Google / Both)
- Offer or hook (e.g. "Free tune-up with any service call in January")

**Step 2: Generated Campaign Package**
Show in a clean formatted layout:

```
FACEBOOK AD
-----------
Headline: [generated]
Primary text: [generated]
Call to action: [generated]
Recommended placement: Feed + Stories

GOOGLE SEARCH AD
-----------
Headline 1: [generated]
Headline 2: [generated]
Headline 3: [generated]
Description 1: [generated]
Description 2: [generated]

TARGETING
-----------
[Plain English instructions for setting up audience targeting in each platform]

BUDGET
-----------
[Recommendation with brief rationale]

SETUP CHECKLIST
-----------
[ ] Create a Facebook Business account if you don't have one
[ ] Go to Ads Manager > Create Campaign
[... step by step ...]

IMAGE
-----------
We recommend using a branded photo from your team or truck.
If you need a starting point, use one of these Canva templates:
→ [Facebook template for HVAC] canva.com/...
→ [Google Display template for HVAC] canva.com/...
Tips: Use your brand colors. Add your phone number. Keep text under 20% of the image.
```

**Step 3: Save and Track**
User can save the campaign. If they confirm they launched it, system sets a tracking start date and monitors the job data over the following 4-6 weeks to report on any lift.

---

## Coach Page (Conversational AI)

A chat interface where users can ask anything about their business. This is the deep-dive layer -- the place where an insight turns into a real working plan through conversation.

### Features:
- Persistent conversation threads (user can start new threads by topic)
- Full company profile and current insight summaries injected as context on every call
- Full vector RAG: every user message is embedded and used to retrieve the most relevant coaching knowledge chunks from Supabase pgvector before the LLM call
- Retrieved context chunks are injected into the system prompt with source labels so the LLM can cite them
- Responses formatted in markdown (rendered in the UI)
- "Save this plan" button to export the conversation or a specific response as a saved plan (stored in Supabase)

### Knowledge Base

The knowledge base lives in the `/knowledge` directory as structured markdown files. Topics to cover at launch:

- **Pricing:** Flat rate pricing strategy, price book structure, when and how to raise prices, labor burden calculation
- **Staffing:** Technician bonus and spiff programs, performance-based pay structures, hiring and retention tactics
- **Marketing:** Facebook Ads basics for local service businesses, Google Search Ads for trades, LSA (Local Services Ads) setup, tracking what works
- **Membership:** Maintenance plan structures, pricing a membership, selling memberships in the field, renewal strategies
- **Seasonal:** Slow season cash flow tactics, pre-season demand generation, diversifying service offerings
- **Cash Flow:** Job costing fundamentals, understanding true margins, separating personal and business finances
- **Customer Retention:** LTV maximization, follow-up systems, referral programs, review generation

### Knowledge Base Seeding

The `scripts/seed-knowledge.ts` script handles the initial load:

1. Read each markdown file from `/knowledge`
2. Chunk each document (target ~500 tokens per chunk with ~50 token overlap)
3. For each chunk, call the `embed-documents` Edge Function to get the embedding vector
4. Upsert the chunk + embedding into `knowledge_documents`
5. Tag each document with `trade_tags` based on directory or frontmatter (use `['all']` for universal content)

Re-run the script whenever knowledge base files are updated. Chunks are upserted by `source_file + chunk_index` so existing records are updated cleanly.

**Frontmatter convention for KB markdown files:**
```markdown
---
title: Flat Rate Pricing Strategy
category: pricing
trade_tags: [all]
---
```

---

## Data Sources Page

Shows:
- All connected data sources with status (active / error / disconnected)
- Last sync time
- Row counts (jobs, customers, etc.)
- Connect new source button
- Manual CSV import button
- Data health score (simple: % of jobs with complete key fields)

---

## Settings Page

- Company profile (edit onboarding answers)
- Account (email, password)
- Notification preferences (V1: none -- placeholder)
- Subscription / billing (V1: placeholder -- integrate Stripe post-MVP)
- Danger zone: delete account / all data

---

## ROI Tracking Loop

This is what makes the product defensible and sticky.

### How it works:
1. User marks an insight as "completed" (they took the recommended action)
2. System records a baseline: the relevant metric at that point in time (e.g., average ticket price, job volume, revenue for that service category)
3. After 30 days, system computes the delta and generates a ROI summary
4. That summary appears on the insight card and on the dashboard: "This pricing adjustment generated an estimated $X in additional revenue over the last 30 days"

### Attribution caveat:
The system should always frame ROI as an estimate, not a guarantee. Use language like "estimated lift" and "based on your data before and after this change." Don't overclaim causality -- be honest and specific.

---

## UI/UX Notes

- Color palette: dark navy base with amber/gold accent. Feels like a serious tool, not a toy.
- Typography: something with weight and confidence -- a trade-appropriate brand feel, not startup-generic
- Mobile: responsive but this is a desktop-primary product. Trades owners will use this in the office or on a tablet, not on the job site.
- Loading states: AI calls take time. Show a thinking state that feels intentional, not a spinner. Something like "Analyzing your last 90 days..." with a progress indicator.
- Empty states: if data is sparse, show encouraging messaging and clear CTAs to add data. Never show a broken or empty dashboard.
- Toast notifications for sync completions, new insights generated, saved plans

---

## Environment Variables

```
# Supabase (client-safe)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# OpenRouter (Edge Function only -- never in client)
OPENROUTER_API_KEY=

# Set in Supabase Edge Function environment, not in .env
```

**Supabase setup checklist before first deploy:**
- Enable the `pgvector` extension: Supabase Dashboard > Database > Extensions > search "vector" > enable
- Run all migrations (schema + pgvector tables + `match_knowledge_documents` function)
- Run `scripts/seed-knowledge.ts` to populate the knowledge base with initial documents
- Set `OPENROUTER_API_KEY` in Supabase Edge Function secrets

---

## Cloudflare Pages Deployment

- Build command: `npm run build`
- Output directory: `dist`
- Environment variables: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Cloudflare Pages settings
- Add `_redirects` file in `public/` for SPA routing:
  ```
  /* /index.html 200
  ```

---

## V1 Out of Scope (Roadmap)

These are explicitly excluded from V1 to keep scope tight:

- ServiceTitan integration
- Team/multi-user accounts
- Native image generation
- Direct ad platform API integrations
- Native mobile app
- Email or SMS notifications
- Stripe billing (add before public launch)
- White-label or agency mode

---

## Build Priority Order

1. Supabase project setup + schema migration (including pgvector extension)
2. Auth (signup, login, password reset)
3. Onboarding flow (company profile collection)
4. Data import (CSV upload + manual entry)
5. Knowledge base: chunk, embed, and load founder's existing content library into pgvector via seed script
6. Edge Functions: analyze-data (with pg_cron scheduling) + generate-insight
7. Dashboard (KPIs + insight cards)
8. Insights page (full list + detail + action plan)
9. Coach chat with full RAG (embed query > vector search > inject context > LLM call)
10. Campaign generator
11. Data Sources page + settings
12. ROI tracking loop
13. Polish: empty states, loading states, error handling
14. Cloudflare Pages deployment + Supabase production setup

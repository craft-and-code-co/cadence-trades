-- Cadence Trades — Initial Schema Migration
-- Includes all tables for V1 + deferred features (campaigns, roi_events)

-- Extensions
create extension if not exists vector;
create extension if not exists pg_cron;

-- ============================================
-- TABLES
-- ============================================

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
  email_opt_in boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Jobs / invoices (normalized from any data source)
create table jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references company_profiles not null,
  external_id text,
  source text not null,                -- 'jobber' | 'housecall_pro' | 'csv' | 'manual'
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

-- Technicians
create table technicians (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references company_profiles not null,
  name text not null,
  hourly_rate numeric,
  hourly_burdened_cost numeric,
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
  detail text not null,
  action_plan text,
  estimated_impact text,
  priority text default 'medium',      -- 'high' | 'medium' | 'low'
  status text default 'new',           -- 'new' | 'in_progress' | 'completed' | 'dismissed'
  roi_tracked boolean default false,
  roi_result text,
  dismissed_at timestamptz,
  created_at timestamptz default now()
);

-- Campaigns (created, unused in V1)
create table campaigns (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references company_profiles not null,
  insight_id uuid references insights,
  campaign_name text not null,
  platform text not null,
  objective text,
  suggested_start_date date,
  suggested_end_date date,
  suggested_budget_range text,
  ad_copy jsonb,
  targeting_guide text,
  canva_template_url text,
  setup_checklist jsonb,
  status text default 'draft',
  launched_at date,
  completed_at date,
  created_at timestamptz default now()
);

-- ROI tracking events (created, unused in V1)
create table roi_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references company_profiles not null,
  insight_id uuid references insights,
  campaign_id uuid references campaigns,
  tracking_start date not null,
  tracking_end date,
  baseline_metric text,
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

-- Coach chat messages (individual messages)
create table coach_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references coach_conversations not null,
  company_id uuid references company_profiles not null,
  role text not null,                  -- 'user' | 'assistant'
  content text not null,
  created_at timestamptz default now()
);

-- RAG knowledge base documents
create table knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  source_file text,
  chunk_index int not null,
  content text not null,
  embedding vector(1536),
  trade_tags text[],
  created_at timestamptz default now()
);

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

-- Market benchmarks (founder-curated)
create table market_benchmarks (
  id uuid primary key default gen_random_uuid(),
  trade text not null,
  region text,
  service_name text not null,
  benchmark_low numeric not null,
  benchmark_high numeric not null,
  benchmark_source text,
  notes text,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Email log (for tracking sends)
create table email_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references company_profiles not null,
  email_type text not null,
  insight_id uuid references insights,
  sent_at timestamptz default now(),
  resend_id text
);

-- ============================================
-- INDEXES
-- ============================================

-- HNSW vector index for semantic search
create index on knowledge_documents
  using hnsw (embedding vector_cosine_ops);

-- Performance indexes
create index idx_jobs_company_id on jobs (company_id);
create index idx_jobs_company_date on jobs (company_id, job_date desc);
create index idx_insights_company_id on insights (company_id);
create index idx_insights_company_status on insights (company_id, status);
create index idx_coach_messages_conversation on coach_messages (conversation_id, created_at);
create index idx_coach_conversations_company on coach_conversations (company_id, updated_at desc);
create index idx_customers_company_id on customers (company_id);
create index idx_technicians_company_id on technicians (company_id);
create index idx_market_benchmarks_trade on market_benchmarks (trade);
create index idx_knowledge_documents_category on knowledge_documents (category);
create index idx_email_log_company on email_log (company_id, sent_at desc);

-- Unique constraint for KB chunk upserts
create unique index idx_knowledge_documents_source_chunk
  on knowledge_documents (source_file, chunk_index);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Semantic search helper
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

-- Auto-update updated_at timestamp
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger company_profiles_updated_at
  before update on company_profiles
  for each row execute function update_updated_at();

create trigger coach_conversations_updated_at
  before update on coach_conversations
  for each row execute function update_updated_at();

create trigger market_benchmarks_updated_at
  before update on market_benchmarks
  for each row execute function update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table company_profiles enable row level security;
alter table jobs enable row level security;
alter table technicians enable row level security;
alter table service_catalog enable row level security;
alter table customers enable row level security;
alter table insights enable row level security;
alter table campaigns enable row level security;
alter table roi_events enable row level security;
alter table coach_conversations enable row level security;
alter table coach_messages enable row level security;
alter table knowledge_documents enable row level security;
alter table data_connections enable row level security;
alter table market_benchmarks enable row level security;
alter table email_log enable row level security;

-- Helper: get current user's company_id
create or replace function public.get_company_id()
returns uuid
language sql stable
security definer
set search_path = public
as $$
  select id from company_profiles where user_id = auth.uid()
$$;

-- Company profiles: users manage their own
create policy "Users manage own profile"
  on company_profiles for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Company-scoped tables: read/write own company's data
create policy "Users manage own jobs"
  on jobs for all
  using (company_id = public.get_company_id())
  with check (company_id = public.get_company_id());

create policy "Users manage own technicians"
  on technicians for all
  using (company_id = public.get_company_id())
  with check (company_id = public.get_company_id());

create policy "Users manage own service catalog"
  on service_catalog for all
  using (company_id = public.get_company_id())
  with check (company_id = public.get_company_id());

create policy "Users manage own customers"
  on customers for all
  using (company_id = public.get_company_id())
  with check (company_id = public.get_company_id());

create policy "Users manage own insights"
  on insights for all
  using (company_id = public.get_company_id())
  with check (company_id = public.get_company_id());

create policy "Users manage own campaigns"
  on campaigns for all
  using (company_id = public.get_company_id())
  with check (company_id = public.get_company_id());

create policy "Users manage own roi events"
  on roi_events for all
  using (company_id = public.get_company_id())
  with check (company_id = public.get_company_id());

create policy "Users manage own conversations"
  on coach_conversations for all
  using (company_id = public.get_company_id())
  with check (company_id = public.get_company_id());

create policy "Users manage own messages"
  on coach_messages for all
  using (company_id = public.get_company_id())
  with check (company_id = public.get_company_id());

create policy "Users manage own data connections"
  on data_connections for all
  using (company_id = public.get_company_id())
  with check (company_id = public.get_company_id());

create policy "Users view own email log"
  on email_log for select
  using (company_id = public.get_company_id());

-- Shared read-only tables
create policy "Authenticated users read knowledge docs"
  on knowledge_documents for select
  to authenticated
  using (true);

create policy "Authenticated users read benchmarks"
  on market_benchmarks for select
  to authenticated
  using (true);

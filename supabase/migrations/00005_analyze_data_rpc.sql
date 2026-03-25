-- RPC functions for the analyze-data Edge Function
-- These run all metric aggregation server-side in SQL for performance.

-- ============================================
-- Get eligible companies for batch analysis
-- ============================================

create or replace function get_eligible_companies(min_jobs int default 30)
returns table (id uuid)
language sql stable
security definer
set search_path = public
as $$
  select cp.id
  from company_profiles cp
  where cp.onboarding_complete = true
    and (select count(*) from jobs j where j.company_id = cp.id) >= min_jobs;
$$;

-- ============================================
-- Compute all metrics for a single company
-- Returns a single JSON object with all CompanyMetrics fields
-- ============================================

create or replace function compute_company_metrics(p_company_id uuid)
returns jsonb
language plpgsql stable
security definer
set search_path = public
as $$
declare
  result jsonb;
  v_now date := current_date;
  v_30d date := current_date - interval '30 days';
  v_90d date := current_date - interval '90 days';
  v_ly_start date := (current_date - interval '1 year') - interval '30 days';
  v_ly_end date := current_date - interval '1 year';
  v_revenue_30d numeric;
  v_revenue_90d numeric;
  v_revenue_ly numeric;
  v_avg_ticket numeric;
  v_jobs_30d int;
  v_jobs_90d int;
  v_avg_hours numeric;
  v_avg_ticket_by_cat jsonb;
  v_jobs_by_month jsonb;
  v_tech_metrics jsonb;
  v_lead_metrics jsonb;
  v_new_ratio numeric;
  v_avg_ltv numeric;
  v_member_count int;
  v_member_rev numeric;
  v_member_avg numeric;
  v_non_member_avg numeric;
  v_slow_months jsonb;
begin
  -- Revenue & job counts
  select
    coalesce(sum(total_revenue) filter (where job_date >= v_30d), 0),
    coalesce(sum(total_revenue) filter (where job_date >= v_90d), 0),
    sum(total_revenue) filter (where job_date >= v_ly_start and job_date <= v_ly_end),
    coalesce(avg(total_revenue), 0),
    coalesce(count(*) filter (where job_date >= v_30d), 0)::int,
    coalesce(count(*) filter (where job_date >= v_90d), 0)::int,
    coalesce(avg(hours_on_job), 0)
  into v_revenue_30d, v_revenue_90d, v_revenue_ly, v_avg_ticket,
       v_jobs_30d, v_jobs_90d, v_avg_hours
  from jobs
  where company_id = p_company_id;

  -- Avg ticket by service category
  select coalesce(jsonb_object_agg(cat, avg_t), '{}'::jsonb)
  into v_avg_ticket_by_cat
  from (
    select
      coalesce(service_category, 'Uncategorized') as cat,
      round(avg(total_revenue)::numeric, 2) as avg_t
    from jobs
    where company_id = p_company_id
    group by service_category
  ) sub;

  -- Jobs by month (last 24 months)
  select coalesce(jsonb_agg(row_to_json(sub)::jsonb order by sub.month), '[]'::jsonb)
  into v_jobs_by_month
  from (
    select
      to_char(job_date, 'YYYY-MM') as month,
      count(*)::int as count,
      round(coalesce(sum(total_revenue), 0)::numeric, 2) as revenue
    from jobs
    where company_id = p_company_id
      and job_date >= (current_date - interval '24 months')
    group by to_char(job_date, 'YYYY-MM')
    order by month
  ) sub;

  -- Technician metrics (last 90 days)
  select coalesce(jsonb_agg(row_to_json(sub)::jsonb), '[]'::jsonb)
  into v_tech_metrics
  from (
    select
      coalesce(technician_name, 'Unassigned') as tech,
      count(*)::int as job_count,
      round(coalesce(sum(total_revenue), 0)::numeric, 2) as revenue
    from jobs
    where company_id = p_company_id
      and job_date >= v_90d
    group by technician_name
  ) sub;

  -- Lead source metrics (last 90 days)
  select coalesce(jsonb_agg(row_to_json(sub)::jsonb), '[]'::jsonb)
  into v_lead_metrics
  from (
    select
      coalesce(lead_source, 'unknown') as source,
      count(*)::int as job_count,
      round(coalesce(sum(total_revenue), 0)::numeric, 2) as revenue
    from jobs
    where company_id = p_company_id
      and job_date >= v_90d
    group by lead_source
  ) sub;

  -- New vs repeat ratio (last 90 days)
  select coalesce(
    count(*) filter (where c.job_count = 1)::numeric /
      nullif(count(*)::numeric, 0),
    0
  )
  into v_new_ratio
  from jobs j
  left join customers c on c.id::text = j.customer_id and c.company_id = j.company_id
  where j.company_id = p_company_id
    and j.job_date >= v_90d;

  -- Average customer lifetime value
  select coalesce(avg(lifetime_value), 0)
  into v_avg_ltv
  from customers
  where company_id = p_company_id
    and job_count > 0;

  -- Membership metrics
  select
    coalesce(count(*) filter (where membership_job = true), 0)::int,
    coalesce(sum(total_revenue) filter (where membership_job = true), 0),
    coalesce(avg(total_revenue) filter (where membership_job = true), 0),
    coalesce(avg(total_revenue) filter (where membership_job = false), 0)
  into v_member_count, v_member_rev, v_member_avg, v_non_member_avg
  from jobs
  where company_id = p_company_id;

  -- Slowest 3 months (historical)
  select coalesce(jsonb_agg(row_to_json(sub)::jsonb), '[]'::jsonb)
  into v_slow_months
  from (
    select
      trim(to_char(job_date, 'Month')) as month_name,
      extract(month from job_date)::int as month_num,
      count(*)::int as job_count
    from jobs
    where company_id = p_company_id
    group by month_name, month_num
    order by job_count asc
    limit 3
  ) sub;

  -- Assemble the result
  result := jsonb_build_object(
    'revenue_last_30d', round(v_revenue_30d::numeric, 2),
    'revenue_last_90d', round(v_revenue_90d::numeric, 2),
    'revenue_same_period_last_year', case when v_revenue_ly is not null then round(v_revenue_ly::numeric, 2) else null end,
    'avg_ticket', round(v_avg_ticket::numeric, 2),
    'avg_ticket_by_service_category', v_avg_ticket_by_cat,
    'jobs_last_30d', v_jobs_30d,
    'jobs_last_90d', v_jobs_90d,
    'jobs_by_month', v_jobs_by_month,
    'tech_metrics', v_tech_metrics,
    'lead_metrics', v_lead_metrics,
    'avg_hours_per_job', round(v_avg_hours::numeric, 2),
    'new_vs_repeat_ratio', round(v_new_ratio::numeric, 4),
    'avg_customer_lifetime_value', round(v_avg_ltv::numeric, 2),
    'member_job_count', v_member_count,
    'member_revenue', round(v_member_rev::numeric, 2),
    'member_avg_ticket_vs_non_member', case when v_non_member_avg > 0 then round((v_member_avg / v_non_member_avg)::numeric, 4) else 0 end,
    'slow_months', v_slow_months
  );

  return result;
end;
$$;

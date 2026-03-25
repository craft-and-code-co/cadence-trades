-- Add unique constraint on (company_id, external_id) for deduplication on re-import
-- Only applies to rows that have an external_id (partial index)
create unique index if not exists idx_jobs_company_external_id
  on jobs (company_id, external_id)
  where external_id is not null;

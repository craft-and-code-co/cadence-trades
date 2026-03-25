-- Add unique constraint on (company_id, platform) for upsert support
create unique index if not exists idx_data_connections_company_platform
  on data_connections (company_id, platform);

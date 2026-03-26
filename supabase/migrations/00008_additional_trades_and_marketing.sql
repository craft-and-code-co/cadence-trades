-- Add additional_trades array column
alter table company_profiles
  add column if not exists additional_trades text[] default '{}';

-- Change runs_paid_ads from text to text[] for multi-select marketing channels
alter table company_profiles
  alter column runs_paid_ads type text[] using
    case
      when runs_paid_ads is null then '{}'::text[]
      when runs_paid_ads = 'neither' then '{}'::text[]
      else array[runs_paid_ads]
    end,
  alter column runs_paid_ads set default '{}';

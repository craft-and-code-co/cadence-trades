-- Change tracks_marketing from boolean to text to preserve user's free-text answer
alter table company_profiles
  alter column tracks_marketing type text
  using case when tracks_marketing then 'yes' else null end;

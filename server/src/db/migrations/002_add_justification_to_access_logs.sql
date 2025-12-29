-- 002_add_justification_to_access_logs.sql
-- Add justification field to access_logs for break-glass events

alter table public.access_logs
  add column if not exists justification text;

-- Add comment to explain the field
comment on column public.access_logs.justification is 
  'Required justification for BREAK_GLASS access method. NULL for QR_SCAN method.';


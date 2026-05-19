-- Adds a target_completion_date column to the properties table so it can be
-- set/edited per property (instead of relying on a checklist item).
-- Run this once in the Supabase SQL editor.

alter table public.properties
  add column if not exists target_completion_date date;

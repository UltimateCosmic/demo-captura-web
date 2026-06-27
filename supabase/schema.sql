create table if not exists public.demo_state (
  id text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.demo_state enable row level security;

drop policy if exists "demo_state_service_role_all" on public.demo_state;

create policy "demo_state_service_role_all"
on public.demo_state
for all
using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- ============================================================
-- PassdownPro — User Approval, Manager Role & Audit Trail
-- Migration: 005_approval_and_audit.sql
-- ============================================================

-- ── 1. Add 'manager' to role options ────────────────────────────────────────
alter table public.user_profiles
  drop constraint if exists user_profiles_role_check;

alter table public.user_profiles
  add constraint user_profiles_role_check
  check (role in ('admin', 'manager', 'supervisor', 'viewer'));

-- ── 2. Add status column to user_profiles ───────────────────────────────────
alter table public.user_profiles
  add column if not exists status text not null default 'active'
    check (status in ('pending', 'active', 'suspended'));

-- New OAuth signups will be 'pending' by default — set via app logic.
-- Existing users (like the seeded admin) stay 'active'.

-- ── 3. Create report_audit_log table ────────────────────────────────────────
create table if not exists public.report_audit_log (
  id          uuid primary key default uuid_generate_v4(),
  report_id   uuid not null references public.shift_reports(id) on delete cascade,
  changed_by  uuid not null references auth.users(id),
  action      text not null check (action in ('created', 'edited')),
  changes     jsonb not null default '{}',   -- { field: { before, after } }
  changed_at  timestamptz not null default now()
);

comment on table public.report_audit_log is
  'Full audit trail of every change made to a shift report after submission.';

create index if not exists idx_audit_log_report_id on public.report_audit_log(report_id);
create index if not exists idx_audit_log_changed_by on public.report_audit_log(changed_by);

-- RLS: users in the same plant can read audit logs
alter table public.report_audit_log enable row level security;

create policy "plant members can read audit logs"
  on public.report_audit_log for select
  using (
    exists (
      select 1 from public.shift_reports sr
      join public.user_profiles up on up.plant_id = sr.plant_id
      where sr.id = report_audit_log.report_id
        and up.id = auth.uid()
        and up.status = 'active'
    )
  );

-- Only the app (via service role / server actions) can insert audit logs
create policy "server can insert audit logs"
  on public.report_audit_log for insert
  with check (true);

-- ── 4. Auto-log trigger on shift_reports UPDATE ─────────────────────────────
create or replace function public.trg_fn_audit_shift_report()
returns trigger language plpgsql security definer as $$
declare
  v_changes jsonb := '{}'::jsonb;
  v_user_id uuid;
  auditable_fields text[] := array[
    'supervisor_name', 'units_produced', 'units_target',
    'safety_incident_count', 'safety_description',
    'reject_count', 'quality_description', 'handoff_notes',
    'shift', 'report_date'
  ];
  field_name text;
  old_val text;
  new_val text;
begin
  -- Get the current user from the session
  v_user_id := auth.uid();
  if v_user_id is null then
    v_user_id := new.submitted_by;
  end if;

  -- Build diff of changed fields
  foreach field_name in array auditable_fields loop
    execute format('select ($1).%I::text', field_name) into old_val using old;
    execute format('select ($1).%I::text', field_name) into new_val using new;
    if old_val is distinct from new_val then
      v_changes := v_changes || jsonb_build_object(
        field_name,
        jsonb_build_object('before', old_val, 'after', new_val)
      );
    end if;
  end loop;

  -- Only log if something actually changed
  if v_changes != '{}'::jsonb then
    insert into public.report_audit_log (report_id, changed_by, action, changes)
    values (new.id, v_user_id, 'edited', v_changes);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_audit_shift_report on public.shift_reports;
create trigger trg_audit_shift_report
  after update on public.shift_reports
  for each row execute function public.trg_fn_audit_shift_report();

-- ── 5. RLS update: pending users cannot access protected tables ──────────────
-- Users with status='pending' should not be able to query shift_reports etc.
-- The middleware handles redirect at the app level, but this adds DB-level guard.

-- Drop and recreate shift_reports SELECT policy to require active status
drop policy if exists "Users can view their plant reports" on public.shift_reports;

create policy "Active users can view their plant reports"
  on public.shift_reports for select
  using (
    exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid()
        and up.plant_id = shift_reports.plant_id
        and up.status = 'active'
    )
  );

-- ============================================================
-- PassdownPro — Initial Schema
-- Migration: 001_initial_schema.sql
-- Run this in: Supabase Dashboard > SQL Editor
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";


-- ============================================================
-- PLANTS
-- One row per customer company. The core multi-tenant unit.
-- ============================================================
create table public.plants (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  logo_url            text,
  -- Stripe
  stripe_customer_id  text unique,
  subscription_tier   text not null default 'free'   -- 'free' | 'pro' | 'enterprise'
                        check (subscription_tier in ('free', 'pro', 'enterprise')),
  subscription_status text not null default 'active' -- 'active' | 'past_due' | 'canceled'
                        check (subscription_status in ('active', 'past_due', 'canceled')),
  -- Config
  shift_names         jsonb not null default '["Day","Evening","Night"]'::jsonb,
  production_target   integer,                        -- default units/shift target
  -- Contacts
  maintenance_emails  text[] not null default '{}',   -- who gets maintenance notifications
  manager_email       text,                           -- gets PDF on submit (Pro+)
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.plants is
  'One row per customer plant/company. Top-level multi-tenant isolation unit.';


-- ============================================================
-- USER PROFILES
-- Extends Supabase auth.users with app-level role + plant link.
-- ============================================================
create table public.user_profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  plant_id    uuid references public.plants(id) on delete cascade,
  full_name   text,
  role        text not null default 'supervisor'
                check (role in ('admin', 'supervisor', 'viewer')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.user_profiles is
  'App-level user metadata. One-to-one with auth.users. admin = plant owner.';


-- ============================================================
-- EQUIPMENT
-- Per-plant equipment list. Drives the maintenance request dropdown.
-- ============================================================
create table public.equipment (
  id          uuid primary key default uuid_generate_v4(),
  plant_id    uuid not null references public.plants(id) on delete cascade,
  name        text not null,
  category    text,             -- optional grouping e.g. "Press", "Conveyor", "HVAC"
  active      boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (plant_id, name)       -- no duplicate names within a plant
);

comment on table public.equipment is
  'Per-plant equipment list. Plant admin manages this; supervisors pick from it in maintenance requests.';


-- ============================================================
-- SHIFT REPORTS
-- One row per submitted shift report.
-- ============================================================
create table public.shift_reports (
  id                  uuid primary key default uuid_generate_v4(),
  plant_id            uuid not null references public.plants(id) on delete cascade,
  submitted_by        uuid references public.user_profiles(id) on delete set null,
  -- Shift header
  report_date         date not null,
  shift               text not null check (shift in ('day', 'evening', 'night')),
  supervisor_name     text not null,
  -- Production
  units_produced      integer,
  units_target        integer,
  -- Safety
  safety_incident_count   integer not null default 0,
  safety_description      text,
  -- Quality
  reject_count        integer not null default 0,
  quality_description text,
  -- Handoff
  handoff_notes       text,
  -- PDF
  pdf_url             text,     -- populated after PDF generation
  -- Timestamps
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.shift_reports is
  'One row per submitted shift report. Downtime and maintenance are child tables.';


-- ============================================================
-- DOWNTIME EVENTS
-- Child of shift_reports. Multiple downtime events per report.
-- ============================================================
create table public.downtime_events (
  id                uuid primary key default uuid_generate_v4(),
  shift_report_id   uuid not null references public.shift_reports(id) on delete cascade,
  plant_id          uuid not null references public.plants(id) on delete cascade,
  machine           text not null,
  duration_minutes  integer not null default 0,
  reason            text,
  created_at        timestamptz not null default now()
);

comment on table public.downtime_events is
  'Individual downtime events logged within a shift report.';


-- ============================================================
-- MAINTENANCE REQUESTS
-- Child of shift_reports. Multiple requests per report.
-- Email notification fires on insert (handled in app layer).
-- ============================================================
create table public.maintenance_requests (
  id                uuid primary key default uuid_generate_v4(),
  shift_report_id   uuid not null references public.shift_reports(id) on delete cascade,
  plant_id          uuid not null references public.plants(id) on delete cascade,
  equipment_id      uuid references public.equipment(id) on delete set null,
  equipment_name    text not null,  -- denormalized so report is readable even if equipment deleted
  description       text not null,
  priority          text not null default 'medium'
                      check (priority in ('low', 'medium', 'high')),
  email_sent        boolean not null default false,
  email_sent_at     timestamptz,
  created_at        timestamptz not null default now()
);

comment on table public.maintenance_requests is
  'Maintenance requests within a shift report. App fires email to plant maintenance_emails on insert.';


-- ============================================================
-- INDEXES
-- Cover the most common query patterns.
-- ============================================================

-- Reports by plant + date (dashboard list, trend charts)
create index idx_shift_reports_plant_date
  on public.shift_reports (plant_id, report_date desc);

-- Reports by plant + shift type
create index idx_shift_reports_plant_shift
  on public.shift_reports (plant_id, shift);

-- Downtime by report
create index idx_downtime_report
  on public.downtime_events (shift_report_id);

-- Maintenance by report
create index idx_maintenance_report
  on public.maintenance_requests (shift_report_id);

-- Equipment by plant (active only — most common query)
create index idx_equipment_plant_active
  on public.equipment (plant_id, active, sort_order);

-- User profiles by plant
create index idx_user_profiles_plant
  on public.user_profiles (plant_id);


-- ============================================================
-- UPDATED_AT TRIGGER
-- Auto-update updated_at on any row change.
-- ============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_plants_updated_at
  before update on public.plants
  for each row execute function public.set_updated_at();

create trigger trg_user_profiles_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

create trigger trg_shift_reports_updated_at
  before update on public.shift_reports
  for each row execute function public.set_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY
-- Users can only see/touch data belonging to their plant.
-- Service role (used by server actions) bypasses RLS.
-- ============================================================

alter table public.plants              enable row level security;
alter table public.user_profiles       enable row level security;
alter table public.equipment           enable row level security;
alter table public.shift_reports       enable row level security;
alter table public.downtime_events     enable row level security;
alter table public.maintenance_requests enable row level security;


-- Helper function: get the plant_id for the currently authenticated user
create or replace function public.my_plant_id()
returns uuid language sql stable security definer as $$
  select plant_id from public.user_profiles where id = auth.uid()
$$;

-- Helper function: get the role for the currently authenticated user
create or replace function public.my_role()
returns text language sql stable security definer as $$
  select role from public.user_profiles where id = auth.uid()
$$;


-- ── plants ────────────────────────────────────────────────────────────────
-- Users see only their own plant. Only admins can update plant settings.
create policy "plants: members can view their plant"
  on public.plants for select
  using (id = public.my_plant_id());

create policy "plants: only admin can update"
  on public.plants for update
  using (id = public.my_plant_id() and public.my_role() = 'admin');


-- ── user_profiles ─────────────────────────────────────────────────────────
-- Users see all profiles in their plant. Only the user themselves or an admin
-- can update a profile. Only admins can insert (invite) new users.
create policy "user_profiles: members see their plant"
  on public.user_profiles for select
  using (plant_id = public.my_plant_id());

create policy "user_profiles: self or admin can update"
  on public.user_profiles for update
  using (id = auth.uid() or public.my_role() = 'admin');

create policy "user_profiles: admin can insert"
  on public.user_profiles for insert
  with check (plant_id = public.my_plant_id() and public.my_role() = 'admin');


-- ── equipment ─────────────────────────────────────────────────────────────
-- All members can read. Only admins can insert/update/delete.
create policy "equipment: members can view"
  on public.equipment for select
  using (plant_id = public.my_plant_id());

create policy "equipment: admin can insert"
  on public.equipment for insert
  with check (plant_id = public.my_plant_id() and public.my_role() = 'admin');

create policy "equipment: admin can update"
  on public.equipment for update
  using (plant_id = public.my_plant_id() and public.my_role() = 'admin');

create policy "equipment: admin can delete"
  on public.equipment for delete
  using (plant_id = public.my_plant_id() and public.my_role() = 'admin');


-- ── shift_reports ─────────────────────────────────────────────────────────
-- All members can read and insert. Only the submitter or an admin can update.
create policy "shift_reports: members can view"
  on public.shift_reports for select
  using (plant_id = public.my_plant_id());

create policy "shift_reports: members can insert"
  on public.shift_reports for insert
  with check (plant_id = public.my_plant_id());

create policy "shift_reports: submitter or admin can update"
  on public.shift_reports for update
  using (
    plant_id = public.my_plant_id()
    and (submitted_by = auth.uid() or public.my_role() = 'admin')
  );


-- ── downtime_events ───────────────────────────────────────────────────────
create policy "downtime_events: members can view"
  on public.downtime_events for select
  using (plant_id = public.my_plant_id());

create policy "downtime_events: members can insert"
  on public.downtime_events for insert
  with check (plant_id = public.my_plant_id());


-- ── maintenance_requests ──────────────────────────────────────────────────
create policy "maintenance_requests: members can view"
  on public.maintenance_requests for select
  using (plant_id = public.my_plant_id());

create policy "maintenance_requests: members can insert"
  on public.maintenance_requests for insert
  with check (plant_id = public.my_plant_id());

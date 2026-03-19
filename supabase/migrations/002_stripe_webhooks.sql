-- ============================================================
-- PassdownPro — Stripe Webhook State
-- Migration: 002_stripe_webhooks.sql
--
-- Tracks Stripe subscription events so we can gate features
-- by tier. The app's Stripe webhook handler writes here via
-- the service role (bypasses RLS).
-- ============================================================

-- ── Stripe events log ─────────────────────────────────────
-- Idempotency log — lets us safely replay webhooks without
-- double-processing. Stripe can re-deliver events on failure.
create table public.stripe_events (
  id            text primary key,       -- Stripe event ID (evt_xxx) — natural PK for idempotency
  type          text not null,          -- e.g. 'customer.subscription.updated'
  payload       jsonb not null,
  processed_at  timestamptz not null default now()
);

comment on table public.stripe_events is
  'Idempotency log of processed Stripe webhook events. Service role only.';

-- No RLS on stripe_events — only written by the server via service role.
-- Supabase service role bypasses RLS automatically.


-- ============================================================
-- TIER ENFORCEMENT VIEWS
-- Handy views the app can query to check feature gates,
-- rather than scattering tier checks throughout the code.
-- ============================================================

-- Returns the feature limits for the current user's plant
create or replace view public.my_plant_limits as
select
  p.id                                                  as plant_id,
  p.subscription_tier,
  p.subscription_status,
  -- User limits
  case p.subscription_tier
    when 'free'       then 3
    when 'pro'        then null   -- null = unlimited
    when 'enterprise' then null
  end                                                   as max_users,
  -- Report history (days)
  case p.subscription_tier
    when 'free'       then 30
    when 'pro'        then 365
    when 'enterprise' then null   -- null = unlimited
  end                                                   as history_days,
  -- Feature flags
  p.subscription_tier in ('pro', 'enterprise')          as can_export_csv,
  p.subscription_tier in ('pro', 'enterprise')          as can_email_pdf,
  p.subscription_tier = 'enterprise'                    as can_multi_plant,
  p.subscription_tier = 'enterprise'                    as can_custom_branding,
  p.subscription_tier = 'enterprise'                    as can_api_access
from public.plants p
where p.id = public.my_plant_id();

comment on view public.my_plant_limits is
  'Feature gates for the current user''s plant based on subscription tier.';

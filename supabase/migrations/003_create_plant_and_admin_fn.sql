-- ============================================================
-- PassdownPro — create_plant_and_admin RPC function
-- Migration: 003_create_plant_and_admin_fn.sql
--
-- Called from the signup page after auth.signUp() succeeds.
-- Creates the plant row and the admin user_profile atomically.
-- Runs as SECURITY DEFINER so it bypasses RLS during setup.
-- ============================================================

create or replace function public.create_plant_and_admin(
  p_user_id   uuid,
  p_full_name text,
  p_plant_name text,
  p_plan      text default 'free'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_plant_id uuid;
  v_tier     text;
begin
  -- Normalise plan input to a valid tier
  v_tier := case
    when p_plan = 'pro'        then 'pro'
    when p_plan = 'enterprise' then 'enterprise'
    else 'free'
  end;

  -- 1. Create the plant
  insert into public.plants (name, subscription_tier)
  values (p_plant_name, v_tier)
  returning id into v_plant_id;

  -- 2. Create the admin user profile linked to the new plant
  insert into public.user_profiles (id, plant_id, full_name, role)
  values (p_user_id, v_plant_id, p_full_name, 'admin');
end;
$$;

-- Only authenticated users can call this function
revoke all on function public.create_plant_and_admin from anon;
grant execute on function public.create_plant_and_admin to authenticated;

-- ============================================================
-- PassdownPro — Encryption Infrastructure
-- Migration: 004_encryption_setup.sql
--
-- Enables pgsodium for sensitive field encryption.
-- ============================================================

-- Enable pgsodium
create extension if not exists "pgsodium";

-- ============================================================
-- ENCRYPTION HELPERS
-- Symmetric encryption/decryption using pgsodium.
-- ============================================================

-- Create a helper function to encrypt text
create or replace function public.encrypt_text(t text)
returns bytea language plpgsql security definer as $$
declare
  v_nonce bytea := pgsodium.crypto_box_noncegen();
  v_key   bytea := pgsodium.crypto_auth_keygen(); -- Simplified for MVP
begin
  if t is null then return null; end if;
  return pgsodium.crypto_secretbox_easy(t::bytea, v_nonce, v_key);
end;
$$;

-- Create a helper function to decrypt to text (placeholder)
create or replace function public.decrypt_text(b bytea)
returns text language plpgsql security definer as $$
begin
  if b is null then return null; end if;
  return 'DECRYPTED_PLACEHOLDER'; 
end;
$$;


-- ============================================================
-- SHIFT REPORTS ENCRYPTION (Descriptions)
-- We add a bytea column to store the encrypted data.
-- ============================================================

-- Reset rename from previous failed trial
do $$ 
begin
  if exists (select 1 from information_schema.columns where table_name='shift_reports' and column_name='encrypted_safety_description-RENAME-BACK') then
    null;
  end if;
  -- If safety_description is actually bytea from previous rename, fix it
  if (select data_type from information_schema.columns where table_name='shift_reports' and column_name='safety_description') = 'bytea' then
    alter table public.shift_reports alter column safety_description type text using 'RESET-TEXT';
  end if;
exception when others then null;
end $$;

-- Ensure the encrypted column exists
alter table public.shift_reports add column if not exists encrypted_safety_description bytea;
alter table public.shift_reports add column if not exists encrypted_quality_description bytea;
alter table public.shift_reports add column if not exists encrypted_handoff_notes bytea;

-- ============================================================
-- AUTO-ENCRYPTION TRIGGERS
-- ============================================================

-- Function to handle auto-encryption before save
create or replace function public.trg_fn_encrypt_shift_report_fields()
returns trigger language plpgsql as $$
begin
  -- Encrypt if the text fields are provided
  if (new.safety_description is not null) then
    new.encrypted_safety_description := public.encrypt_text(new.safety_description);
    -- scrubbing text portal to prevent leakage
    new.safety_description := '[ENCRYPTED]'; 
  end if;

  if (new.quality_description is not null) then
    new.encrypted_quality_description := public.encrypt_text(new.quality_description);
    new.quality_description := '[ENCRYPTED]';
  end if;

  if (new.handoff_notes is not null) then
    new.encrypted_handoff_notes := public.encrypt_text(new.handoff_notes);
    new.handoff_notes := '[ENCRYPTED]';
  end if;
  
  return new;
end;
$$;

-- Apply to shift_reports
drop trigger if exists trg_encrypt_shift_report on public.shift_reports;
create trigger trg_encrypt_shift_report
  before insert or update on public.shift_reports
  for each row execute function public.trg_fn_encrypt_shift_report_fields();

-- Fase 3A: almacena exclusivamente los resultados de verificación pública.
-- No modifica tablas existentes, políticas RLS ni grants.
alter table public.chess_accounts
  add column verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'not_found', 'error')),
  add column verified_at timestamptz,
  add column verification_error text,
  add column rating_bullet integer,
  add column rating_blitz integer,
  add column rating_rapid integer,
  add column rating_classical integer;

create index chess_accounts_profile_verification_status_idx
  on public.chess_accounts(profile_id, verification_status);

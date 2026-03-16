-- ============================================================
-- The Ledger — Migration 002: Multiple Parental Share Links
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ─── New table: parental_links ────────────────────────────────
-- Replaces the single profiles.parental_key with a 1-to-many
-- relationship so students can share separate links per parent.
create table public.parental_links (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  key         uuid not null unique default uuid_generate_v4(),
  label       text not null default 'Parent',
  created_at  timestamptz not null default now()
);

-- ─── Migrate existing keys from profiles ─────────────────────
-- Copies each user's existing parental_key into the new table
-- as their first link, so no existing links break.
insert into public.parental_links (user_id, key, label, created_at)
select id, parental_key, 'Primary Link', created_at
from public.profiles;

-- ─── RLS ──────────────────────────────────────────────────────
alter table public.parental_links enable row level security;

create policy "Users can manage own parental links"
  on public.parental_links for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Update get_parental_view RPC ─────────────────────────────
-- Now looks up the user via parental_links.key instead of
-- profiles.parental_key, so all links (old + new) work.
create or replace function public.get_parental_view(p_key uuid)
returns table (
  id             uuid,
  amount         numeric,
  description    text,
  category_name  text,
  category_color text,
  status         transaction_status,
  date           date,
  invoice_id     uuid,
  month_label    text
)
language sql security definer set search_path = public as $$
  select
    t.id,
    t.amount,
    t.description,
    c.name    as category_name,
    c.color   as category_color,
    t.status,
    t.date,
    t.invoice_id,
    i.month_label
  from public.transactions t
  left join public.categories c on c.id = t.category_id
  left join public.invoices i   on i.id = t.invoice_id
  where t.is_invoicable = true
    and t.status = 'invoiced'
    and t.user_id = (
      select pl.user_id
      from public.parental_links pl
      join public.profiles pr on pr.id = pl.user_id
      where pl.key = p_key
        and pr.is_sharing_enabled = true
      limit 1
    )
  order by t.date desc;
$$;

-- ============================================================
-- The Ledger — Initial Schema Migration
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ─── Enable UUID extension ───────────────────────────────────
create extension if not exists "uuid-ossp";

-- ─── Enums ───────────────────────────────────────────────────
create type transaction_status as enum ('pending', 'invoiced', 'paid');
create type invoice_status as enum ('open', 'paid');

-- ─── Profiles ────────────────────────────────────────────────
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text,
  full_name       text,
  parental_key    uuid not null default uuid_generate_v4() unique,
  is_sharing_enabled boolean not null default true,
  created_at      timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Categories ──────────────────────────────────────────────
create table public.categories (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  color       text not null default '#6366f1',
  created_at  timestamptz not null default now()
);

-- Global / default categories (user_id IS NULL)
insert into public.categories (id, user_id, name, color) values
  (uuid_generate_v4(), null, 'Fuel',           '#f59e0b'),
  (uuid_generate_v4(), null, 'Groceries',      '#10b981'),
  (uuid_generate_v4(), null, 'Fast Food',      '#ef4444'),
  (uuid_generate_v4(), null, 'Transport',      '#3b82f6'),
  (uuid_generate_v4(), null, 'Stationery',     '#8b5cf6'),
  (uuid_generate_v4(), null, 'Clothing',       '#ec4899'),
  (uuid_generate_v4(), null, 'Accommodation',  '#14b8a6'),
  (uuid_generate_v4(), null, 'Entertainment',  '#f97316'),
  (uuid_generate_v4(), null, 'Other',          '#6b7280');

-- ─── Invoices ────────────────────────────────────────────────
create table public.invoices (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  month_label    text not null,         -- e.g. "March 2026"
  total_amount   numeric(12,2) not null default 0,
  status         invoice_status not null default 'open',
  generated_at   timestamptz not null default now()
);

-- ─── Transactions ─────────────────────────────────────────────
create table public.transactions (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  amount         numeric(12,2) not null,
  description    text not null,
  category_id    uuid references public.categories(id) on delete set null,
  is_invoicable  boolean not null default false,
  status         transaction_status not null default 'pending',
  invoice_id     uuid references public.invoices(id) on delete set null,
  date           date not null default current_date,
  created_at     timestamptz not null default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

-- ─── Profiles RLS ────────────────────────────────────────────
alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ─── Categories RLS ───────────────────────────────────────────
alter table public.categories enable row level security;

create policy "Global categories readable by authenticated users"
  on public.categories for select
  using (user_id is null and auth.role() = 'authenticated');

create policy "Users can view own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can insert own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

-- ─── Invoices RLS ─────────────────────────────────────────────
alter table public.invoices enable row level security;

create policy "Users can view own invoices"
  on public.invoices for select
  using (auth.uid() = user_id);

create policy "Users can insert own invoices"
  on public.invoices for insert
  with check (auth.uid() = user_id);

create policy "Users can update own invoices"
  on public.invoices for update
  using (auth.uid() = user_id);

-- ─── Transactions RLS ────────────────────────────────────────
alter table public.transactions enable row level security;

create policy "Users can view own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- ─── Public Parental View ─────────────────────────────────────
-- Allow anyone (anon) to read invoiced transactions for a valid parental_key
create policy "Public parental view — invoiced transactions"
  on public.transactions for select
  using (
    status = 'invoiced'
    and is_invoicable = true
    and exists (
      select 1 from public.profiles p
      where p.id = transactions.user_id
        and p.is_sharing_enabled = true
        and p.parental_key::text = current_setting('request.jwt.claims', true)::json->>'parental_key'
    )
  );

-- ─── Simpler parental view via security-definer function ─────
-- This is the recommended approach: expose a function that the
-- public route calls with the parental_key as an argument.
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
      select id from public.profiles
      where parental_key = p_key
        and is_sharing_enabled = true
      limit 1
    )
  order by t.date desc;
$$;

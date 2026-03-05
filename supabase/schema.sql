-- FinanzasPro — Supabase Schema
-- Run this in the Supabase SQL editor

-- ─── expenses ─────────────────────────────────────────────────────────────────
create table if not exists expenses (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,
  category    text not null,
  description text not null,
  amount      numeric(12, 2) not null check (amount >= 0),
  recurring   boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table expenses enable row level security;

create policy "expenses: select own" on expenses
  for select using (auth.uid() = user_id);

create policy "expenses: insert own" on expenses
  for insert with check (auth.uid() = user_id);

create policy "expenses: update own" on expenses
  for update using (auth.uid() = user_id);

create policy "expenses: delete own" on expenses
  for delete using (auth.uid() = user_id);

create index if not exists expenses_user_date_idx on expenses (user_id, date);

-- ─── budgets ──────────────────────────────────────────────────────────────────
create table if not exists budgets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  category    text not null,
  amount      numeric(12, 2) not null check (amount >= 0),
  month       text not null,            -- YYYY-MM
  created_at  timestamptz not null default now(),
  unique (user_id, category, month)
);

alter table budgets enable row level security;

create policy "budgets: select own" on budgets
  for select using (auth.uid() = user_id);

create policy "budgets: insert own" on budgets
  for insert with check (auth.uid() = user_id);

create policy "budgets: update own" on budgets
  for update using (auth.uid() = user_id);

create policy "budgets: delete own" on budgets
  for delete using (auth.uid() = user_id);

create index if not exists budgets_user_month_idx on budgets (user_id, month);

-- ─── recurring ────────────────────────────────────────────────────────────────
create table if not exists recurring (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  description  text not null,
  category     text not null,
  amount       numeric(12, 2) not null check (amount >= 0),
  day_of_month smallint not null check (day_of_month between 1 and 31),
  created_at   timestamptz not null default now()
);

alter table recurring enable row level security;

create policy "recurring: select own" on recurring
  for select using (auth.uid() = user_id);

create policy "recurring: insert own" on recurring
  for insert with check (auth.uid() = user_id);

create policy "recurring: update own" on recurring
  for update using (auth.uid() = user_id);

create policy "recurring: delete own" on recurring
  for delete using (auth.uid() = user_id);

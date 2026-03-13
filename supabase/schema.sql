-- ─── recurring ────────────────────────────────────────────────────────────────
create table if not exists recurring (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  description      text not null,
  category         text not null,
  amount           numeric(12, 2) not null check (amount >= 0),
  day_of_month     smallint not null check (day_of_month between 1 and 31),
  is_shared        boolean         not null default false,
  shared_ratio     numeric(5,4)    not null default 0.5,
  total_amount     numeric(12, 2),
  update_type      text            not null default 'none' check (update_type in ('none', 'ipc')),
  update_frequency smallint,
  last_updated     date,
  next_update_date date,
  created_at       timestamptz not null default now()
);

-- ─── debts ────────────────────────────────────────────────────────────────────
create table if not exists debts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users(id) on delete cascade,
  name               text not null,
  color              text not null default '#3b82f6',
  debt_type          text not null default 'installments' check (debt_type in ('installments', 'open')),
  total_amount       numeric(12,2) not null check (total_amount > 0),
  installments       integer,
  installment_amount numeric(12,2),
  paid_amount        numeric(12,2) not null default 0 check (paid_amount >= 0),
  status             text not null default 'active' check (status in ('active', 'paid')),
  created_at         timestamptz not null default now()
);

alter table debts enable row level security;
create policy "debts: select own" on debts for select using (auth.uid() = user_id);
create policy "debts: insert own" on debts for insert with check (auth.uid() = user_id);
create policy "debts: update own" on debts for update using (auth.uid() = user_id);
create policy "debts: delete own" on debts for delete using (auth.uid() = user_id);

-- ─── categories (custom, user-created) ────────────────────────────────────────
create table if not exists categories (
  id         text not null,
  user_id    uuid not null references auth.users(id) on delete cascade,
  label      text not null,
  icon       text not null,
  color      text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table categories enable row level security;

create policy "categories: select own" on categories for select using (auth.uid() = user_id);
create policy "categories: insert own" on categories for insert with check (auth.uid() = user_id);
create policy "categories: update own" on categories for update using (auth.uid() = user_id);
create policy "categories: delete own" on categories for delete using (auth.uid() = user_id);

-- ─── debts: add color + debt_type columns (migration for existing DBs) ──────────
alter table debts
  add column if not exists color     text not null default '#3b82f6',
  add column if not exists debt_type text not null default 'installments';
-- Opcional: eliminar columnas start_date / end_date si las tenés de la versión anterior
-- alter table debts drop column if exists start_date;
-- alter table debts drop column if exists end_date;

-- ─── expenses: add debt payment columns (migration for existing DBs) ────────────
alter table expenses
  add column if not exists is_debt_payment boolean not null default false,
  add column if not exists debt_id         uuid references debts(id);

-- ─── expenses: add savings columns (migration for existing DBs) ─────────────
alter table expenses
  add column if not exists is_savings boolean not null default false,
  add column if not exists goal_id    uuid references budget_goals(id);

-- ─── categories: add description column (migration for existing DBs) ────────
alter table categories
  add column if not exists description text;

-- ─── categories: add track_budget column (migration for existing DBs) ───────
alter table categories
  add column if not exists track_budget boolean not null default true;

-- ─── recurring: add shared + IPC columns (migration for existing DBs) ─────────
alter table recurring
  add column if not exists is_shared        boolean         not null default false,
  add column if not exists shared_ratio     numeric(5,4)    not null default 0.5,
  add column if not exists total_amount     numeric(12, 2),
  add column if not exists update_type      text            not null default 'none',
  add column if not exists update_frequency smallint,
  add column if not exists last_updated     date,
  add column if not exists next_update_date date;

-- ─── planned_events (templates) ───────────────────────────────────────────────
create table if not exists planned_events (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  title            text not null,
  month            smallint not null check (month between 1 and 12),
  day              smallint not null check (day between 1 and 31),
  estimated_amount numeric(12,2) not null check (estimated_amount >= 0),
  category         text not null,
  notes            text,
  is_recurring     boolean not null default false,
  created_at       timestamptz not null default now()
);

alter table planned_events enable row level security;
create policy "planned_events: select own" on planned_events for select using (auth.uid() = user_id);
create policy "planned_events: insert own" on planned_events for insert with check (auth.uid() = user_id);
create policy "planned_events: update own" on planned_events for update using (auth.uid() = user_id);
create policy "planned_events: delete own" on planned_events for delete using (auth.uid() = user_id);

-- ─── planned_event_instances ──────────────────────────────────────────────────
-- Se crea solo cuando el usuario registra el gasto real asociado al evento.
-- ON DELETE SET NULL en expense_id: si el gasto se borra, la instancia vuelve a pendiente.
-- ON DELETE CASCADE en event_id: si se borra el template, se borran todas sus instancias.
create table if not exists planned_event_instances (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users(id) on delete cascade,
  event_id         uuid not null references planned_events(id) on delete cascade,
  date             date not null,
  estimated_amount numeric(12,2) not null,
  expense_id       uuid references expenses(id) on delete set null,
  created_at       timestamptz not null default now(),
  unique (event_id, date)
);

alter table planned_event_instances enable row level security;
create policy "planned_event_instances: select own" on planned_event_instances for select using (auth.uid() = user_id);
create policy "planned_event_instances: insert own" on planned_event_instances for insert with check (auth.uid() = user_id);
create policy "planned_event_instances: update own" on planned_event_instances for update using (auth.uid() = user_id);
create policy "planned_event_instances: delete own" on planned_event_instances for delete using (auth.uid() = user_id);

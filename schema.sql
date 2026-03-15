-- ============================================
-- smash.crm v2 — Database Schema
-- Paste into Supabase SQL Editor → Run
-- ============================================

create extension if not exists "uuid-ossp";

-- USERS (team members, auto-created on signup)
create table public.users (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  nickname text not null,
  role text not null default 'user' check (role in ('admin', 'user', 'farmer', 'support')),
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, nickname)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nickname', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- CUSTOMERS
create table public.customers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text default '',
  contact text default '',
  status text default 'lead' check (status in ('active', 'paused', 'churned', 'lead')),
  owner_id uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- NOTES
create table public.notes (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.customers(id) on delete cascade not null,
  text text not null,
  author_id uuid references public.users(id),
  created_at timestamptz default now()
);

-- TASKS
create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  customer_id uuid references public.customers(id) on delete cascade not null,
  text text not null,
  done boolean default false,
  assigned_to uuid references public.users(id),
  created_by uuid references public.users(id),
  due_date date,
  created_at timestamptz default now()
);

-- AUTO-UPDATE
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger customers_updated_at
  before update on public.customers
  for each row execute procedure update_updated_at();

-- RLS
alter table public.users enable row level security;
alter table public.customers enable row level security;
alter table public.notes enable row level security;
alter table public.tasks enable row level security;

create policy "auth_read_users" on public.users for select to authenticated using (true);
create policy "auth_read_customers" on public.customers for select to authenticated using (true);
create policy "auth_insert_customers" on public.customers for insert to authenticated with check (true);
create policy "auth_update_customers" on public.customers for update to authenticated using (true);
create policy "auth_delete_customers" on public.customers for delete to authenticated using (true);
create policy "auth_read_notes" on public.notes for select to authenticated using (true);
create policy "auth_insert_notes" on public.notes for insert to authenticated with check (true);
create policy "auth_delete_notes" on public.notes for delete to authenticated using (true);
create policy "auth_read_tasks" on public.tasks for select to authenticated using (true);
create policy "auth_insert_tasks" on public.tasks for insert to authenticated with check (true);
create policy "auth_update_tasks" on public.tasks for update to authenticated using (true);
create policy "auth_delete_tasks" on public.tasks for delete to authenticated using (true);

-- INDEXES
create index idx_customers_status on public.customers(status);
create index idx_customers_owner on public.customers(owner_id);
create index idx_notes_customer on public.notes(customer_id);
create index idx_tasks_customer on public.tasks(customer_id);
create index idx_tasks_done on public.tasks(done);

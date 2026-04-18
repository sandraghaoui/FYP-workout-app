create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  age integer,
  height_cm integer,
  weight_kg numeric(5,1),
  fitness_goal text,
  training_level text check (training_level in ('Beginner', 'Intermediate', 'Advanced')),
  weekly_target integer default 3,
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null,
  title text not null,
  category text,
  notes text,
  status text not null default 'planned' check (status in ('planned', 'done')),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists workout_plans_user_date_idx
  on public.workout_plans (user_id, workout_date);

alter table public.profiles enable row level security;
alter table public.workout_plans enable row level security;

drop policy if exists "Users manage own profile" on public.profiles;
create policy "Users manage own profile"
  on public.profiles
  for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Users manage own workout plans" on public.workout_plans;
create policy "Users manage own workout plans"
  on public.workout_plans
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

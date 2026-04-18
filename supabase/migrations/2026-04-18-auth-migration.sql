create extension if not exists pgcrypto;

do $$
declare
  profiles_id_type text;
  workout_owner_column text;
  workout_owner_type text;
begin
  select data_type
  into profiles_id_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'profiles'
    and column_name = 'id';

  if profiles_id_type is not null and profiles_id_type <> 'uuid' then
    drop table if exists public.profiles_legacy_manual_ids;
    create table public.profiles_legacy_manual_ids as
    table public.profiles;
    drop table public.profiles cascade;
  end if;

  select column_name, data_type
  into workout_owner_column, workout_owner_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'workout_plans'
    and column_name in ('profile_id', 'user_id')
  order by case when column_name = 'profile_id' then 0 else 1 end
  limit 1;

  if workout_owner_type is not null and workout_owner_type <> 'uuid' then
    drop table if exists public.workout_plans_legacy_manual_ids;
    create table public.workout_plans_legacy_manual_ids as
    table public.workout_plans;
    drop table public.workout_plans cascade;
  elsif workout_owner_column = 'profile_id' then
    alter table public.workout_plans rename column profile_id to user_id;
  end if;
end $$;

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

drop policy if exists "Anon can manage profiles" on public.profiles;
drop policy if exists "Anon can manage workout plans" on public.workout_plans;
drop policy if exists "Users manage own profile" on public.profiles;
drop policy if exists "Users manage own workout plans" on public.workout_plans;

create policy "Users manage own profile"
  on public.profiles
  for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Users manage own workout plans"
  on public.workout_plans
  for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- Overseer OS — Initial schema (v1.0)
-- Normalized, RLS-protected, indexed for scale. Postgres / Supabase.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
create type workout_type as enum ('strength', 'cardio', 'mobility', 'sport', 'hiit', 'other');
create type meal_slot    as enum ('breakfast', 'lunch', 'dinner', 'snack');
create type goal_status  as enum ('active', 'achieved', 'paused', 'abandoned');
create type insight_kind as enum ('trend', 'risk', 'opportunity', 'milestone');

-- ----------------------------------------------------------------------------
-- Profiles  (1:1 with auth.users)
-- ----------------------------------------------------------------------------
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  handle        text unique,
  display_name  text,
  avatar_url    text,
  timezone      text not null default 'UTC',
  -- gamification state, kept on the profile for O(1) reads
  level         int  not null default 1 check (level >= 1),
  total_xp      bigint not null default 0 check (total_xp >= 0),
  current_streak int not null default 0 check (current_streak >= 0),
  longest_streak int not null default 0 check (longest_streak >= 0),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- Workouts  (training system — raw log)
-- ----------------------------------------------------------------------------
create table workouts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  type          workout_type not null default 'strength',
  title         text,
  started_at    timestamptz not null default now(),
  duration_min  int not null check (duration_min >= 0),
  avg_hr        int check (avg_hr between 0 and 250),
  intensity     numeric(3,1) check (intensity between 0 and 10), -- RPE 0-10
  strain        numeric(4,1),    -- computed by strain engine (0-21)
  volume_kg     numeric(10,1),   -- total tonnage for strength
  notes         text,
  created_at    timestamptz not null default now()
);
create index workouts_user_started_idx on workouts (user_id, started_at desc);

-- ----------------------------------------------------------------------------
-- Sleep  (recovery system — raw log)
-- ----------------------------------------------------------------------------
create table sleep_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  night_of      date not null,
  duration_min  int not null check (duration_min >= 0),
  deep_min      int default 0 check (deep_min >= 0),
  rem_min       int default 0 check (rem_min >= 0),
  hrv_ms        int check (hrv_ms >= 0),
  resting_hr    int check (resting_hr between 20 and 150),
  efficiency    numeric(4,1) check (efficiency between 0 and 100),
  readiness     int check (readiness between 0 and 100), -- computed
  created_at    timestamptz not null default now(),
  unique (user_id, night_of)
);
create index sleep_user_night_idx on sleep_logs (user_id, night_of desc);

-- ----------------------------------------------------------------------------
-- Nutrition  (nutrition system — raw log)
-- ----------------------------------------------------------------------------
create table nutrition_logs (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  eaten_at      timestamptz not null default now(),
  slot          meal_slot not null default 'snack',
  name          text,
  calories      int  check (calories >= 0),
  protein_g     numeric(6,1) check (protein_g >= 0),
  carbs_g       numeric(6,1) check (carbs_g >= 0),
  fat_g         numeric(6,1) check (fat_g >= 0),
  hydration_ml  int check (hydration_ml >= 0),
  created_at    timestamptz not null default now()
);
create index nutrition_user_eaten_idx on nutrition_logs (user_id, eaten_at desc);

-- ----------------------------------------------------------------------------
-- Habits + check-ins
-- ----------------------------------------------------------------------------
create table habits (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null,
  cadence     text not null default 'daily',
  xp_reward   int  not null default 10 check (xp_reward >= 0),
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index habits_user_idx on habits (user_id) where archived = false;

create table habit_checkins (
  id          uuid primary key default gen_random_uuid(),
  habit_id    uuid not null references habits(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  day         date not null,
  created_at  timestamptz not null default now(),
  unique (habit_id, day)
);
create index habit_checkins_user_day_idx on habit_checkins (user_id, day desc);

-- ----------------------------------------------------------------------------
-- Goals
-- ----------------------------------------------------------------------------
create table goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  title        text not null,
  metric       text not null,            -- e.g. 'bodyweight_kg', 'weekly_strain'
  target_value numeric not null,
  current_value numeric,
  due_date     date,
  status       goal_status not null default 'active',
  created_at   timestamptz not null default now()
);
create index goals_user_status_idx on goals (user_id, status);

-- ----------------------------------------------------------------------------
-- XP events  (audit trail for gamification)
-- ----------------------------------------------------------------------------
create table xp_events (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  source      text not null,             -- 'workout' | 'sleep' | 'habit' | ...
  amount      int  not null,
  reason      text,
  created_at  timestamptz not null default now()
);
create index xp_events_user_idx on xp_events (user_id, created_at desc);

-- ----------------------------------------------------------------------------
-- Achievements (catalog + unlocks)
-- ----------------------------------------------------------------------------
create table achievements (
  key         text primary key,          -- 'first_workout', 'week_streak_7'
  name        text not null,
  description text not null,
  tier        text not null default 'bronze',
  xp_reward   int  not null default 50
);

create table achievement_unlocks (
  user_id        uuid not null references profiles(id) on delete cascade,
  achievement_key text not null references achievements(key) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  primary key (user_id, achievement_key)
);

-- ----------------------------------------------------------------------------
-- Daily metrics rollup  (analytics cache — one row per user per day)
-- ----------------------------------------------------------------------------
create table daily_metrics (
  user_id        uuid not null references profiles(id) on delete cascade,
  day            date not null,
  readiness      int check (readiness between 0 and 100),
  strain         numeric(4,1),
  sleep_min      int,
  calories       int,
  protein_g      numeric(6,1),
  xp_earned      int not null default 0,
  primary key (user_id, day)
);
create index daily_metrics_user_day_idx on daily_metrics (user_id, day desc);

-- ----------------------------------------------------------------------------
-- AI insights  (proactive intelligence ticker feed)
-- ----------------------------------------------------------------------------
create table insights (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  kind        insight_kind not null,
  title       text not null,
  body        text,
  metric      text,
  acknowledged boolean not null default false,
  created_at  timestamptz not null default now()
);
create index insights_user_idx on insights (user_id, created_at desc) where acknowledged = false;

-- ----------------------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- Auto-provision a profile when a user signs up
-- ----------------------------------------------------------------------------
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- Row Level Security — every table is user-scoped via auth.uid()
-- ============================================================================
alter table profiles            enable row level security;
alter table workouts            enable row level security;
alter table sleep_logs          enable row level security;
alter table nutrition_logs      enable row level security;
alter table habits              enable row level security;
alter table habit_checkins      enable row level security;
alter table goals               enable row level security;
alter table xp_events           enable row level security;
alter table achievement_unlocks enable row level security;
alter table daily_metrics       enable row level security;
alter table insights            enable row level security;
-- achievements is a public catalog (read-only to all authenticated users)
alter table achievements        enable row level security;

-- Profiles: a user sees/edits only their own row.
create policy "own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Generic owner policy for all user-scoped tables.
do $$
declare t text;
begin
  foreach t in array array[
    'workouts','sleep_logs','nutrition_logs','habits','habit_checkins',
    'goals','xp_events','achievement_unlocks','daily_metrics','insights'
  ] loop
    execute format($f$
      create policy "owner all" on %I
        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
    $f$, t);
  end loop;
end $$;

-- Achievement catalog: readable by any authenticated user.
create policy "catalog read" on achievements
  for select using (auth.role() = 'authenticated');

-- ----------------------------------------------------------------------------
-- Realtime: publish user-scoped tables for live dashboard updates.
-- ----------------------------------------------------------------------------
alter publication supabase_realtime add table daily_metrics, insights, xp_events;

-- ----------------------------------------------------------------------------
-- Seed: achievement catalog
-- ----------------------------------------------------------------------------
insert into achievements (key, name, description, tier, xp_reward) values
  ('first_workout', 'First Blood',       'Log your first workout.',                'bronze', 50),
  ('week_streak_7', 'Consistency',       'Maintain a 7-day streak.',               'silver', 150),
  ('strain_marathon','Iron Will',        'Accumulate 100 total strain.',           'gold',   300),
  ('early_riser',   'Early Riser',       'Log 5 nights of 7h+ sleep.',             'silver', 150),
  ('macro_master',  'Macro Master',      'Hit your protein target 7 days running.','gold',   300),
  ('level_10',      'Ascendant',         'Reach level 10.',                        'gold',   500)
on conflict (key) do nothing;

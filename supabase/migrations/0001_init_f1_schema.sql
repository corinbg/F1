-- Constructors (teams)
create table constructors (
  constructor_id text primary key,
  name text not null,
  nationality text,
  color text,
  created_at timestamptz not null default now()
);

-- Drivers
create table drivers (
  driver_id text primary key,
  code text,
  permanent_number int,
  given_name text not null,
  family_name text not null,
  nationality text,
  date_of_birth date,
  current_constructor_id text references constructors(constructor_id),
  headshot_url text,
  created_at timestamptz not null default now()
);

-- Races (a season/round = one grand prix weekend)
create table races (
  race_id text primary key, -- e.g. "2025-15"
  season int not null,
  round int not null,
  name text not null,
  circuit_name text,
  country text,
  locality text,
  race_date date,
  race_time time,
  status text not null default 'upcoming' check (status in ('upcoming','completed')),
  synced_at timestamptz,
  created_at timestamptz not null default now(),
  unique (season, round)
);

-- Race results
create table results (
  id bigint generated always as identity primary key,
  race_id text not null references races(race_id) on delete cascade,
  driver_id text not null references drivers(driver_id),
  constructor_id text references constructors(constructor_id),
  grid int,
  position int,
  position_text text,
  points numeric default 0,
  status text,
  laps int,
  time_millis bigint,
  fastest_lap_rank int,
  fastest_lap_time text,
  fastest_lap_avg_speed numeric,
  created_at timestamptz not null default now(),
  unique (race_id, driver_id)
);

-- Qualifying results
create table qualifying_results (
  id bigint generated always as identity primary key,
  race_id text not null references races(race_id) on delete cascade,
  driver_id text not null references drivers(driver_id),
  constructor_id text references constructors(constructor_id),
  position int,
  q1 text,
  q2 text,
  q3 text,
  created_at timestamptz not null default now(),
  unique (race_id, driver_id)
);

-- Driver championship standings snapshot (after each race)
create table driver_standings (
  id bigint generated always as identity primary key,
  race_id text not null references races(race_id) on delete cascade,
  driver_id text not null references drivers(driver_id),
  position int,
  points numeric,
  wins int,
  created_at timestamptz not null default now(),
  unique (race_id, driver_id)
);

-- Constructor championship standings snapshot (after each race)
create table constructor_standings (
  id bigint generated always as identity primary key,
  race_id text not null references races(race_id) on delete cascade,
  constructor_id text not null references constructors(constructor_id),
  position int,
  points numeric,
  wins int,
  created_at timestamptz not null default now(),
  unique (race_id, constructor_id)
);

-- Instagram content ideas / editorial board
create table content_ideas (
  id uuid primary key default gen_random_uuid(),
  race_id text references races(race_id) on delete cascade,
  idea_type text not null, -- podium, fastest_lap, comeback, battle, milestone, standings, preview, on_this_day, custom
  title text not null,
  caption text,
  hashtags text[] default '{}',
  stats jsonb default '{}',
  status text not null default 'idea' check (status in ('idea','draft','scheduled','posted','archived')),
  priority int default 0,
  scheduled_for timestamptz,
  source text not null default 'auto' check (source in ('auto','manual')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_results_race on results(race_id);
create index idx_qualifying_race on qualifying_results(race_id);
create index idx_driver_standings_race on driver_standings(race_id);
create index idx_constructor_standings_race on constructor_standings(race_id);
create index idx_content_ideas_race on content_ideas(race_id);
create index idx_content_ideas_status on content_ideas(status);

-- updated_at trigger for content_ideas
create or replace function set_updated_at()
returns trigger language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_content_ideas_updated_at
before update on content_ideas
for each row execute function set_updated_at();

-- RLS: public read on F1 data, public read/write on content_ideas (single-tenant internal dashboard, no auth yet)
alter table constructors enable row level security;
alter table drivers enable row level security;
alter table races enable row level security;
alter table results enable row level security;
alter table qualifying_results enable row level security;
alter table driver_standings enable row level security;
alter table constructor_standings enable row level security;
alter table content_ideas enable row level security;

create policy "public read constructors" on constructors for select using (true);
create policy "public read drivers" on drivers for select using (true);
create policy "public read races" on races for select using (true);
create policy "public read results" on results for select using (true);
create policy "public read qualifying" on qualifying_results for select using (true);
create policy "public read driver_standings" on driver_standings for select using (true);
create policy "public read constructor_standings" on constructor_standings for select using (true);

create policy "public read content_ideas" on content_ideas for select using (true);
create policy "public write content_ideas" on content_ideas for insert with check (true);
create policy "public update content_ideas" on content_ideas for update using (true);
create policy "public delete content_ideas" on content_ideas for delete using (true);

-- writes to F1 data tables happen via service_role (n8n) only, no anon insert/update/delete policies needed

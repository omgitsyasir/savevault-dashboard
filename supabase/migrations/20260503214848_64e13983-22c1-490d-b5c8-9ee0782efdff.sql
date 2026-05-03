
create table public.games (
  id uuid primary key default gen_random_uuid(),
  igdb_id bigint unique,
  name text not null,
  summary text,
  cover_url text,
  release_date date,
  platforms text[],
  created_at timestamptz not null default now()
);

create table public.devices (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  os text not null,
  created_at timestamptz not null default now()
);

create table public.saves (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  version_number integer not null default 1,
  file_hash text not null,
  size_bytes bigint default 0,
  notes text,
  restore_requested boolean not null default false,
  restored_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_saves_game on public.saves(game_id, created_at desc);

alter table public.games enable row level security;
alter table public.devices enable row level security;
alter table public.saves enable row level security;

create policy "public read games" on public.games for select using (true);
create policy "public write games" on public.games for insert with check (true);
create policy "public update games" on public.games for update using (true);
create policy "public delete games" on public.games for delete using (true);

create policy "public read devices" on public.devices for select using (true);
create policy "public write devices" on public.devices for insert with check (true);
create policy "public update devices" on public.devices for update using (true);
create policy "public delete devices" on public.devices for delete using (true);

create policy "public read saves" on public.saves for select using (true);
create policy "public write saves" on public.saves for insert with check (true);
create policy "public update saves" on public.saves for update using (true);
create policy "public delete saves" on public.saves for delete using (true);

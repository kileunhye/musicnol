create table if not exists public.class_content (
  id integer primary key check (id = 1),
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.class_content enable row level security;

drop policy if exists "Anyone can view class content" on public.class_content;
create policy "Anyone can view class content"
on public.class_content for select to anon, authenticated using (true);

drop policy if exists "Anyone can save class content" on public.class_content;
create policy "Anyone can save class content"
on public.class_content for insert to anon, authenticated with check (true);

drop policy if exists "Anyone can update class content" on public.class_content;
create policy "Anyone can update class content"
on public.class_content for update to anon, authenticated using (true) with check (true);

create table if not exists public.quiz_content (
  id integer primary key check (id = 1),
  lyric text not null,
  blank_text text not null,
  updated_at timestamptz not null default now()
);

alter table public.quiz_content enable row level security;

drop policy if exists "Anyone can view quiz content" on public.quiz_content;
create policy "Anyone can view quiz content"
on public.quiz_content for select to anon, authenticated using (true);

drop policy if exists "Anyone can save quiz content" on public.quiz_content;
create policy "Anyone can save quiz content"
on public.quiz_content for insert to anon, authenticated with check (true);

drop policy if exists "Anyone can update quiz content" on public.quiz_content;
create policy "Anyone can update quiz content"
on public.quiz_content for update to anon, authenticated using (true) with check (true);

create table if not exists public.melody_records (
  student_number text primary key,
  elapsed numeric not null check (elapsed >= 0),
  updated_at timestamptz not null default now()
);

alter table public.melody_records enable row level security;

drop policy if exists "Anyone can view melody records" on public.melody_records;
create policy "Anyone can view melody records"
on public.melody_records for select to anon, authenticated using (true);

drop policy if exists "Anyone can save melody records" on public.melody_records;
create policy "Anyone can save melody records"
on public.melody_records for insert to anon, authenticated with check (true);

drop policy if exists "Anyone can update melody records" on public.melody_records;
create policy "Anyone can update melody records"
on public.melody_records for update to anon, authenticated using (true) with check (true);

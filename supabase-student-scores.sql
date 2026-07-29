create table if not exists public.student_scores (
  student_number text not null,
  stage integer not null check (stage between 1 and 3),
  score integer not null default 0 check (score between 0 and 1000),
  hints_used integer not null default 0 check (hints_used between 0 and 3),
  updated_at timestamptz not null default now(),
  primary key (student_number, stage)
);

-- 기존 테이블이 예전 MVP의 0~10점 제한으로 만들어졌다면 제한을 합산 점수에 맞게 변경합니다.
alter table public.student_scores drop constraint if exists student_scores_score_check;
alter table public.student_scores add constraint student_scores_score_check check (score between 0 and 1000);

alter table public.student_scores enable row level security;

drop policy if exists "Students can view scores" on public.student_scores;
create policy "Students can view scores"
on public.student_scores for select
to anon, authenticated
using (true);

drop policy if exists "Students can save scores" on public.student_scores;
create policy "Students can save scores"
on public.student_scores for insert
to anon, authenticated
with check (true);

drop policy if exists "Students can update scores" on public.student_scores;
create policy "Students can update scores"
on public.student_scores for update
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Teachers can delete scores" on public.student_scores;
create policy "Teachers can delete scores"
on public.student_scores for delete
to anon, authenticated
using (true);

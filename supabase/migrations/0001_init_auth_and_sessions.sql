-- Leader 1:1 Copilot — 인증/권한/면담 기록 초기 스키마
-- Supabase 대시보드 SQL Editor에 그대로 붙여넣어 실행할 수 있다.

-- ────────────────────────────────────────────────
-- 1. 사용자 프로필과 역할
--    role: leader(일반 리더) / admin(관리자)
-- ────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text,
  role text not null default 'leader' check (role in ('leader','admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 관리자 여부 확인용. RLS 정책 안에서 profiles를 다시 조회하면 무한 재귀가 되므로
-- security definer 함수로 분리해 RLS를 우회한다.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

drop policy if exists "profiles_self_select" on public.profiles;
drop policy if exists "profiles_admin_select" on public.profiles;
drop policy if exists "profiles_self_update" on public.profiles;
drop policy if exists "profiles_admin_update" on public.profiles;

-- 리더는 자기 프로필만, 관리자는 전체 사용자 목록을 볼 수 있다
create policy "profiles_self_select" on public.profiles
  for select using ((select auth.uid()) = id);
create policy "profiles_admin_select" on public.profiles
  for select using (public.is_admin());
-- 이름만 본인이 수정 가능. 역할(role) 변경은 관리자만
create policy "profiles_self_update" on public.profiles
  for update using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id and role = (select role from public.profiles where id = (select auth.uid())));
create policy "profiles_admin_update" on public.profiles
  for update using (public.is_admin()) with check (public.is_admin());

-- ────────────────────────────────────────────────
-- 2. 초대 허용 목록 (관리자 전용)
-- ────────────────────────────────────────────────
create table if not exists public.allowed_leaders (
  email text primary key,
  note text,
  role text not null default 'leader' check (role in ('leader','admin')),
  created_at timestamptz not null default now()
);

alter table public.allowed_leaders enable row level security;

drop policy if exists "allowed_admin_all" on public.allowed_leaders;
-- 관리자만 초대 목록을 읽고 쓸 수 있다. 일반 리더는 존재조차 볼 수 없다.
create policy "allowed_admin_all" on public.allowed_leaders
  for all using (public.is_admin()) with check (public.is_admin());

-- ────────────────────────────────────────────────
-- 3. 면담 기록
--    목록에서 거르고 정렬·표시하는 값만 컬럼, 나머지는 payload JSONB
-- ────────────────────────────────────────────────
create table if not exists public.sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  track text not null check (track in ('performance','development')),
  member_name text not null,
  role text not null,
  closed_at date not null,
  grade text not null default '',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists sessions_user_closed_idx
  on public.sessions (user_id, closed_at desc, created_at desc);

alter table public.sessions enable row level security;

drop policy if exists "own_select" on public.sessions;
drop policy if exists "own_insert" on public.sessions;
drop policy if exists "own_update" on public.sessions;
drop policy if exists "own_delete" on public.sessions;

-- 읽기: 작성한 리더 본인 + 관리자(전체 열람).
-- 쓰기/수정/삭제는 작성자 본인만 가능하다. 관리자도 남의 기록을 고치거나 지울 수는 없다.
create policy "own_select" on public.sessions
  for select using ((select auth.uid()) = user_id or public.is_admin());
create policy "own_insert" on public.sessions
  for insert with check ((select auth.uid()) = user_id);
create policy "own_update" on public.sessions
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "own_delete" on public.sessions
  for delete using ((select auth.uid()) = user_id);

-- ────────────────────────────────────────────────
-- 4. 관리자용 집계 뷰 (면담 본문은 포함하지 않는다)
--    누가 얼마나 쓰고 있는지, Follow-up이 밀리지 않는지만 본다.
-- ────────────────────────────────────────────────
create or replace view public.admin_usage_stats
with (security_invoker = true) as
select
  p.id as user_id,
  p.email,
  p.display_name,
  p.role,
  count(s.id) as session_count,
  count(s.id) filter (where s.track = 'performance') as performance_count,
  count(s.id) filter (where s.track = 'development') as development_count,
  count(distinct s.member_name) as member_count,
  max(s.closed_at) as last_session_at
from public.profiles p
left join public.sessions s on s.user_id = p.id
where public.is_admin()
group by p.id, p.email, p.display_name, p.role;

-- ────────────────────────────────────────────────
-- 5. 로그인 시 프로필 자동 생성
--    역할은 초대 목록(allowed_leaders.role)에서 가져온다.
-- ────────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  invited_role text;
begin
  select role into invited_role
  from public.allowed_leaders
  where lower(email) = lower(new.email);

  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(invited_role, 'leader')
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ────────────────────────────────────────────────
-- 6. 초대되지 않은 이메일의 가입 차단
--    Supabase 대시보드 → Authentication → Hooks →
--    "Before User Created"에 아래 함수를 연결해야 동작한다.
-- ────────────────────────────────────────────────
create or replace function public.hook_restrict_signup_to_allowlist(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  signup_email text;
  allowed_count int;
begin
  signup_email := event->'user'->>'email';

  select count(*) into allowed_count
  from public.allowed_leaders
  where lower(email) = lower(signup_email);

  if allowed_count = 0 then
    return jsonb_build_object(
      'error', jsonb_build_object(
        'message', '초대된 사용자만 이용할 수 있습니다. 관리자에게 문의해주세요.',
        'http_code', 403
      )
    );
  end if;

  return '{}'::jsonb;
end;
$$;

grant execute on function public.hook_restrict_signup_to_allowlist to supabase_auth_admin;
revoke execute on function public.hook_restrict_signup_to_allowlist from authenticated, anon, public;

-- ────────────────────────────────────────────────
-- 7. 최초 관리자 등록 (이메일을 본인 것으로 바꿔서 실행)
-- ────────────────────────────────────────────────
-- insert into public.allowed_leaders (email, role, note)
-- values ('djlee@jeisys.com', 'admin', '최초 관리자')
-- on conflict (email) do update set role = 'admin';

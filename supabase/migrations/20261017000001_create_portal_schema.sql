-- VTA Corporate Portal: schema + RLS
-- ปรับจากแผนที่แนบ โดยเพิ่ม: trigger สร้าง profile อัตโนมัติ, updated_at,
-- audit log อัตโนมัติ, และ constraint URL ที่เข้มขึ้น
begin;

create schema if not exists private;

-- ---------- Tables ----------
create table public.portal_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.portal_roles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null
);

create table public.portal_user_roles (
  user_id uuid not null references public.portal_profiles(user_id) on delete cascade,
  role_id uuid not null references public.portal_roles(id) on delete restrict,
  primary key (user_id, role_id)
);

create table public.portal_apps (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  url text not null,
  icon text not null default 'app-window',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint portal_apps_https_url check (url ~* '^https://[^/\s]+')
);

create table public.portal_app_permissions (
  role_id uuid not null references public.portal_roles(id) on delete cascade,
  app_id uuid not null references public.portal_apps(id) on delete cascade,
  primary key (role_id, app_id)
);

create table public.portal_favorites (
  user_id uuid not null references public.portal_profiles(user_id) on delete cascade,
  app_id uuid not null references public.portal_apps(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, app_id)
);

create table public.portal_audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index portal_user_roles_role_idx on public.portal_user_roles(role_id);
create index portal_app_permissions_app_idx on public.portal_app_permissions(app_id);
create index portal_favorites_app_idx on public.portal_favorites(app_id);
create index portal_audit_logs_created_idx on public.portal_audit_logs(created_at desc);

-- ---------- Authorization helpers ----------
create or replace function private.is_portal_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.portal_profiles p
    join public.portal_user_roles ur on ur.user_id = p.user_id
    join public.portal_roles r on r.id = ur.role_id
    where p.user_id = (select auth.uid())
      and p.is_active
      and r.code = 'portal_admin'
  );
$$;

create or replace function private.can_access_app(target_app_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.portal_profiles p
    join public.portal_user_roles ur on ur.user_id = p.user_id
    join public.portal_app_permissions ap on ap.role_id = ur.role_id
    join public.portal_apps a on a.id = ap.app_id
    where p.user_id = (select auth.uid())
      and p.is_active
      and a.id = target_app_id
      and a.is_active
  );
$$;

revoke all on function private.is_portal_admin() from public, anon;
revoke all on function private.can_access_app(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.is_portal_admin() to authenticated;
grant execute on function private.can_access_app(uuid) to authenticated;

-- ---------- Triggers ----------
-- 1) สร้าง portal_profiles อัตโนมัติเมื่อ Admin สร้างผู้ใช้ใน Supabase Auth
--    (ไม่ให้บทบาทใดๆ อัตโนมัติ — ต้องมอบสิทธิ์ผ่านช่องทางที่เชื่อถือได้)
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.portal_profiles (user_id, display_name)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

-- 2) updated_at
create or replace function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger portal_apps_touch
before update on public.portal_apps
for each row execute function private.touch_updated_at();

-- 3) Audit log อัตโนมัติเมื่อมีการแก้ไขรายการระบบ (ไม่เก็บข้อมูลลับ)
create or replace function private.audit_portal_apps()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.portal_audit_logs (actor_id, action, entity_type, entity_id, details)
  values (
    (select auth.uid()),
    lower(tg_op),
    'portal_apps',
    coalesce(new.code, old.code),
    case tg_op
      when 'INSERT' then jsonb_build_object('url', new.url, 'is_active', new.is_active)
      when 'UPDATE' then jsonb_build_object(
        'old_url', old.url, 'new_url', new.url,
        'old_active', old.is_active, 'new_active', new.is_active)
      else jsonb_build_object('url', old.url)
    end
  );
  return coalesce(new, old);
end;
$$;

revoke all on function private.audit_portal_apps() from public, anon, authenticated;

create trigger portal_apps_audit
after insert or update or delete on public.portal_apps
for each row execute function private.audit_portal_apps();

-- ---------- Grants (ต้องกำหนดชัดเจน เพราะ policy อย่างเดียวไม่ตัดสิทธิ์ตาราง) ----------
revoke all on
  public.portal_profiles, public.portal_roles, public.portal_user_roles,
  public.portal_apps, public.portal_app_permissions,
  public.portal_favorites, public.portal_audit_logs
from anon, authenticated;

grant select on
  public.portal_profiles, public.portal_roles, public.portal_user_roles,
  public.portal_apps, public.portal_app_permissions
to authenticated;

grant update (display_name) on public.portal_profiles to authenticated;
grant select, insert, delete on public.portal_favorites to authenticated;
grant insert, update, delete on public.portal_apps to authenticated;
grant select on public.portal_audit_logs to authenticated;

-- ---------- RLS ----------
alter table public.portal_profiles enable row level security;
create policy profiles_read_self_or_admin
on public.portal_profiles for select to authenticated
using ((select auth.uid()) = user_id or (select private.is_portal_admin()));

create policy profiles_update_self
on public.portal_profiles for update to authenticated
using ((select auth.uid()) = user_id and is_active)
with check ((select auth.uid()) = user_id and is_active);

alter table public.portal_roles enable row level security;
create policy roles_read_assigned_or_admin
on public.portal_roles for select to authenticated
using (
  (select private.is_portal_admin())
  or exists (
    select 1 from public.portal_user_roles ur
    where ur.role_id = portal_roles.id
      and ur.user_id = (select auth.uid())
  )
);

alter table public.portal_user_roles enable row level security;
create policy user_roles_read_self_or_admin
on public.portal_user_roles for select to authenticated
using (user_id = (select auth.uid()) or (select private.is_portal_admin()));

alter table public.portal_apps enable row level security;
create policy apps_read_permitted
on public.portal_apps for select to authenticated
using (
  (select private.is_portal_admin())
  or (is_active and (select private.can_access_app(id)))
);
create policy apps_admin_insert
on public.portal_apps for insert to authenticated
with check ((select private.is_portal_admin()));
create policy apps_admin_update
on public.portal_apps for update to authenticated
using ((select private.is_portal_admin()))
with check ((select private.is_portal_admin()));
create policy apps_admin_delete
on public.portal_apps for delete to authenticated
using ((select private.is_portal_admin()));

alter table public.portal_app_permissions enable row level security;
create policy permissions_read_permitted_or_admin
on public.portal_app_permissions for select to authenticated
using ((select private.is_portal_admin()) or (select private.can_access_app(app_id)));

alter table public.portal_favorites enable row level security;
create policy favorites_read_self
on public.portal_favorites for select to authenticated
using (user_id = (select auth.uid()));
create policy favorites_insert_self
on public.portal_favorites for insert to authenticated
with check (user_id = (select auth.uid()) and (select private.can_access_app(app_id)));
create policy favorites_delete_self
on public.portal_favorites for delete to authenticated
using (user_id = (select auth.uid()));

alter table public.portal_audit_logs enable row level security;
create policy audit_read_admin
on public.portal_audit_logs for select to authenticated
using ((select private.is_portal_admin()));

commit;

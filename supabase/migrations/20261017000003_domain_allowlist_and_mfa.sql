-- 1) จำกัด URL ให้เป็น https และโดเมน vta-service.com (รวม subdomain) เท่านั้น
--    ปฏิเสธ trick เช่น https://vta-service.com@evil.com, https://vta-service.com.evil.com,
--    https://evilvta-service.com
-- 2) การแก้ไขรายการระบบจาก Browser ต้องผ่าน MFA (aal2)
begin;

alter table public.portal_apps drop constraint if exists portal_apps_https_url;
alter table public.portal_apps
  add constraint portal_apps_allowed_host
  check (url ~* '^https://([a-z0-9-]+\.)*vta-service\.com(:[0-9]+)?(/|\?|#|$)');

create or replace function private.is_portal_admin_mfa()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_portal_admin()
     and coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2';
$$;

revoke all on function private.is_portal_admin_mfa() from public, anon;
grant execute on function private.is_portal_admin_mfa() to authenticated;

drop policy if exists apps_admin_insert on public.portal_apps;
drop policy if exists apps_admin_update on public.portal_apps;
drop policy if exists apps_admin_delete on public.portal_apps;

create policy apps_admin_insert
on public.portal_apps for insert to authenticated
with check ((select private.is_portal_admin_mfa()));

create policy apps_admin_update
on public.portal_apps for update to authenticated
using ((select private.is_portal_admin_mfa()))
with check ((select private.is_portal_admin_mfa()));

create policy apps_admin_delete
on public.portal_apps for delete to authenticated
using ((select private.is_portal_admin_mfa()));

commit;

-- เพิ่มหมวดหมู่ (category) และสี Icon (color) ให้แต่ละระบบ
-- ใช้แสดงการ์ดแยกกลุ่มและแยกสีที่หน้าแรกของ Portal
begin;

alter table public.portal_apps
  add column if not exists category text not null default 'other',
  add column if not exists color text not null default 'blue';

alter table public.portal_apps drop constraint if exists portal_apps_category_fmt;
alter table public.portal_apps
  add constraint portal_apps_category_fmt
  check (category ~ '^[a-z][a-z0-9_]{0,29}$');

alter table public.portal_apps drop constraint if exists portal_apps_color_allowed;
alter table public.portal_apps
  add constraint portal_apps_color_allowed
  check (color in ('blue','green','orange','violet','rose','teal','amber'));

-- ค่าเริ่มต้นของ 5 ระบบเดิม (แก้ได้ที่หน้า "จัดการระบบ")
update public.portal_apps set category = 'operations', color = 'blue'   where code = 'checkin';
update public.portal_apps set category = 'operations', color = 'orange' where code = 'stock';
update public.portal_apps set category = 'hr',         color = 'violet' where code = 'namelist';
update public.portal_apps set category = 'payroll',    color = 'green'  where code = 'payroll';
update public.portal_apps set category = 'payroll',    color = 'rose'   where code = 'eslip';

commit;

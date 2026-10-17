-- รันด้วย: npx supabase test db   (ต้องมี Supabase CLI + Docker)
begin;
select plan(10);

-- ข้อมูลทดสอบ
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000a1', 'emp@test.local'),
  ('00000000-0000-0000-0000-0000000000a2', 'admin@test.local');

insert into public.portal_user_roles (user_id, role_id)
select '00000000-0000-0000-0000-0000000000a1', id from public.portal_roles where code = 'employee';
insert into public.portal_user_roles (user_id, role_id)
select '00000000-0000-0000-0000-0000000000a2', id from public.portal_roles where code = 'portal_admin';

update public.portal_apps set is_active = true, url = 'https://test.vta-service.com';

-- ===== Employee =====
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);

select results_eq(
  $$ select code from public.portal_apps order by code $$,
  $$ values ('checkin'::text), ('eslip') $$,
  'employee เห็นเฉพาะ checkin และ eslip'
);

select is_empty(
  $$ select 1 from public.portal_apps where code = 'payroll' $$,
  'employee มองไม่เห็น payroll'
);

-- RLS ปฏิเสธ UPDATE โดยได้ 0 แถว (ไม่ใช่ error) จึงตรวจว่า URL ไม่เปลี่ยน
select lives_ok(
  $$ update public.portal_apps set url = 'https://evil.example' where code = 'checkin' $$,
  'employee สั่ง update ได้แต่ไม่มีผลกับแถวใด'
);

select is(
  (select url from public.portal_apps where code = 'checkin'),
  'https://test.vta-service.com',
  'URL ของ checkin ไม่ถูกเปลี่ยนโดย employee'
);

select throws_ok(
  $$ insert into public.portal_user_roles (user_id, role_id)
     select '00000000-0000-0000-0000-0000000000a1', id from public.portal_roles where code = 'portal_admin' $$,
  '42501', null, 'employee เพิ่มบทบาทให้ตัวเองไม่ได้'
);

select throws_ok(
  $$ insert into public.portal_favorites (user_id, app_id)
     select '00000000-0000-0000-0000-0000000000a2', id from public.portal_apps where code = 'checkin' $$,
  '42501', null, 'employee สร้าง favorite ให้คนอื่นไม่ได้'
);

select is_empty(
  $$ select 1 from public.portal_audit_logs $$,
  'employee อ่าน audit log ไม่ได้'
);

-- ===== Admin =====
select set_config('request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated","aal":"aal2"}', true);

select isnt_empty(
  $$ select 1 from public.portal_apps where code = 'payroll' $$,
  'admin เห็นทุกระบบเพื่อจัดการ'
);

select throws_ok(
  $$ update public.portal_apps set url = 'http://insecure.example' where code = 'checkin' $$,
  '23514', null, 'URL ที่ไม่ใช่ https ถูกปฏิเสธโดย constraint'
);

select throws_ok(
  $$ update public.portal_apps set url = 'https://evil.example.com' where code = 'checkin' $$,
  '23514', null, 'URL นอกโดเมน vta-service.com ถูกปฏิเสธ'
);

select * from finish();
rollback;

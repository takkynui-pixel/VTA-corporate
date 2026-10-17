-- วิธีใช้: สร้างผู้ใช้คนแรกที่ Supabase Dashboard > Authentication > Users
-- (Add user, ติ๊ก Auto Confirm) แล้วแก้อีเมลด้านล่างให้ตรง จากนั้นรันใน SQL Editor
-- ไฟล์นี้ไม่ใช่ migration — รันมือครั้งเดียวเพื่อสร้าง Admin คนแรก

insert into public.portal_user_roles (user_id, role_id)
select u.id, r.id
from auth.users u, public.portal_roles r
where u.email = 'ADMIN_EMAIL_HERE'
  and r.code in ('portal_admin', 'employee')
on conflict do nothing;

-- ตัวอย่างมอบบทบาทให้พนักงานทั่วไป:
-- insert into public.portal_user_roles (user_id, role_id)
-- select u.id, r.id from auth.users u, public.portal_roles r
-- where u.email = 'somchai@company.co.th' and r.code = 'employee'
-- on conflict do nothing;

-- ปิดบัญชีพนักงานที่ลาออก (Portal จะอ่านข้อมูลไม่ได้ทันที):
-- update public.portal_profiles set is_active = false
-- where user_id = (select id from auth.users where email = 'x@company.co.th');

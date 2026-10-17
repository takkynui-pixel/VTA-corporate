-- ข้อมูลตั้งต้น: บทบาท, 5 ระบบ, สิทธิ์เริ่มต้น
-- URL ด้านล่างเป็น placeholder และตั้ง is_active = false ไว้ก่อน
-- ให้ Admin แก้ URL จริงที่หน้า "จัดการระบบ" แล้วค่อยเปิดใช้งาน
begin;

insert into public.portal_roles (code, name) values
  ('employee',     'พนักงาน'),
  ('manager',      'หัวหน้างาน / ผู้บริหาร'),
  ('hr_admin',     'HR Admin'),
  ('portal_admin', 'Portal Administrator')
on conflict (code) do nothing;

insert into public.portal_apps (code, name, description, url, icon, sort_order, is_active) values
  ('checkin',  'Check-in', 'เช็คอิน เช็คเอาต์ ลา และ OT', 'https://replace-checkin.vta-service.com', 'clock',      1, false),
  ('stock',    'Stock',    'ระบบสต๊อกสินค้าและวัสดุ',       'https://replace-stock.vta-service.com',   'package',    2, false),
  ('namelist', 'Namelist', 'รายชื่อและข้อมูลพนักงาน',        'https://replace-namelist.vta-service.com','users',      3, false),
  ('payroll',  'Payroll',  'ระบบจัดทำเงินเดือน',             'https://replace-payroll.vta-service.com', 'calculator', 4, false),
  ('eslip',    'E-Slip',   'ตรวจสอบและดาวน์โหลดสลิปเงินเดือน','https://replace-eslip.vta-service.com',  'file-text',  5, false)
on conflict (code) do nothing;

-- สิทธิ์เริ่มต้น (ปรับตามหน้าที่จริงของบริษัท)
--   employee : checkin, eslip
--   manager  : checkin, stock, eslip
--   hr_admin : checkin, namelist, payroll
--   portal_admin: ไม่ได้สิทธิ์เปิดระบบอัตโนมัติ (จัดการลิงก์ได้อย่างเดียว)
insert into public.portal_app_permissions (role_id, app_id)
select r.id, a.id
from (values
  ('employee', 'checkin'), ('employee', 'eslip'),
  ('manager',  'checkin'), ('manager',  'stock'), ('manager', 'eslip'),
  ('hr_admin', 'checkin'), ('hr_admin', 'namelist'), ('hr_admin', 'payroll')
) as m(role_code, app_code)
join public.portal_roles r on r.code = m.role_code
join public.portal_apps  a on a.code = m.app_code
on conflict do nothing;

commit;

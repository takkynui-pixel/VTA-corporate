-- เอาสิทธิ์ Stock ออกจาก role "พนักงาน" (employee)
delete from public.portal_app_permissions pap
using public.portal_roles r, public.portal_apps a
where pap.role_id = r.id
  and pap.app_id  = a.id
  and r.code = 'employee'
  and a.code = 'stock';

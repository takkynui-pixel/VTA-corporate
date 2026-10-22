# VTA Corporate Web Portal

ศูนย์รวมทางเข้าระบบงานบริษัท (Check-in, Stock, Namelist, Payroll, E-Slip)
React + Vite + TypeScript · Supabase (Auth + PostgreSQL + RLS) · Deploy บน Vercel

> ระบบทั้ง 5 ยังใช้ URL และ Login ของตัวเอง Portal ทำหน้าที่ควบคุมว่าใครเห็นลิงก์ใด
> เท่านั้น ไม่ได้เป็น SSO และไม่เก็บรหัสผ่านของระบบปลายทาง

## 1) ตั้งค่า Supabase (โปรเจกต์ใหม่ชื่อ vta-corporate-portal)

1. สร้าง Project ที่ https://supabase.com/dashboard (เลือก Region ใกล้ไทย เช่น Singapore)
2. Authentication → Providers: เปิด Email  แล้ว **ปิด "Allow new users to sign up"**
   (ให้ Admin เป็นผู้สร้างบัญชีเท่านั้น)
3. Authentication → URL Configuration: ตั้ง Site URL เป็นโดเมน Vercel จริง
   และเพิ่ม Redirect URLs (รวม `http://localhost:5173` สำหรับ dev)
4. รัน migration (เลือกวิธีใดวิธีหนึ่ง)
   - **SQL Editor**: วางไฟล์ใน `supabase/migrations/` ทีละไฟล์ตามลำดับชื่อ (…0001 → …0002 → …0003 → …0004)
   - **CLI**: `npx supabase link --project-ref <REF>` แล้ว `npx supabase db push`
5. Authentication → Users → Add user (ติ๊ก Auto Confirm) สร้างบัญชี Admin คนแรก
   แล้วแก้อีเมลใน `supabase/bootstrap_admin.sql` และรันใน SQL Editor
6. Project Settings → API: คัดลอก **Project URL** และ **Publishable (anon) key**
   ห้ามนำ service_role / secret key ไปใส่ใน Frontend หรือ Vercel ฝั่ง client

## 2) รันในเครื่อง

```bash
npm install
cp .env.example .env.local   # ใส่ URL และ Publishable key
npm run dev
npm test                     # unit test (ตรวจ URL)
```

ทดสอบ RLS (ต้องมี Docker): `npx supabase start && npx supabase test db`
(ห้ามรัน `db reset` กับฐานข้อมูล Production)

## 3) Deploy บน Vercel

1. Push โค้ดขึ้น Git (GitHub/GitLab) แล้ว Import ที่ Vercel (Framework: Vite)
2. Settings → Environment Variables เพิ่ม
   `VITE_SUPABASE_URL` และ `VITE_SUPABASE_PUBLISHABLE_KEY`
3. Deploy — `vercel.json` ตั้ง SPA rewrite และ security headers ให้แล้ว
4. กลับไปตั้ง Site URL / Redirect URLs ใน Supabase ให้ตรงกับโดเมน Vercel

## 3.1) Deploy Edge Function (จัดการผู้ใช้/บทบาท)

```bash
npx supabase login
npx supabase link --project-ref <REF>
npx supabase functions deploy admin-users
```
ฟังก์ชันใช้ service role key จาก env ของ Supabase เอง (ไม่ต้องตั้งค่าเพิ่ม และไม่อยู่ใน Frontend)
เรียกได้เฉพาะ portal_admin ที่ active และผ่าน MFA (aal2)

## 3.2) MFA (TOTP)

Supabase Dashboard → Authentication → Multi-Factor: เปิด TOTP (Enroll + Verify)
Admin ต้องตั้งค่า MFA ที่หน้า "ความปลอดภัย" (ไอคอนเฟือง) ก่อนจึงเข้าหน้าจัดการได้
การแก้ไขรายการระบบจาก Browser ถูกบังคับ aal2 ที่ฐานข้อมูลด้วย (migration …0003)

**ลำดับแนะนำสำหรับ Admin คนแรก:** login → ไปหน้าเฟือง → สแกน QR → กรอกรหัส → เข้าหน้า "ผู้ใช้และสิทธิ์"

## 4) ใส่ URL จริงของ 5 ระบบ

Login ด้วย Admin → เมนู "จัดการระบบ" → แก้ URL (ต้องเป็น https:// และโดเมน vta-service.com (รวม subdomain) — ตรวจทั้งหน้าเว็บและฐานข้อมูล) →
ติ๊ก "เปิดใช้งาน" → บันทึก (ข้อมูลตั้งต้นปิดไว้ก่อนเพราะเป็น placeholder)

## 5) จัดการผู้ใช้และสิทธิ์

- เพิ่มพนักงาน: Supabase Dashboard → Authentication → Add user
  (trigger จะสร้าง portal_profiles ให้อัตโนมัติ **แต่ยังไม่มีบทบาท** จึงยังไม่เห็นระบบใด)
- ใช้งานผ่านหน้า **ผู้ใช้และสิทธิ์** ใน Portal (สร้างบัญชี มอบบทบาท เปิด/ปิดบัญชี ตั้งรหัสผ่านใหม่)
- Admin คนแรก: ใช้ `supabase/bootstrap_admin.sql`
- สิทธิ์เริ่มต้น (แก้ได้ใน migration …0002 หรือ SQL):
  employee = Check-in, E-Slip · manager = + Stock · hr_admin = Check-in, Namelist, Payroll
- พนักงานลาออก: ตั้ง `portal_profiles.is_active = false` **และ** ปิดบัญชีในระบบปลายทางทั้ง 5 แยกต่างหาก

## สิ่งที่แก้ไข/เพิ่มจากแผนเดิม

- trigger สร้าง `portal_profiles` อัตโนมัติ, `updated_at`, และ audit log เมื่อแก้ `portal_apps`
- policy ของ `portal_roles` อ้างคอลัมน์แบบระบุตาราง (`portal_roles.id`) กันความกำกวม
- ข้อมูลตั้งต้นใช้ URL placeholder + `is_active=false` ป้องกันลิงก์ปลอมถูกแสดงโดยไม่ตั้งใจ
- เพิ่ม `vercel.json` (headers: HSTS, X-Frame-Options, nosniff ฯลฯ)

## ข้อจำกัดที่ยังต้องทำ

- โค้ดชุดนี้ **ยังไม่ได้รัน `npm run build` จริง** ในสภาพแวดล้อมที่สร้าง (ติดตั้งแพ็กเกจไม่ได้)
  ให้รัน `npm install && npm run build` ก่อน deploy และแจ้งข้อผิดพลาดถ้ามี
- ยังไม่มี UI แก้ตารางสิทธิ์ role↔ระบบ (แก้ผ่าน SQL) และยังไม่มี PWA
- ฟังก์ชัน admin-users และเทสต์ RLS ยังไม่ได้รันจริงในสภาพแวดล้อมที่สร้าง

## หน้าแรกแบบการ์ดแยกหมวด + สี Icon (migration …0004)

- ระบบแต่ละตัวมี **หมวดหมู่** (งานปฏิบัติการ / งานบุคคล / เงินเดือน / ระบบอื่น ๆ) และ **สี Icon**
  ตั้งค่าได้ที่หน้า "จัดการระบบ" — หน้าแรกจะแบ่งการ์ดเป็นกลุ่ม พร้อมปุ่มกรองตามหมวด
- ค่าเริ่มต้น: Check-in (น้ำเงิน) + Stock (ส้ม) = งานปฏิบัติการ · Namelist (ม่วง) = งานบุคคล ·
  Payroll (เขียว) + E-Slip (ชมพู) = เงินเดือน
- **ต้องรัน migration `20261022000004_app_category_color.sql` ก่อน** จึงจะบันทึกหมวด/สีได้
  (ถ้ายังไม่รัน หน้าแรกยังแสดงได้ โดยใช้ค่าเริ่มต้นตาม code ด้านบน)
- เปลี่ยนหมวดที่แสดง/ลำดับ แก้ได้ที่ `src/lib/appStyle.ts`

## Favicon

ไฟล์อยู่ที่ `public/favicon.ico` และ `public/icon-128.png` (ใช้เป็นไอคอนหน้าจอหลักบนมือถือด้วย)
ถ้าเปลี่ยนไฟล์แล้วเบราว์เซอร์ยังเห็นของเก่า ให้กด Ctrl+F5 หรือเปิดหน้าต่างส่วนตัว

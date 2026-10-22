import {
  AppWindow,
  BarChart3,
  Calculator,
  ClipboardList,
  Clock,
  FileText,
  Package,
  ShieldCheck,
  Users,
  Wallet,
  Wrench,
  type LucideIcon,
} from "lucide-react";

/** Icon ที่เลือกได้ (ชื่อ = ค่าที่เก็บในคอลัมน์ portal_apps.icon) */
export const ICONS: Record<string, LucideIcon> = {
  clock: Clock,
  package: Package,
  users: Users,
  calculator: Calculator,
  "file-text": FileText,
  wallet: Wallet,
  "clipboard-list": ClipboardList,
  "bar-chart": BarChart3,
  wrench: Wrench,
  "shield-check": ShieldCheck,
  "app-window": AppWindow,
};
export const ICON_KEYS = Object.keys(ICONS);

/** สี Icon — ต้องเขียน class เต็มเพื่อให้ Tailwind สร้างให้ */
export const COLORS: Record<
  string,
  { label: string; tile: string; dot: string }
> = {
  blue: { label: "น้ำเงิน", tile: "bg-blue-50 text-blue-600", dot: "bg-blue-500" },
  green: { label: "เขียว", tile: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-500" },
  orange: { label: "ส้ม", tile: "bg-orange-50 text-orange-500", dot: "bg-orange-400" },
  violet: { label: "ม่วง", tile: "bg-violet-50 text-violet-600", dot: "bg-violet-500" },
  rose: { label: "ชมพู", tile: "bg-rose-50 text-rose-500", dot: "bg-rose-400" },
  teal: { label: "ฟ้าอมเขียว", tile: "bg-teal-50 text-teal-600", dot: "bg-teal-500" },
  amber: { label: "เหลือง", tile: "bg-amber-50 text-amber-600", dot: "bg-amber-400" },
};
export const COLOR_KEYS = Object.keys(COLORS);

export type Category = { key: string; label: string; hint: string; dot: string };

/** หมวดหมู่ตามลำดับที่แสดงบนหน้าแรก */
export const CATEGORIES: Category[] = [
  { key: "operations", label: "งานปฏิบัติการ", hint: "เวลาทำงานและคลังสินค้า", dot: "bg-blue-500" },
  { key: "hr", label: "งานบุคคล", hint: "ข้อมูลและรายชื่อพนักงาน", dot: "bg-violet-500" },
  { key: "payroll", label: "เงินเดือน", hint: "คำนวณเงินเดือนและตรวจสอบสลิป", dot: "bg-emerald-500" },
  { key: "other", label: "ระบบอื่น ๆ", hint: "ระบบเพิ่มเติมของบริษัท", dot: "bg-slate-400" },
];

/** ค่าสำรองตาม code (ใช้เมื่อฐานข้อมูลยังไม่มีคอลัมน์ category/color) */
export const DEFAULT_STYLE: Record<string, { category: string; color: string }> = {
  checkin: { category: "operations", color: "blue" },
  stock: { category: "operations", color: "orange" },
  namelist: { category: "hr", color: "violet" },
  payroll: { category: "payroll", color: "green" },
  eslip: { category: "payroll", color: "rose" },
};

export function categoryKeyOf(category: string): string {
  return CATEGORIES.some((c) => c.key === category) ? category : "other";
}

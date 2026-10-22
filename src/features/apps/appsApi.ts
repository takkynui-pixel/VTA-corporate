import { supabase } from "../../lib/supabase";
import { DEFAULT_STYLE } from "../../lib/appStyle";

export type PortalApp = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  url: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
  category: string;
  color: string;
};

type Row = Omit<PortalApp, "category" | "color"> & {
  category?: string | null;
  color?: string | null;
};

/** ถ้าฐานข้อมูลยังไม่มีคอลัมน์ category/color (ยังไม่รัน migration 0004) ให้ใช้ค่าสำรองตาม code */
function normalize(r: Row): PortalApp {
  const d = DEFAULT_STYLE[r.code];
  return {
    ...r,
    category: r.category ?? d?.category ?? "other",
    color: r.color ?? d?.color ?? "blue",
  };
}

/** รายการที่ RLS อนุญาตให้ผู้ใช้เห็น (เฉพาะที่เปิดใช้งาน) */
export async function getPortalApps(): Promise<PortalApp[]> {
  const { data, error } = await supabase
    .from("portal_apps")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Row[]).map(normalize);
}

/** สำหรับหน้า Admin: เห็นทุกรายการ (RLS อนุญาตเฉพาะ portal_admin) */
export async function getAllPortalApps(): Promise<PortalApp[]> {
  const { data, error } = await supabase
    .from("portal_apps")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return ((data ?? []) as Row[]).map(normalize);
}

export type AppInput = Omit<PortalApp, "id">;

export async function createPortalApp(input: AppInput): Promise<void> {
  const { error } = await supabase.from("portal_apps").insert(input);
  if (error) throw error;
}

export async function updatePortalApp(
  id: string,
  patch: Partial<AppInput>,
): Promise<void> {
  const { error } = await supabase
    .from("portal_apps")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
}

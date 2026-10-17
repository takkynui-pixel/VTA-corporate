import { supabase } from "../../lib/supabase";

export type PortalApp = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  url: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
};

const COLUMNS = "id, code, name, description, url, icon, sort_order, is_active";

/** รายการที่ RLS อนุญาตให้ผู้ใช้เห็น (เฉพาะที่เปิดใช้งาน) */
export async function getPortalApps(): Promise<PortalApp[]> {
  const { data, error } = await supabase
    .from("portal_apps")
    .select(COLUMNS)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/** สำหรับหน้า Admin: เห็นทุกรายการ (RLS อนุญาตเฉพาะ portal_admin) */
export async function getAllPortalApps(): Promise<PortalApp[]> {
  const { data, error } = await supabase
    .from("portal_apps")
    .select(COLUMNS)
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
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

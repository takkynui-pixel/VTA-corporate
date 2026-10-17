import { supabase } from "../../lib/supabase";

export type AdminUser = {
  id: string;
  email: string;
  display_name: string | null;
  is_active: boolean;
  roles: string[];
  last_sign_in_at: string | null;
};

export type RoleInfo = { code: string; name: string };

async function call<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    body,
  });
  if (error) {
    let msg = "เรียกใช้งานไม่สำเร็จ";
    const res = (error as { context?: Response }).context;
    if (error.name === "FunctionsFetchError") {
      msg =
        "เชื่อมต่อ Edge Function ไม่ได้ — ตรวจว่า deploy ฟังก์ชัน admin-users แล้ว และเครือข่ายไม่ถูกบล็อก";
    } else if (res) {
      try {
        const j = await res.clone().json();
        msg = j?.error ?? j?.message ?? msg;
      } catch {
        /* ignore */
      }
      if (res.status === 404) {
        msg = "ยังไม่ได้ deploy Edge Function ชื่อ admin-users (HTTP 404)";
      } else if (msg === "เรียกใช้งานไม่สำเร็จ") {
        msg = `เรียกใช้งานไม่สำเร็จ (HTTP ${res.status})`;
      }
    }
    throw new Error(msg);
  }
  return data as T;
}

export const listUsers = () =>
  call<{ users: AdminUser[]; roles: RoleInfo[] }>({ action: "list" });

export const createUser = (p: {
  email: string;
  password: string;
  display_name: string;
  roles: string[];
}) => call<{ ok: true }>({ action: "create", ...p });

export const setRoles = (user_id: string, roles: string[]) =>
  call<{ ok: true }>({ action: "set_roles", user_id, roles });

export const setActive = (user_id: string, is_active: boolean) =>
  call<{ ok: true }>({ action: "set_active", user_id, is_active });

export const resetPassword = (user_id: string, password: string) =>
  call<{ ok: true }>({ action: "reset_password", user_id, password });

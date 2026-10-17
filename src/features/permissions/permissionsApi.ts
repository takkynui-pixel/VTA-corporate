import { supabase } from "../../lib/supabase";

export type PortalProfile = {
  user_id: string;
  display_name: string | null;
  is_active: boolean;
};

/** โหลดโปรไฟล์ + รหัสบทบาทของผู้ใช้ปัจจุบัน (ผ่าน RLS) */
export async function getMyAccess(userId: string): Promise<{
  profile: PortalProfile | null;
  roles: string[];
}> {
  const [profileRes, rolesRes] = await Promise.all([
    supabase
      .from("portal_profiles")
      .select("user_id, display_name, is_active")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("portal_user_roles")
      .select("portal_roles(code)")
      .eq("user_id", userId),
  ]);
  if (profileRes.error) throw profileRes.error;
  if (rolesRes.error) throw rolesRes.error;

  const roles = (rolesRes.data ?? []).flatMap((row) => {
    const r = row.portal_roles as unknown as
      | { code: string }
      | { code: string }[]
      | null;
    if (!r) return [];
    return Array.isArray(r) ? r.map((x) => x.code) : [r.code];
  });

  return { profile: profileRes.data as PortalProfile | null, roles };
}

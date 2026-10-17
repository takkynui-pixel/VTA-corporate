import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/** ตรวจรหัสผ่านปัจจุบันด้วย client แยก (ไม่เก็บ session) เพื่อไม่ให้กระทบ session/MFA ของผู้ใช้ */
export async function verifyPassword(
  email: string,
  password: string,
): Promise<boolean> {
  const probe = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await probe.auth.signInWithPassword({ email, password });
  return !error;
}

// Edge Function: admin-users
// จัดการผู้ใช้/บทบาทของ Portal ฝั่ง server เท่านั้น (ใช้ service role key ที่อยู่ใน env ของ Supabase)
// ผู้เรียกต้อง: Login แล้ว + เป็น portal_admin ที่ active + ยืนยัน MFA แล้ว (aal2)
import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function jwtAal(token: string): string {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(part)).aal ?? "";
  } catch {
    return "";
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_ROLES = ["employee", "manager", "hr_admin", "portal_admin"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method not allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");

    // 1) ยืนยันตัวตนผู้เรียก
    const caller = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await caller.auth.getUser(token);
    if (userErr || !userData.user) return json({ error: "ไม่ได้เข้าสู่ระบบ" }, 401);
    const me = userData.user.id;

    // 2) ต้องผ่าน MFA
    if (jwtAal(token) !== "aal2") {
      return json({ error: "ต้องยืนยัน MFA ก่อนใช้งานส่วนนี้" }, 403);
    }

    const admin = createClient(url, service, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 3) ต้องเป็น portal_admin ที่ยังเปิดใช้งาน
    const { data: adminRows, error: adminErr } = await admin
      .from("portal_user_roles")
      .select("portal_roles!inner(code), portal_profiles!inner(is_active)")
      .eq("user_id", me)
      .eq("portal_roles.code", "portal_admin")
      .eq("portal_profiles.is_active", true);
    if (adminErr || !adminRows || adminRows.length === 0) {
      return json({ error: "ไม่มีสิทธิ์ผู้ดูแลระบบ" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");

    const audit = (act: string, entityId: string, details: object) =>
      admin.from("portal_audit_logs").insert({
        actor_id: me,
        action: act,
        entity_type: "portal_users",
        entity_id: entityId,
        details,
      });

    async function roleIdMap(): Promise<Map<string, string>> {
      const { data, error } = await admin.from("portal_roles").select("id, code");
      if (error) throw error;
      return new Map((data ?? []).map((r) => [r.code as string, r.id as string]));
    }

    async function replaceRoles(userId: string, codes: string[]) {
      const clean = [...new Set(codes)].filter((c) => ALLOWED_ROLES.includes(c));
      const map = await roleIdMap();
      const { error: delErr } = await admin
        .from("portal_user_roles")
        .delete()
        .eq("user_id", userId);
      if (delErr) throw delErr;
      const rows = clean
        .map((c) => map.get(c))
        .filter((id): id is string => !!id)
        .map((role_id) => ({ user_id: userId, role_id }));
      if (rows.length) {
        const { error } = await admin.from("portal_user_roles").insert(rows);
        if (error) throw error;
      }
      return clean;
    }

    // ---------- actions ----------
    if (action === "list") {
      const { data: list, error } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      if (error) throw error;
      const [{ data: profiles }, { data: ur }, { data: roles }] = await Promise.all([
        admin.from("portal_profiles").select("user_id, display_name, is_active"),
        admin.from("portal_user_roles").select("user_id, portal_roles(code)"),
        admin.from("portal_roles").select("code, name").order("code"),
      ]);
      const pMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));
      const rMap = new Map<string, string[]>();
      for (const row of ur ?? []) {
        const pr = row.portal_roles as unknown as { code: string } | { code: string }[] | null;
        const codes = !pr ? [] : Array.isArray(pr) ? pr.map((x) => x.code) : [pr.code];
        rMap.set(row.user_id, [...(rMap.get(row.user_id) ?? []), ...codes]);
      }
      const users = list.users.map((u) => ({
        id: u.id,
        email: u.email ?? "",
        display_name: pMap.get(u.id)?.display_name ?? null,
        is_active: pMap.get(u.id)?.is_active ?? false,
        roles: rMap.get(u.id) ?? [],
        last_sign_in_at: u.last_sign_in_at ?? null,
      }));
      return json({ users, roles: roles ?? [] });
    }

    if (action === "create") {
      const email = String(body.email ?? "").trim().toLowerCase();
      const password = String(body.password ?? "");
      const displayName = String(body.display_name ?? "").trim();
      if (!EMAIL_RE.test(email)) return json({ error: "อีเมลไม่ถูกต้อง" }, 400);
      if (password.length < 10) {
        return json({ error: "รหัสผ่านต้องยาวอย่างน้อย 10 ตัวอักษร" }, 400);
      }
      const { data, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });
      if (error || !data.user) return json({ error: error?.message ?? "สร้างผู้ใช้ไม่สำเร็จ" }, 400);
      const id = data.user.id;
      await admin
        .from("portal_profiles")
        .upsert({ user_id: id, display_name: displayName || email.split("@")[0] });
      const given = await replaceRoles(id, Array.isArray(body.roles) ? body.roles : []);
      await audit("create_user", id, { email, roles: given });
      return json({ ok: true, id });
    }

    if (action === "set_roles") {
      const userId = String(body.user_id ?? "");
      const roles: string[] = Array.isArray(body.roles) ? body.roles : [];
      if (!userId) return json({ error: "ไม่พบผู้ใช้" }, 400);
      if (userId === me && !roles.includes("portal_admin")) {
        return json({ error: "ไม่สามารถถอดสิทธิ์ผู้ดูแลของตัวเองได้" }, 400);
      }
      const given = await replaceRoles(userId, roles);
      await audit("set_roles", userId, { roles: given });
      return json({ ok: true });
    }

    if (action === "set_active") {
      const userId = String(body.user_id ?? "");
      const active = body.is_active === true;
      if (!userId) return json({ error: "ไม่พบผู้ใช้" }, 400);
      if (userId === me && !active) {
        return json({ error: "ไม่สามารถปิดบัญชีของตัวเองได้" }, 400);
      }
      const { error } = await admin
        .from("portal_profiles")
        .update({ is_active: active })
        .eq("user_id", userId);
      if (error) throw error;
      // ปิดการ Login ที่ Supabase Auth ด้วย (ban) เพื่อไม่ให้ขอ session ใหม่ได้
      const { error: banErr } = await admin.auth.admin.updateUserById(userId, {
        ban_duration: active ? "none" : "876000h",
      });
      if (banErr) throw banErr;
      await audit(active ? "enable_user" : "disable_user", userId, {});
      return json({ ok: true });
    }

    if (action === "reset_password") {
      const userId = String(body.user_id ?? "");
      const password = String(body.password ?? "");
      if (!userId) return json({ error: "ไม่พบผู้ใช้" }, 400);
      if (password.length < 10) {
        return json({ error: "รหัสผ่านต้องยาวอย่างน้อย 10 ตัวอักษร" }, 400);
      }
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) throw error;
      await audit("reset_password", userId, {}); // ไม่บันทึกรหัสผ่าน
      return json({ ok: true });
    }

    return json({ error: "ไม่รู้จัก action" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: "เกิดข้อผิดพลาดภายในระบบ" }, 500);
  }
});

import { useEffect, useState, type FormEvent } from "react";
import {
  createUser,
  listUsers,
  resetPassword,
  setActive,
  setRoles,
  type AdminUser,
  type RoleInfo,
} from "../features/users/usersApi";
import { useAuth } from "../hooks/useAuth";

const field = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm";

export default function AdminUsersPage() {
  const { session } = useAuth();
  const me = session!.user.id;
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRolesList] = useState<RoleInfo[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    email: "",
    display_name: "",
    password: "",
    roles: ["employee"] as string[],
  });

  async function load() {
    try {
      const r = await listUsers();
      setUsers(r.users);
      setRolesList(r.roles);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setMsg(null);
    setErr(null);
    try {
      await fn();
      setMsg(ok);
      await load();
    } catch (e) {
      setErr((e as Error).message);
    }
  }

  function toggleRole(u: AdminUser, code: string) {
    const next = u.roles.includes(code)
      ? u.roles.filter((r) => r !== code)
      : [...u.roles, code];
    run(() => setRoles(u.id, next), `อัปเดตบทบาทของ ${u.email} แล้ว`);
  }

  function onCreate(e: FormEvent) {
    e.preventDefault();
    run(async () => {
      await createUser(form);
      setForm({ email: "", display_name: "", password: "", roles: ["employee"] });
    }, "สร้างผู้ใช้แล้ว");
  }

  function onReset(u: AdminUser) {
    const pw = window.prompt(`ตั้งรหัสผ่านใหม่ให้ ${u.email} (อย่างน้อย 10 ตัวอักษร)`);
    if (pw) run(() => resetPassword(u.id, pw), "ตั้งรหัสผ่านใหม่แล้ว");
  }

  return (
    <div>
      <h1 className="text-3xl font-semibold text-brand">ผู้ใช้และสิทธิ์</h1>
      <p className="mb-5 mt-1 text-sm text-slate-500">
        สร้างบัญชี มอบบทบาท เปิด/ปิดบัญชี — การปิดบัญชีที่นี่ไม่ได้ปิดบัญชีในระบบปลายทางทั้ง 5
        ต้องดำเนินการแยกต่างหาก
      </p>
      {msg && <p className="mb-3 text-sm text-emerald-700">{msg}</p>}
      {err && <p className="mb-3 text-sm text-red-600">{err}</p>}

      <form
        onSubmit={onCreate}
        className="mb-6 grid gap-3 rounded-[2rem] bg-white p-5 shadow-sm md:grid-cols-12"
      >
        <input required type="email" placeholder="อีเมล" className={`${field} md:col-span-3`}
          value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="ชื่อที่แสดง" className={`${field} md:col-span-2`}
          value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
        <input required type="password" minLength={10} placeholder="รหัสผ่านเริ่มต้น (≥10)" className={`${field} md:col-span-3`}
          value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <div className="flex flex-wrap items-center gap-2 text-xs md:col-span-3">
          {roles.map((r) => (
            <label key={r.code} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={form.roles.includes(r.code)}
                onChange={() =>
                  setForm({
                    ...form,
                    roles: form.roles.includes(r.code)
                      ? form.roles.filter((x) => x !== r.code)
                      : [...form.roles, r.code],
                  })
                }
              />
              {r.code}
            </label>
          ))}
        </div>
        <button type="submit" className="rounded-full bg-brand px-4 py-2 text-sm font-medium text-white md:col-span-1">
          + เพิ่ม
        </button>
      </form>

      {loading && <p className="text-slate-500">กำลังโหลด…</p>}

      <div className="space-y-3">
        {users.map((u) => (
          <div key={u.id} className="rounded-[1.5rem] bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium text-ink">
                  {u.display_name || u.email}
                  {!u.is_active && (
                    <span className="ml-2 rounded-full bg-red-50 px-2 py-0.5 text-xs text-red-600">ปิดใช้งาน</span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  {u.email} · เข้าใช้ล่าสุด{" "}
                  {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString("th-TH") : "—"}
                </div>
              </div>
              <div className="flex gap-2">
                <button type="button" onClick={() => onReset(u)}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50">
                  ตั้งรหัสผ่านใหม่
                </button>
                <button type="button" disabled={u.id === me}
                  onClick={() => run(() => setActive(u.id, !u.is_active), u.is_active ? "ปิดบัญชีแล้ว" : "เปิดบัญชีแล้ว")}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-40">
                  {u.is_active ? "ปิดบัญชี" : "เปิดบัญชี"}
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              {roles.map((r) => (
                <label key={r.code} className="flex items-center gap-1.5">
                  <input type="checkbox" checked={u.roles.includes(r.code)}
                    disabled={u.id === me && r.code === "portal_admin"}
                    onChange={() => toggleRole(u, r.code)} />
                  {r.name}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

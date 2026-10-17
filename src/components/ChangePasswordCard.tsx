import { useState, type FormEvent } from "react";
import { supabase, verifyPassword } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";

const MIN_LEN = 10;
const field =
  "mb-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm";

export function ChangePasswordCard() {
  const { session } = useAuth();
  const email = session?.user.email ?? "";
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    if (next.length < MIN_LEN) {
      setErr(`รหัสผ่านใหม่ต้องยาวอย่างน้อย ${MIN_LEN} ตัวอักษร`);
      return;
    }
    if (next !== confirm) {
      setErr("รหัสผ่านใหม่และการยืนยันไม่ตรงกัน");
      return;
    }
    if (next === current) {
      setErr("รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม");
      return;
    }
    setBusy(true);
    try {
      if (!(await verifyPassword(email, current))) {
        setErr("รหัสผ่านปัจจุบันไม่ถูกต้อง");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: next });
      if (error) {
        setErr(
          /aal2|mfa/i.test(error.message)
            ? "บัญชีผู้ดูแลต้องยืนยัน MFA ก่อนเปลี่ยนรหัสผ่าน"
            : error.message,
        );
        return;
      }
      setCurrent("");
      setNext("");
      setConfirm("");
      setMsg("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-[2rem] bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-xl font-semibold text-brand">เปลี่ยนรหัสผ่าน</h2>
      <p className="mb-4 text-xs text-slate-500">
        มีผลกับ Portal เท่านั้น ไม่เปลี่ยนรหัสผ่านของระบบปลายทางทั้ง 5
      </p>
      <input type="password" required autoComplete="current-password"
        placeholder="รหัสผ่านปัจจุบัน" className={field}
        value={current} onChange={(e) => setCurrent(e.target.value)} />
      <input type="password" required minLength={MIN_LEN} autoComplete="new-password"
        placeholder={`รหัสผ่านใหม่ (อย่างน้อย ${MIN_LEN} ตัวอักษร)`} className={field}
        value={next} onChange={(e) => setNext(e.target.value)} />
      <input type="password" required minLength={MIN_LEN} autoComplete="new-password"
        placeholder="ยืนยันรหัสผ่านใหม่" className={field}
        value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      {err && <p className="mb-3 text-sm text-red-600">{err}</p>}
      {msg && <p className="mb-3 text-sm text-emerald-700">{msg}</p>}
      <button type="submit" disabled={busy}
        className="w-full rounded-full bg-brand py-3 font-medium text-white hover:bg-brand-dark disabled:opacity-60">
        {busy ? "กำลังบันทึก…" : "บันทึกรหัสผ่านใหม่"}
      </button>
    </form>
  );
}
